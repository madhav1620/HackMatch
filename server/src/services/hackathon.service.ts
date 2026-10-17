import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/error.js";
import { parseJsonArray, toJsonArray } from "../lib/jsonArrays.js";

/**
 * Hackathon service — Discovery Hub queries + organizer authoring.
 *
 * SQLite note (dev): `techTags` is a JSON-string column, so tech filtering runs
 * in memory after the DB pass. PROD-NOTE: on Postgres store it as `String[]`
 * and swap the in-memory filter for `{ techTags: { hasSome: tech } }`.
 */

export const MODES = ["ONLINE", "OFFLINE", "HYBRID"] as const;
export const ORG_TYPES = ["INTERNAL", "EXTERNAL"] as const;
export const STATUSES = ["DRAFT", "PUBLISHED", "CLOSED"] as const;
export const SORTS = ["deadline", "prize", "recent"] as const;

export type Sort = (typeof SORTS)[number];

export type ListParams = {
  search?: string;
  mode?: string;
  orgType?: string;
  tech: string[];
  from?: Date;
  to?: Date;
  minPrize?: number;
  sort: Sort;
  page: number;
  limit: number;
  includeClosed?: boolean;
};

export type HackathonInput = {
  name: string;
  tagline?: string;
  description: string;
  logoUrl?: string;
  url?: string;
  mode: string;
  location?: string;
  orgType: string;
  prizePool: number;
  registrationDeadline: Date;
  startDate: Date;
  endDate: Date;
  techTags: string[];
  minTeamSize: number;
  maxTeamSize: number;
  status: string;
};

const CARD_SELECT = {
  id: true,
  name: true,
  tagline: true,
  description: true,
  logoUrl: true,
  url: true,
  mode: true,
  location: true,
  orgType: true,
  prizePool: true,
  registrationDeadline: true,
  startDate: true,
  endDate: true,
  techTags: true,
  minTeamSize: true,
  maxTeamSize: true,
  status: true,
  organizerId: true,
  createdAt: true,
  _count: { select: { teams: true, soloPosts: true } },
} satisfies Prisma.HackathonSelect;

type CardRow = {
  id: string;
  techTags: string;
  _count?: { teams: number; soloPosts: number } | null;
} & Record<string, unknown>;

/** Card projection: parse JSON columns, flatten counts, inject bookmark state. */
function toCard(row: CardRow, bookmarks: Map<string, string | null>) {
  const { _count, techTags, ...rest } = row;
  return {
    ...rest,
    techTags: parseJsonArray<string>(techTags),
    teamCount: _count?.teams ?? 0,
    soloPostCount: _count?.soloPosts ?? 0,
    bookmarked: bookmarks.has(row.id),
    remindAt: bookmarks.get(row.id) ?? null,
  };
}

async function bookmarksFor(userId: string | undefined, ids: string[]) {
  const map = new Map<string, string | null>();
  if (!userId || ids.length === 0) return map;
  const rows = await prisma.bookmark.findMany({
    where: { userId, hackathonId: { in: ids } },
    select: { hackathonId: true, remindAt: true },
  });
  for (const b of rows) map.set(b.hackathonId, b.remindAt ? b.remindAt.toISOString() : null);
  return map;
}

function paged(rows: CardRow[], bookmarks: Map<string, string | null>, total: number, params: ListParams) {
  return {
    items: rows.map((r) => toCard(r, bookmarks)),
    page: params.page,
    pageSize: params.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

export async function listHackathons(params: ListParams, userId?: string) {
  const where: Prisma.HackathonWhereInput = {};

  if (!params.includeClosed) where.status = "PUBLISHED";
  if (params.mode) where.mode = params.mode;
  if (params.orgType) where.orgType = params.orgType;
  if (params.minPrize !== undefined) where.prizePool = { gte: params.minPrize };
  if (params.from || params.to) {
    // `from`/`to` bound the registration deadline (i.e. "closing between…").
    where.registrationDeadline = {
      ...(params.from ? { gte: params.from } : {}),
      ...(params.to ? { lte: params.to } : {}),
    };
  }
  if (params.search) {
    // Case-insensitive LIKE on SQLite; PROD-NOTE: add mode: "insensitive" on Postgres.
    where.OR = [
      { name: { contains: params.search } },
      { tagline: { contains: params.search } },
      { description: { contains: params.search } },
      { location: { contains: params.search } },
    ];
  }

  const orderBy: Prisma.HackathonOrderByWithRelationInput[] =
    params.sort === "prize"
      ? [{ prizePool: "desc" }, { registrationDeadline: "asc" }]
      : params.sort === "recent"
        ? [{ createdAt: "desc" }]
        : [{ registrationDeadline: "asc" }];

  // Tech tags live in a JSON string column → filter in memory, then paginate.
  // Semantics: OR — a hackathon matches if it carries ANY of the selected tags
  // (discovery-friendly). PROD-NOTE: on Postgres use `{ techTags: { hasSome: tech } }`.
  if (params.tech.length > 0) {
    const wanted = params.tech.map((t) => t.toLowerCase());
    const all = (await prisma.hackathon.findMany({
      where,
      orderBy,
      select: CARD_SELECT,
    })) as CardRow[];
    const matched = all.filter((r) => {
      const tags = parseJsonArray<string>(r.techTags).map((t) => t.toLowerCase());
      return wanted.some((w) => tags.includes(w));
    });
    const start = (params.page - 1) * params.limit;
    const pageRows = matched.slice(start, start + params.limit);
    const bookmarks = await bookmarksFor(userId, pageRows.map((r) => r.id));
    return paged(pageRows, bookmarks, matched.length, params);
  }

  const [total, rows] = await Promise.all([
    prisma.hackathon.count({ where }),
    prisma.hackathon.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      select: CARD_SELECT,
    }),
  ]);
  const bookmarks = await bookmarksFor(userId, rows.map((r) => r.id));
  return paged(rows as CardRow[], bookmarks, total, params);
}

export async function getHackathon(id: string, userId?: string) {
  const row = (await prisma.hackathon.findUnique({ where: { id }, select: CARD_SELECT })) as CardRow | null;
  if (!row) throw new ApiError(404, "NOT_FOUND", "Hackathon not found");
  const bookmarks = await bookmarksFor(userId, [id]);
  return toCard(row, bookmarks);
}

function assertInput(input: { registrationDeadline: Date; startDate: Date; endDate: Date; minTeamSize: number; maxTeamSize: number }) {
  if (input.endDate < input.startDate) {
    throw new ApiError(400, "VALIDATION_ERROR", "End date must be on or after the start date");
  }
  if (input.maxTeamSize < input.minTeamSize) {
    throw new ApiError(400, "VALIDATION_ERROR", "Max team size must be at least the min team size");
  }
}

/** Shared write body — JSON-encodes techTags, normalises optional strings. */
function writeData(input: HackathonInput) {
  return {
    name: input.name,
    tagline: input.tagline ?? null,
    description: input.description,
    logoUrl: input.logoUrl ?? null,
    url: input.url ?? null,
    mode: input.mode,
    location: input.location ?? null,
    orgType: input.orgType,
    prizePool: input.prizePool,
    registrationDeadline: input.registrationDeadline,
    startDate: input.startDate,
    endDate: input.endDate,
    techTags: toJsonArray(input.techTags),
    minTeamSize: input.minTeamSize,
    maxTeamSize: input.maxTeamSize,
    status: input.status,
  };
}

export async function createHackathon(input: HackathonInput, organizerId: string) {
  assertInput(input);
  const row = (await prisma.hackathon.create({
    data: { ...writeData(input), organizerId },
    select: CARD_SELECT,
  })) as CardRow;
  return toCard(row, new Map());
}

export async function updateHackathon(
  id: string,
  userId: string,
  role: string,
  patch: Partial<HackathonInput>,
) {
  const existing = await prisma.hackathon.findUnique({ where: { id }, select: { organizerId: true } });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Hackathon not found");
  if (role !== "ADMIN" && existing.organizerId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "You can only edit hackathons you posted");
  }
  const { techTags, ...rest } = patch;
  const row = (await prisma.hackathon.update({
    where: { id },
    data: { ...rest, ...(techTags ? { techTags: toJsonArray(techTags) } : {}) },
    select: CARD_SELECT,
  })) as CardRow;
  return toCard(row, new Map());
}

export async function deleteHackathon(id: string) {
  const row = await prisma.hackathon.findUnique({ where: { id }, select: { id: true } });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Hackathon not found");
  await prisma.hackathon.delete({ where: { id } });
}

export async function listMine(organizerId: string) {
  const rows = (await prisma.hackathon.findMany({
    where: { organizerId },
    orderBy: { createdAt: "desc" },
    select: CARD_SELECT,
  })) as CardRow[];
  return { items: rows.map((r) => toCard(r, new Map())) };
}

export async function listBookmarks(userId: string) {
  const rows = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { remindAt: true, createdAt: true, hackathon: { select: CARD_SELECT } },
  });
  return {
    items: rows.map((b) => ({
      remindAt: b.remindAt ? b.remindAt.toISOString() : null,
      savedAt: b.createdAt.toISOString(),
      hackathon: toCard(b.hackathon as CardRow, new Map()),
    })),
  };
}

export async function bookmark(userId: string, hackathonId: string, remindAt?: Date) {
  const h = await prisma.hackathon.findUnique({ where: { id: hackathonId }, select: { id: true } });
  if (!h) throw new ApiError(404, "NOT_FOUND", "Hackathon not found");
  const b = await prisma.bookmark.upsert({
    where: { userId_hackathonId: { userId, hackathonId } },
    update: { remindAt: remindAt ?? null },
    create: { userId, hackathonId, remindAt: remindAt ?? null },
    select: { id: true, remindAt: true },
  });
  return { ok: true as const, id: b.id, remindAt: b.remindAt?.toISOString() ?? null, bookmarked: true };
}

export async function unbookmark(userId: string, hackathonId: string) {
  await prisma.bookmark.deleteMany({ where: { userId, hackathonId } });
  return { ok: true as const, bookmarked: false };
}
