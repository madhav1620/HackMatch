import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/error.js";
import { parseJsonArray, toJsonArray } from "../lib/jsonArrays.js";

/**
 * Team Matchmaking service — squads, the per-hackathon board, the join-request
 * workflow, and solo-builder ("Looking for Team") posts.
 *
 * SQLite note (dev): `requiredRoles` / `requiredSkills` are JSON-string columns,
 * so skill / role filtering runs in memory after the DB pass.
 * PROD-NOTE: on Postgres use native `String[]` columns and `{ hasSome: ... }`.
 *
 * Privacy rule (Instant Connect): `contactValue` is only projected to a confirmed
 * member, the squad leader, or an admin — never on a public board payload.
 */

export const PRIMARY_ROLES = [
  "FRONTEND",
  "BACKEND",
  "AIML",
  "UIUX",
  "PITCH",
  "DEVOPS",
  "DATA",
  "OTHER",
] as const;

export const TEAM_CHANNELS = ["DISCORD", "WHATSAPP", "EMAIL"] as const;
export const REQUEST_STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "CANCELLED"] as const;
/** Review outcomes a squad lead may set. */
export const REVIEW_STATUSES = ["ACCEPTED", "DECLINED"] as const;
export const COMMITMENTS = ["FULL_SPRINT", "PARTIAL", "FLEXIBLE"] as const;

export type Viewer = { userId?: string; isAdmin?: boolean };

// ── projections ───────────────────────────────────────────────────────────────

const MEMBER_SELECT = {
  role: true,
  isLeader: true,
  joinedAt: true,
  user: { select: { id: true, name: true, avatarUrl: true, primaryRole: true } },
} satisfies Prisma.TeamMemberSelect;

const TEAM_SELECT = {
  id: true,
  name: true,
  description: true,
  track: true,
  isRecruiting: true,
  openSlots: true,
  hackathonId: true,
  requiredRoles: true,
  requiredSkills: true,
  contactChannel: true,
  contactValue: true,
  createdById: true,
  createdAt: true,
  members: { select: MEMBER_SELECT, orderBy: [{ isLeader: "desc" }, { joinedAt: "asc" }] },
  hackathon: { select: { id: true, name: true, maxTeamSize: true, mode: true } },
} satisfies Prisma.TeamSelect;

const REQUEST_SELECT = {
  id: true,
  teamId: true,
  requesterId: true,
  type: true,
  message: true,
  role: true,
  portfolioUrl: true,
  commitment: true,
  status: true,
  reviewedAt: true,
  createdAt: true,
  requester: {
    select: { id: true, name: true, avatarUrl: true, primaryRole: true, skills: true },
  },
} satisfies Prisma.JoinRequestSelect;

const SOLO_SELECT = {
  id: true,
  hackathonId: true,
  userId: true,
  pitch: true,
  isOpen: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      primaryRole: true,
      skills: true,
      availability: true,
      githubUrl: true,
    },
  },
} satisfies Prisma.SoloPostSelect;

type TeamRow = {
  id: string;
  name: string;
  description: string;
  track: string | null;
  isRecruiting: boolean;
  openSlots: number;
  hackathonId: string;
  requiredRoles: string;
  requiredSkills: string;
  contactChannel: string;
  contactValue: string | null;
  createdById: string;
  createdAt: Date;
  members: {
    role: string;
    isLeader: boolean;
    joinedAt: Date;
    user: { id: string; name: string; avatarUrl: string | null; primaryRole: string };
  }[];
  hackathon: { id: string; name: string; maxTeamSize: number; mode: string };
};

type RequestRow = {
  requester: { id: string; name: string; avatarUrl: string | null; primaryRole: string; skills: string };
} & Record<string, unknown>;

/** Public team projection. **Contact is null unless the viewer is on the squad.** */
function toTeamCard(row: TeamRow, viewer: Viewer, myRequest: { id: string; status: string } | null) {
  const { requiredRoles, requiredSkills, contactChannel, contactValue, createdById, members, ...rest } = row;
  const isMember = Boolean(viewer.userId) && members.some((m) => m.user.id === viewer.userId);
  const isLeader =
    Boolean(viewer.userId) &&
    (createdById === viewer.userId || members.some((m) => m.user.id === viewer.userId && m.isLeader));
  const canContact = isMember || isLeader || Boolean(viewer.isAdmin);

  return {
    ...rest,
    requiredRoles: parseJsonArray<string>(requiredRoles),
    requiredSkills: parseJsonArray<string>(requiredSkills),
    filledSlots: members.length,
    slotsTotal: members.length + row.openSlots,
    memberIds: members.map((m) => m.user.id),
    isMember,
    isLeader,
    myRequest,
    contact: canContact && contactValue ? { channel: contactChannel, value: contactValue } : null,
    members: members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      primaryRole: m.user.primaryRole,
      role: m.role,
      isLeader: m.isLeader,
      joinedAt: m.joinedAt,
    })),
  };
}

function toRequest(row: RequestRow) {
  return {
    ...row,
    requester: { ...row.requester, skills: parseJsonArray<string>(row.requester.skills) },
  };
}

/** teamId → the viewer's own request on that team (any status). */
async function myRequestMap(userId: string | undefined, teamIds: string[]) {
  const map = new Map<string, { id: string; status: string }>();
  if (!userId || teamIds.length === 0) return map;
  const rows = await prisma.joinRequest.findMany({
    where: { requesterId: userId, teamId: { in: teamIds } },
    select: { id: true, status: true, teamId: true },
  });
  for (const r of rows) map.set(r.teamId, { id: r.id, status: r.status });
  return map;
}

// ── team matchmaking board ────────────────────────────────────────────────────

export type TeamListParams = {
  skills: string[];
  role?: string;
  openOnly?: boolean;
  page: number;
  limit: number;
};

/** Board for one hackathon — public, but enriched with the viewer's own state. */
export async function listTeams(hackathonId: string, params: TeamListParams, viewer: Viewer) {
  const hack = await prisma.hackathon.findUnique({ where: { id: hackathonId }, select: { id: true } });
  if (!hack) throw new ApiError(404, "NOT_FOUND", "Hackathon not found");

  const where: Prisma.TeamWhereInput = { hackathonId };
  if (params.openOnly) {
    where.isRecruiting = true;
    where.openSlots = { gt: 0 };
  }

  const rows = (await prisma.team.findMany({
    where,
    orderBy: [{ isRecruiting: "desc" }, { openSlots: "desc" }, { createdAt: "asc" }],
    select: TEAM_SELECT,
  })) as TeamRow[];

  // JSON-string columns → in-memory filtering (PROD-NOTE: hasSome / has on Postgres).
  let filtered = rows;
  if (params.role) filtered = filtered.filter((r) => parseJsonArray<string>(r.requiredRoles).includes(params.role as string));
  if (params.skills.length > 0) {
    const wanted = params.skills.map((s) => s.toLowerCase());
    filtered = filtered.filter((r) => {
      const tags = parseJsonArray<string>(r.requiredSkills).map((s) => s.toLowerCase());
      return wanted.some((w) => tags.includes(w));
    });
  }

  const start = (params.page - 1) * params.limit;
  const pageRows = filtered.slice(start, start + params.limit);
  const myRequests = await myRequestMap(viewer.userId, pageRows.map((r) => r.id));

  return {
    items: pageRows.map((r) => toTeamCard(r, viewer, myRequests.get(r.id) ?? null)),
    page: params.page,
    pageSize: params.limit,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / params.limit)),
    openSlots: filtered.reduce((n, r) => n + r.openSlots, 0),
    recruitingTeams: filtered.filter((r) => r.isRecruiting && r.openSlots > 0).length,
  };
}

// ── squad detail + authoring ──────────────────────────────────────────────────

export async function getTeam(id: string, viewer: Viewer) {
  const row = (await prisma.team.findUnique({ where: { id }, select: TEAM_SELECT })) as TeamRow | null;
  if (!row) throw new ApiError(404, "NOT_FOUND", "Team not found");

  const mine = await myRequestMap(viewer.userId, [id]);
  const card = toTeamCard(row, viewer, mine.get(id) ?? null);

  const pending = card.isLeader || viewer.isAdmin
    ? (await prisma.joinRequest.findMany({
        where: { teamId: id, status: "PENDING" },
        orderBy: { createdAt: "asc" },
        select: REQUEST_SELECT,
      })).map((r) => toRequest(r as RequestRow))
    : [];

  return { ...card, pendingRequests: pending };
}

export type TeamInput = {
  name: string;
  description: string;
  track?: string;
  openSlots?: number;
  requiredRoles: string[];
  requiredSkills: string[];
  contactChannel: string;
  contactValue?: string;
};

function writeTeam(input: Partial<TeamInput>) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.track !== undefined) data.track = input.track || null;
  if (input.requiredRoles !== undefined) data.requiredRoles = toJsonArray(input.requiredRoles);
  if (input.requiredSkills !== undefined) data.requiredSkills = toJsonArray(input.requiredSkills);
  if (input.contactChannel !== undefined) data.contactChannel = input.contactChannel;
  if (input.contactValue !== undefined) data.contactValue = input.contactValue || null;
  return data;
}

function assertTeamInput(input: Partial<TeamInput>) {
  if (input.requiredRoles?.some((r) => !(PRIMARY_ROLES as readonly string[]).includes(r))) {
    throw new ApiError(400, "VALIDATION_ERROR", "Unknown role in requiredRoles");
  }
  if (input.contactChannel && !(TEAM_CHANNELS as readonly string[]).includes(input.contactChannel)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Unknown contact channel");
  }
}

/** Create a squad; the caller becomes the founding member / leader. */
export async function createTeam(hackathonId: string, userId: string, input: TeamInput) {
  assertTeamInput(input);
  const hack = await prisma.hackathon.findUnique({
    where: { id: hackathonId },
    select: { id: true, maxTeamSize: true },
  });
  if (!hack) throw new ApiError(404, "NOT_FOUND", "Hackathon not found");

  const led = await prisma.team.count({ where: { hackathonId, createdById: userId } });
  if (led > 0) throw new ApiError(409, "CONFLICT", "You already lead a squad in this hackathon");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { primaryRole: true } });
  const maxOpen = Math.max(0, hack.maxTeamSize - 1);
  const openSlots = Math.max(0, Math.min(input.openSlots ?? maxOpen, maxOpen));

  const row = (await prisma.team.create({
    data: {
      hackathonId,
      createdById: userId,
      name: input.name,
      description: input.description,
      track: input.track || null,
      openSlots,
      isRecruiting: openSlots > 0,
      requiredRoles: toJsonArray(input.requiredRoles),
      requiredSkills: toJsonArray(input.requiredSkills),
      contactChannel: input.contactChannel,
      contactValue: input.contactValue || null,
      members: { create: { userId, role: user?.primaryRole ?? input.requiredRoles[0] ?? "OTHER", isLeader: true } },
    },
    select: TEAM_SELECT,
  })) as unknown as TeamRow;

  return toTeamCard(row, { userId }, null);
}

function assertLead(createdById: string, viewer: Viewer) {
  if (createdById !== viewer.userId && !viewer.isAdmin) {
    throw new ApiError(403, "FORBIDDEN", "Only the squad lead can do that");
  }
}

export async function updateTeam(id: string, viewer: Viewer, input: Partial<TeamInput> & { isRecruiting?: boolean; openSlots?: number }) {
  assertTeamInput(input);
  const row = await loadTeamForLead(id, viewer);

  const data: Record<string, unknown> = writeTeam(input);
  if (input.isRecruiting !== undefined) data.isRecruiting = input.isRecruiting;
  if (input.openSlots !== undefined) {
    const maxOpen = Math.max(0, row.hackathon.maxTeamSize - row.members);
    if (input.openSlots < 0 || input.openSlots > maxOpen) {
      throw new ApiError(400, "VALIDATION_ERROR", `Open slots must be between 0 and ${maxOpen}`);
    }
    data.openSlots = input.openSlots;
  }

  const updated = (await prisma.team.update({ where: { id }, data, select: TEAM_SELECT })) as TeamRow;
  const mine = await myRequestMap(viewer.userId, [id]);
  return toTeamCard(updated, viewer, mine.get(id) ?? null);
}

async function loadTeamForLead(id: string, viewer: Viewer) {
  const row = await prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      createdById: true,
      openSlots: true,
      members: { select: { userId: true } },
      hackathon: { select: { maxTeamSize: true } },
    },
  });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Team not found");
  assertLead(row.createdById, viewer);
  return { ...row, members: row.members.length };
}

export async function deleteTeam(id: string, viewer: Viewer) {
  await loadTeamForLead(id, viewer);
  await prisma.team.delete({ where: { id } });
}

/** Squads the viewer belongs to (leading or member) — with their role + hackathon. */
export async function listMyTeams(userId: string) {
  const rows = (await prisma.team.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    select: {
      ...TEAM_SELECT,
      members: {
        select: { role: true, isLeader: true, userId: true },
      },
    },
  })) as (Omit<TeamRow, "members"> & { members: { role: string; isLeader: boolean; userId: string }[] })[];

  const items = rows.map((r) => {
    const { requiredRoles, requiredSkills, contactChannel, contactValue, members, ...rest } = r;
    const me = members.find((m) => m.userId === userId);
    return {
      ...rest,
      requiredRoles: parseJsonArray<string>(requiredRoles),
      requiredSkills: parseJsonArray<string>(requiredSkills),
      filledSlots: members.length,
      slotsTotal: members.length + r.openSlots,
      contact: contactValue ? { channel: contactChannel, value: contactValue } : null,
      myRole: me?.role ?? null,
      isLeader: Boolean(me?.isLeader),
      memberCount: members.length,
    };
  });

  return { items };
}

// ── join requests ─────────────────────────────────────────────────────────────

export type RequestInput = {
  message?: string;
  role?: string;
  portfolioUrl?: string;
  commitment?: string;
};

/** Send (or re-open) a join request on a recruiting squad. */
export async function requestJoin(teamId: string, userId: string, input: RequestInput) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, isRecruiting: true, openSlots: true, createdById: true, members: { select: { userId: true } } },
  });
  if (!team) throw new ApiError(404, "NOT_FOUND", "Team not found");
  if (team.createdById === userId || team.members.some((m) => m.userId === userId)) {
    throw new ApiError(409, "CONFLICT", "You are already on this squad");
  }
  if (!team.isRecruiting || team.openSlots <= 0) {
    throw new ApiError(409, "CONFLICT", "This squad is not recruiting right now");
  }
  if (input.role && !(PRIMARY_ROLES as readonly string[]).includes(input.role)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Unknown role");
  }
  if (input.commitment && !(COMMITMENTS as readonly string[]).includes(input.commitment)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Unknown commitment window");
  }

  const existing = await prisma.joinRequest.findUnique({
    where: { teamId_requesterId: { teamId, requesterId: userId } },
    select: { id: true, status: true },
  });
  if (existing?.status === "PENDING") {
    throw new ApiError(409, "CONFLICT", "You already have a pending application for this squad");
  }

  const data = {
    message: input.message ?? null,
    role: input.role ?? null,
    portfolioUrl: input.portfolioUrl ?? null,
    commitment: input.commitment ?? null,
    status: "PENDING",
    reviewedAt: null,
  };

  const request = await prisma.joinRequest.upsert({
    where: { teamId_requesterId: { teamId, requesterId: userId } },
    update: data,
    create: { teamId, requesterId: userId, type: "JOIN", ...data },
    select: REQUEST_SELECT,
  });
  return toRequest(request as RequestRow);
}

/** Incoming applications for a squad — squad lead (or admin) only. */
export async function listTeamRequests(teamId: string, viewer: Viewer, status = "PENDING") {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, createdById: true } });
  if (!team) throw new ApiError(404, "NOT_FOUND", "Team not found");
  assertLead(team.createdById, viewer);

  const rows = await prisma.joinRequest.findMany({
    where: { teamId, ...(status === "ALL" ? {} : { status }) },
    orderBy: { createdAt: "desc" },
    select: REQUEST_SELECT,
  });
  return { items: rows.map((r) => toRequest(r as RequestRow)) };
}

/** Accept / decline an application. Accepting adds the member and burns a slot. */
export async function reviewRequest(requestId: string, viewer: Viewer, status: string) {
  if (!(REVIEW_STATUSES as readonly string[]).includes(status)) {
    throw new ApiError(400, "VALIDATION_ERROR", "status must be ACCEPTED or DECLINED");
  }
  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      teamId: true,
      requesterId: true,
      role: true,
      status: true,
      requester: { select: { primaryRole: true } },
      team: {
        select: {
          id: true,
          createdById: true,
          openSlots: true,
          isRecruiting: true,
          members: { select: { userId: true } },
        },
      },
    },
  });
  if (!request) throw new ApiError(404, "NOT_FOUND", "Request not found");
  assertLead(request.team.createdById, viewer);
  if (request.status !== "PENDING") throw new ApiError(409, "CONFLICT", `Request already ${request.status.toLowerCase()}`);

  if (status === "DECLINED") {
    const updated = await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED", reviewedAt: new Date() },
      select: REQUEST_SELECT,
    });
    return toRequest(updated as RequestRow);
  }

  if (request.team.members.some((m) => m.userId === request.requesterId)) {
    throw new ApiError(409, "CONFLICT", "That student is already on the squad");
  }
  if (request.team.openSlots <= 0) {
    throw new ApiError(409, "CONFLICT", "No open slots left on this squad");
  }

  const [, updated] = await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: request.teamId,
        userId: request.requesterId,
        role: request.role ?? request.requester.primaryRole,
        isLeader: false,
      },
      select: { id: true },
    }),
    prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED", reviewedAt: new Date() },
      select: REQUEST_SELECT,
    }),
    prisma.team.update({
      where: { id: request.teamId },
      data: {
        openSlots: { decrement: 1 },
        isRecruiting: request.team.openSlots - 1 > 0,
      },
      select: { id: true },
    }),
  ]);

  return toRequest(updated as RequestRow);
}

/** Applicant cancels their own pending request. */
export async function cancelRequest(requestId: string, userId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId }, select: { id: true, requesterId: true, status: true } });
  if (!request) throw new ApiError(404, "NOT_FOUND", "Request not found");
  if (request.requesterId !== userId) throw new ApiError(403, "FORBIDDEN", "Not your request");
  if (request.status !== "PENDING") throw new ApiError(409, "CONFLICT", "Only pending requests can be cancelled");

  const updated = await prisma.joinRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED", reviewedAt: new Date() },
    select: REQUEST_SELECT,
  });
  return toRequest(updated as RequestRow);
}

export const OUTGOING_SELECT = {
  id: true,
  teamId: true,
  type: true,
  message: true,
  role: true,
  portfolioUrl: true,
  commitment: true,
  status: true,
  reviewedAt: true,
  createdAt: true,
  requester: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      primaryRole: true,
      skills: true,
    },
  },
  team: {
    select: {
      id: true,
      name: true,
      track: true,
      openSlots: true,
      isRecruiting: true,
      hackathon: { select: { id: true, name: true, registrationDeadline: true } },
      members: { select: { userId: true, isLeader: true, role: true } },
    },
  },
} satisfies Prisma.JoinRequestSelect;

/** Outgoing applications + incoming requests on the squads the viewer leads. */
export async function listMyRequests(userId: string) {
  const [outgoingRows, inboundRows] = await Promise.all([
    prisma.joinRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: "desc" },
      select: OUTGOING_SELECT,
    }),
    prisma.joinRequest.findMany({
      where: { status: "PENDING", team: { createdById: userId } },
      orderBy: { createdAt: "desc" },
      select: { ...REQUEST_SELECT, team: { select: { id: true, name: true, hackathon: { select: { id: true, name: true } } } } },
    }),
  ]);

  return {
    outgoing: outgoingRows.map((r) => {
      const { members, ...team } = r.team;
      return {
        ...r,
        team: { ...team, memberCount: members.length, filledSlots: members.length, slotsTotal: members.length + r.team.openSlots },
      };
    }),
    incoming: inboundRows.map((r) => toRequest(r as RequestRow)),
  };
}

// ── solo builders ("Looking for Team") ────────────────────────────────────────

export type SoloListParams = { skills: string[]; role?: string; page: number; limit: number };

type SoloRow = {
  id: string;
  hackathonId: string;
  userId: string;
  pitch: string;
  isOpen: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    primaryRole: string;
    skills: string;
    availability: string;
    githubUrl: string | null;
  };
};

export async function listSoloPosts(hackathonId: string, params: SoloListParams, viewer: Viewer) {
  const hack = await prisma.hackathon.findUnique({ where: { id: hackathonId }, select: { id: true } });
  if (!hack) throw new ApiError(404, "NOT_FOUND", "Hackathon not found");

  const rows = (await prisma.soloPost.findMany({
    where: { hackathonId },
    orderBy: { createdAt: "desc" },
    select: SOLO_SELECT,
  })) as SoloRow[];

  const all = rows.map((r) => ({ ...r, user: { ...r.user, skills: parseJsonArray<string>(r.user.skills) } }));

  let filtered = all;
  if (params.role) filtered = filtered.filter((r) => r.user.primaryRole === params.role);
  if (params.skills.length > 0) {
    const wanted = params.skills.map((s) => s.toLowerCase());
    filtered = filtered.filter((r) => {
      const tags = r.user.skills.map((s) => s.toLowerCase());
      return wanted.some((w) => tags.includes(w));
    });
  }

  const start = (params.page - 1) * params.limit;
  const pageRows = filtered.slice(start, start + params.limit);
  const mine = all.find((r) => r.userId === viewer.userId) ?? null;

  return {
    items: pageRows,
    page: params.page,
    pageSize: params.limit,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / params.limit)),
    mine,
  };
}

/** Upsert the viewer's "Looking for Team" post for a hackathon. */
export async function upsertSoloPost(hackathonId: string, userId: string, pitch: string) {
  const hack = await prisma.hackathon.findUnique({ where: { id: hackathonId }, select: { id: true } });
  if (!hack) throw new ApiError(404, "NOT_FOUND", "Hackathon not found");

  const row = await prisma.soloPost.upsert({
    where: { hackathonId_userId: { hackathonId, userId } },
    update: { pitch, isOpen: true },
    create: { hackathonId, userId, pitch, isOpen: true },
    select: SOLO_SELECT,
  });
  return { ...row, user: { ...row.user, skills: parseJsonArray<string>(row.user.skills) } };
}

export async function deleteSoloPost(id: string, viewer: Viewer) {
  const row = await prisma.soloPost.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Solo post not found");
  if (row.userId !== viewer.userId && !viewer.isAdmin) throw new ApiError(403, "FORBIDDEN", "Not your post");
  await prisma.soloPost.delete({ where: { id } });
}
