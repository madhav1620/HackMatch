import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/error.js";
import { assertValid } from "../lib/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { hackathonSchema } from "./hackathon.routes.js";
import { updateHackathon, type HackathonInput } from "../services/hackathon.service.js";
import * as admin from "../services/admin.service.js";

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
});
const eventsQuery = pageQuery.extend({
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
  scope: z.enum(["upcoming", "all"]).default("upcoming"),
});
const usersQuery = pageQuery.extend({ role: z.enum(admin.ADMIN_ROLES).optional() });
const activityQuery = pageQuery.extend({ kind: z.enum(["requests", "solo-posts", "bookmarks"]) });

export const adminRouter = Router();

adminRouter.use(requireAuth);
// Look up the current database role on every admin request. An old access token
// must not keep access after an account is demoted or loses verification.
adminRouter.use(asyncHandler(async (req, _res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub }, select: { role: true, verified: true } });
  if (!user?.verified || user.role !== "ADMIN") throw new ApiError(403, "FORBIDDEN", "Admin access required");
  next();
}));

adminRouter.get("/summary", asyncHandler(async (_req, res) => {
  res.json(await admin.summary());
}));

adminRouter.get("/events", asyncHandler(async (req, res) => {
  res.json(await admin.listEvents(assertValid(eventsQuery.safeParse(req.query))));
}));

adminRouter.get("/events/:id", asyncHandler(async (req, res) => {
  res.json(await admin.getEvent(req.params.id));
}));

adminRouter.patch("/events/:id", asyncHandler(async (req, res) => {
  const patch = assertValid(hackathonSchema.partial().strict().refine((value) => Object.keys(value).length > 0).safeParse(req.body));
  const input: Partial<HackathonInput> = {
    ...patch,
    registrationDeadline: patch.registrationDeadline ? new Date(patch.registrationDeadline) : undefined,
    startDate: patch.startDate ? new Date(patch.startDate) : undefined,
    endDate: patch.endDate ? new Date(patch.endDate) : undefined,
  };
  await updateHackathon(req.params.id, req.auth!.sub, "ADMIN", input);
  res.json(await admin.getEvent(req.params.id));
}));

adminRouter.get("/users", asyncHandler(async (req, res) => {
  res.json(await admin.listUsers(assertValid(usersQuery.safeParse(req.query))));
}));

adminRouter.get("/users/:id", asyncHandler(async (req, res) => {
  res.json(await admin.getUser(req.params.id));
}));

adminRouter.patch("/users/:id", asyncHandler(async (req, res) => {
  const patch = assertValid(admin.userPatchSchema.safeParse(req.body));
  res.json(await admin.updateUser(req.params.id, req.auth!.sub, patch));
}));

adminRouter.get("/teams", asyncHandler(async (req, res) => {
  res.json(await admin.listTeams(assertValid(pageQuery.safeParse(req.query))));
}));

adminRouter.get("/teams/:id", asyncHandler(async (req, res) => {
  res.json(await admin.getTeam(req.params.id));
}));

adminRouter.patch("/teams/:id", asyncHandler(async (req, res) => {
  const patch = assertValid(admin.teamPatchSchema.safeParse(req.body));
  res.json(await admin.updateTeam(req.params.id, patch));
}));

adminRouter.get("/activity", asyncHandler(async (req, res) => {
  res.json(await admin.listActivity(assertValid(activityQuery.safeParse(req.query))));
}));
