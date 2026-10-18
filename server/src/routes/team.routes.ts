import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { assertValid } from "../lib/validate.js";
import * as t from "../services/team.service.js";

/**
 * Phase 4 — Team Matchmaking & Recruitment.
 *
 * Three mount points:
 *   /api/hackathons · squads board + solo-builder posts (scoped to a hackathon)
 *   /api/teams       · squad detail / authoring / applications
 *   /api/requests    · the viewer's outgoing + incoming applications
 *   /api/solo-posts  · delete a "Looking for Team" post
 */

const viewerOf = (req: Request): t.Viewer => ({
  userId: req.auth?.sub,
  isAdmin: req.auth?.role === "ADMIN",
});

const csv = (raw?: string): string[] =>
  raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];

// ── schemas ───────────────────────────────────────────────────────────────────

const boardQuery = z.object({
  skills: z.string().trim().optional(),
  role: z.enum(t.PRIMARY_ROLES).optional(),
  openOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

const teamSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(2000),
  track: z.string().trim().max(120).optional(),
  openSlots: z.coerce.number().int().min(0).max(20).optional(),
  requiredRoles: z.array(z.enum(t.PRIMARY_ROLES)).max(6),
  requiredSkills: z.array(z.string().trim().min(1)).max(12),
  contactChannel: z.enum(t.TEAM_CHANNELS),
  contactValue: z.string().trim().min(1).max(300).optional(),
});

const requestSchema = z.object({
  message: z.string().trim().max(500).optional(),
  role: z.enum(t.PRIMARY_ROLES).optional(),
  portfolioUrl: z.string().trim().max(300).optional(),
  commitment: z.enum(t.COMMITMENTS).optional(),
});

const reviewSchema = z.object({ status: z.enum(t.REVIEW_STATUSES) });

const soloSchema = z.object({ pitch: z.string().trim().min(10).max(600) });

const requestListQuery = z.object({ status: z.enum([...t.REQUEST_STATUSES, "ALL"]).default("PENDING") });

// ── /api/hackathons/:id/... ───────────────────────────────────────────────────

export const hackathonTeamsRouter = Router();

hackathonTeamsRouter.get("/:id/teams", optionalAuth, asyncHandler(async (req, res) => {
  const q = assertValid(boardQuery.safeParse(req.query));
  res.json(
    await t.listTeams(
      req.params.id,
      { skills: csv(q.skills), role: q.role, openOnly: q.openOnly, page: q.page, limit: q.limit },
      viewerOf(req),
    ),
  );
}));

hackathonTeamsRouter.post("/:id/teams", requireAuth, asyncHandler(async (req, res) => {
  const body = assertValid(teamSchema.safeParse(req.body));
  res.status(201).json(await t.createTeam(req.params.id, req.auth!.sub, body));
}));

hackathonTeamsRouter.get("/:id/solo-posts", optionalAuth, asyncHandler(async (req, res) => {
  const q = assertValid(boardQuery.safeParse(req.query));
  res.json(
    await t.listSoloPosts(
      req.params.id,
      { skills: csv(q.skills), role: q.role, page: q.page, limit: q.limit },
      viewerOf(req),
    ),
  );
}));

hackathonTeamsRouter.post("/:id/solo-post", requireAuth, asyncHandler(async (req, res) => {
  const body = assertValid(soloSchema.safeParse(req.body));
  res.json(await t.upsertSoloPost(req.params.id, req.auth!.sub, body.pitch));
}));

// ── /api/teams ────────────────────────────────────────────────────────────────

export const teamsRouter = Router();

teamsRouter.get("/mine", requireAuth, asyncHandler(async (req, res) => {
  res.json(await t.listMyTeams(req.auth!.sub));
}));

teamsRouter.get("/:id", optionalAuth, asyncHandler(async (req, res) => {
  res.json(await t.getTeam(req.params.id, viewerOf(req)));
}));

teamsRouter.patch("/:id", requireAuth, asyncHandler(async (req, res) => {
  const body = assertValid(teamSchema.partial().safeParse(req.body));
  res.json(await t.updateTeam(req.params.id, viewerOf(req), body));
}));

teamsRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  await t.deleteTeam(req.params.id, viewerOf(req));
  res.status(204).end();
}));

teamsRouter.post("/:id/requests", requireAuth, asyncHandler(async (req, res) => {
  const body = assertValid(requestSchema.safeParse(req.body));
  res.status(201).json(await t.requestJoin(req.params.id, req.auth!.sub, body));
}));

teamsRouter.get("/:id/requests", requireAuth, asyncHandler(async (req, res) => {
  const q = assertValid(requestListQuery.safeParse(req.query));
  res.json(await t.listTeamRequests(req.params.id, viewerOf(req), q.status));
}));

// ── /api/requests ─────────────────────────────────────────────────────────────

export const requestsRouter = Router();

requestsRouter.get("/mine", requireAuth, asyncHandler(async (req, res) => {
  res.json(await t.listMyRequests(req.auth!.sub));
}));

requestsRouter.patch("/:id", requireAuth, asyncHandler(async (req, res) => {
  const body = assertValid(reviewSchema.safeParse(req.body));
  res.json(await t.reviewRequest(req.params.id, viewerOf(req), body.status));
}));

requestsRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  res.json(await t.cancelRequest(req.params.id, req.auth!.sub));
}));

// ── /api/solo-posts ───────────────────────────────────────────────────────────

export const soloRouter = Router();

soloRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  await t.deleteSoloPost(req.params.id, viewerOf(req));
  res.status(204).end();
}));
