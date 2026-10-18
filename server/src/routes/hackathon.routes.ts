import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { assertValid, queryBool } from "../lib/validate.js";
import * as h from "../services/hackathon.service.js";
import { listBookmarks } from "../services/hackathon.service.js";

const query = z.object({
  search: z.string().trim().optional(),
  mode: z.enum(h.MODES).optional(),
  orgType: z.enum(h.ORG_TYPES).optional(),
  tech: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  minPrize: z.coerce.number().int().min(0).optional(),
  sort: z.enum(h.SORTS).default("deadline"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  includeClosed: queryBool,
});

export const hackathonSchema = z.object({
  name: z.string().min(1).max(140),
  tagline: z.string().max(160).nullable().optional(),
  description: z.string().min(1).max(5000),
  logoUrl: z.string().url().nullable().optional(),
  url: z.string().url().nullable().optional(),
  mode: z.enum(h.MODES),
  location: z.string().max(160).nullable().optional(),
  orgType: z.enum(h.ORG_TYPES),
  prizePool: z.coerce.number().int().min(0),
  registrationDeadline: z.string().datetime(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  techTags: z.array(z.string().min(1)).max(12),
  minTeamSize: z.coerce.number().int().min(1),
  maxTeamSize: z.coerce.number().int().min(1),
  status: z.enum(h.STATUSES),
});

const bookmarkBody = z.object({
  remindAt: z.string().datetime().optional(),
});

export const hackRouter = Router();
export const bookmarksRouter = Router();

bookmarksRouter.get("/", requireAuth, asyncHandler(async (req, res) => {
  res.json(await listBookmarks(req.auth!.sub));
}));

hackRouter.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const q = assertValid(query.safeParse(req.query));
  const tech = q.tech ? q.tech.split(",").map(s => s.trim()).filter(Boolean) : [];
  const result = await h.listHackathons(
    {
      ...q,
      tech,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    },
    req.auth?.sub,
  );
  res.json(result);
}));

hackRouter.get("/mine", requireAuth, requireRole("ORGANIZER", "ADMIN"), asyncHandler(async (req, res) => {
  const out = await h.listMine(req.auth!.sub);
  res.json(out);
}));

hackRouter.get("/bookmarks", requireAuth, asyncHandler(async (req, res) => {
  const out = await h.listBookmarks(req.auth!.sub);
  res.json(out);
}));

hackRouter.get("/:id", optionalAuth, asyncHandler(async (req, res) => {
  const out = await h.getHackathon(req.params.id, req.auth?.sub, req.auth?.role === "ADMIN");
  res.json(out);
}));

hackRouter.post("/", requireAuth, requireRole("ORGANIZER", "ADMIN"), asyncHandler(async (req, res) => {
  const body = assertValid(hackathonSchema.safeParse(req.body));
  const input = {
    ...body,
    registrationDeadline: new Date(body.registrationDeadline),
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate),
  };
  const out = await h.createHackathon(input, req.auth!.sub);
  res.status(201).json(out);
}));

hackRouter.patch("/:id", requireAuth, requireRole("ORGANIZER", "ADMIN"), asyncHandler(async (req, res) => {
  const patch = assertValid(hackathonSchema.partial().safeParse(req.body));
  const input: Partial<h.HackathonInput> = {
    ...patch,
    registrationDeadline: patch.registrationDeadline ? new Date(patch.registrationDeadline) : undefined,
    startDate: patch.startDate ? new Date(patch.startDate) : undefined,
    endDate: patch.endDate ? new Date(patch.endDate) : undefined,
  };
  const out = await h.updateHackathon(req.params.id, req.auth!.sub, req.auth!.role, input);
  res.json(out);
}));

hackRouter.delete("/:id", requireAuth, requireRole("ORGANIZER", "ADMIN"), asyncHandler(async (req, res) => {
  await h.deleteHackathon(req.params.id, req.auth!.sub, req.auth!.role);
  res.status(204).end();
}));

hackRouter.post("/:id/bookmark", requireAuth, asyncHandler(async (req, res) => {
  const b = assertValid(bookmarkBody.safeParse(req.body));
  const out = await h.bookmark(req.auth!.sub, req.params.id, b.remindAt ? new Date(b.remindAt) : undefined);
  res.json(out);
}));

hackRouter.delete("/:id/bookmark", requireAuth, asyncHandler(async (req, res) => {
  const out = await h.unbookmark(req.auth!.sub, req.params.id);
  res.json(out);
}));
