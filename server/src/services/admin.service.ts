import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/error.js";
import { isCollegeEmail } from "./auth.service.js";

export const ADMIN_ROLES = ["STUDENT", "ORGANIZER", "ADMIN"] as const;
const PRIMARY_ROLES = ["FRONTEND", "BACKEND", "AIML", "UIUX", "PITCH", "DEVOPS", "DATA", "OTHER"] as const;

const optionalUrl = z.string().url().nullable();
export const userPatchSchema = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
  name: z.string().trim().min(2).max(80).optional(),
  verified: z.boolean().optional(),
  role: z.enum(ADMIN_ROLES).optional(),
  primaryRole: z.enum(PRIMARY_ROLES).optional(),
  bio: z.string().max(500).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
  avatarUrl: optionalUrl.optional(),
  githubUrl: optionalUrl.optional(),
  linkedinUrl: optionalUrl.optional(),
  portfolioUrl: optionalUrl.optional(),
  discordHandle: z.string().trim().max(40).nullable().optional(),
  whatsappNo: z.string().trim().max(20).nullable().optional(),
  availability: z.enum(["AVAILABLE", "BUSY", "UNAVAILABLE"]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const teamPatchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  track: z.string().trim().max(160).nullable().optional(),
  isRecruiting: z.boolean().optional(),
  openSlots: z.number().int().min(0).max(100).optional(),
  requiredRoles: z.array(z.enum(PRIMARY_ROLES)).max(8).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
  contactChannel: z.enum(["DISCORD", "WHATSAPP", "EMAIL"]).optional(),
  contactValue: z.string().trim().max(160).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");

export type PageParams = { page: number; limit: number; search?: string };

const USER_SELECT = {
  id: true, email: true, name: true, avatarUrl: true, verified: true, role: true,
  primaryRole: true, bio: true, skills: true, githubUrl: true, linkedinUrl: true,
  portfolioUrl: true, discordHandle: true, whatsappNo: true, availability: true,
  createdAt: true, updatedAt: true,
  _count: { select: { teams: true, teamsCreated: true, requestsSent: true, hackathons: true, bookmarks: true, soloPosts: true } },
} satisfies Prisma.UserSelect;

function paged<T>(items: T[], total: number, page: number, limit: number) {
  return { items, total, page, pageSize: limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function summary() {
  const now = new Date();
  const [users, upcomingEvents, draftEvents, teams, pendingRequests, soloPosts] = await Promise.all([
    prisma.user.count(),
    prisma.hackathon.count({ where: { endDate: { gte: now }, status: "PUBLISHED" } }),
    prisma.hackathon.count({ where: { status: "DRAFT" } }),
    prisma.team.count(),
    prisma.joinRequest.count({ where: { status: "PENDING" } }),
    prisma.soloPost.count({ where: { isOpen: true } }),
  ]);
  return { users, upcomingEvents, draftEvents, teams, pendingRequests, soloPosts };
}

export async function listEvents(params: PageParams & { status?: string; scope?: "upcoming" | "all" }) {
  const where: Prisma.HackathonWhereInput = {};
  if (params.scope !== "all") where.endDate = { gte: new Date() };
  if (params.status) where.status = params.status;
  if (params.search) where.OR = [
    { name: { contains: params.search, mode: "insensitive" } },
    { location: { contains: params.search, mode: "insensitive" } },
    { tagline: { contains: params.search, mode: "insensitive" } },
  ];
  const [total, items] = await Promise.all([
    prisma.hackathon.count({ where }),
    prisma.hackathon.findMany({
      where, orderBy: [{ registrationDeadline: "asc" }, { id: "asc" }],
      skip: (params.page - 1) * params.limit, take: params.limit,
      include: { organizer: { select: { id: true, name: true, email: true } }, _count: { select: { teams: true, soloPosts: true, bookmarks: true } } },
    }),
  ]);
  return paged(items, total, params.page, params.limit);
}

export async function getEvent(id: string) {
  const event = await prisma.hackathon.findUnique({ where: { id }, include: {
    organizer: { select: { id: true, name: true, email: true } },
    _count: { select: { teams: true, soloPosts: true, bookmarks: true } },
  } });
  if (!event) throw new ApiError(404, "NOT_FOUND", "Event not found");
  return event;
}

export async function listUsers(params: PageParams & { role?: string }) {
  const where: Prisma.UserWhereInput = {};
  if (params.role) where.role = params.role;
  if (params.search) where.OR = [
    { name: { contains: params.search, mode: "insensitive" } },
    { email: { contains: params.search, mode: "insensitive" } },
  ];
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: USER_SELECT, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (params.page - 1) * params.limit, take: params.limit }),
  ]);
  return paged(items, total, params.page, params.limit);
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id }, select: {
      ...USER_SELECT,
      teams: { select: { id: true, role: true, isLeader: true, team: { select: { id: true, name: true, hackathon: { select: { id: true, name: true } } } } } },
      requestsSent: { select: { id: true, status: true, createdAt: true, team: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
      hackathons: { select: { id: true, name: true, status: true }, orderBy: { createdAt: "desc" }, take: 20 },
      bookmarks: { select: { id: true, createdAt: true, hackathon: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
      soloPosts: { select: { id: true, pitch: true, isOpen: true, hackathon: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");
  return user;
}

export async function updateUser(id: string, adminId: string, patch: z.infer<typeof userPatchSchema>) {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, email: true } });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "User not found");
  if (id === adminId && ((patch.role && patch.role !== "ADMIN") || patch.verified === false)) {
    throw new ApiError(400, "LAST_ADMIN", "You cannot remove your own admin access");
  }
  if ((patch.role ?? existing.role) !== "ADMIN" && !isCollegeEmail(patch.email ?? existing.email)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Use an allowed college email domain");
  }
  if (existing.role === "ADMIN" && patch.role && patch.role !== "ADMIN") {
    const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (totalAdmins <= 1) throw new ApiError(400, "LAST_ADMIN", "At least one admin account is required");
  }
  try {
    return await prisma.user.update({ where: { id }, data: patch, select: USER_SELECT });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new ApiError(409, "EMAIL_TAKEN", "This email is already in use");
    }
    throw error;
  }
}

export async function listTeams(params: PageParams) {
  const where: Prisma.TeamWhereInput = params.search ? { OR: [
    { name: { contains: params.search, mode: "insensitive" } },
    { hackathon: { name: { contains: params.search, mode: "insensitive" } } },
  ] } : {};
  const [total, items] = await Promise.all([
    prisma.team.count({ where }),
    prisma.team.findMany({
      where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (params.page - 1) * params.limit, take: params.limit,
      include: {
        hackathon: { select: { id: true, name: true, registrationDeadline: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, role: true, isLeader: true, user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { joinRequests: true } },
      },
    }),
  ]);
  return paged(items, total, params.page, params.limit);
}

export async function getTeam(id: string) {
  const team = await prisma.team.findUnique({ where: { id }, include: {
    hackathon: { select: { id: true, name: true, registrationDeadline: true } },
    createdBy: { select: { id: true, name: true, email: true } },
    members: { select: { id: true, role: true, isLeader: true, user: { select: { id: true, name: true, email: true } } } },
    _count: { select: { joinRequests: true } },
  } });
  if (!team) throw new ApiError(404, "NOT_FOUND", "Team not found");
  return team;
}

export async function updateTeam(id: string, patch: z.infer<typeof teamPatchSchema>) {
  const row = await prisma.team.findUnique({ where: { id }, select: { id: true } });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Team not found");
  return prisma.team.update({ where: { id }, data: patch, include: {
    hackathon: { select: { id: true, name: true, registrationDeadline: true } },
    createdBy: { select: { id: true, name: true, email: true } },
    members: { select: { id: true, role: true, isLeader: true, user: { select: { id: true, name: true, email: true } } } },
    _count: { select: { joinRequests: true } },
  } });
}

export async function listActivity(params: PageParams & { kind: "requests" | "solo-posts" | "bookmarks" }) {
  const skip = (params.page - 1) * params.limit;
  if (params.kind === "requests") {
    const [total, items] = await Promise.all([
      prisma.joinRequest.count(),
      prisma.joinRequest.findMany({ orderBy: { createdAt: "desc" }, skip, take: params.limit, include: {
        requester: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true, hackathon: { select: { id: true, name: true } } } },
      } }),
    ]);
    return paged(items, total, params.page, params.limit);
  }
  if (params.kind === "solo-posts") {
    const [total, items] = await Promise.all([
      prisma.soloPost.count(),
      prisma.soloPost.findMany({ orderBy: { createdAt: "desc" }, skip, take: params.limit, include: {
        user: { select: { id: true, name: true, email: true } }, hackathon: { select: { id: true, name: true } },
      } }),
    ]);
    return paged(items, total, params.page, params.limit);
  }
  const [total, items] = await Promise.all([
    prisma.bookmark.count(),
    prisma.bookmark.findMany({ orderBy: { createdAt: "desc" }, skip, take: params.limit, include: {
      user: { select: { id: true, name: true, email: true } }, hackathon: { select: { id: true, name: true } },
    } }),
  ]);
  return paged(items, total, params.page, params.limit);
}
