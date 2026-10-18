import type { NextFunction, Request, Response } from "express";
import { verifyAccess, type AccessPayload } from "../lib/jwt.js";
import { ApiError } from "../lib/error.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "./asyncHandler.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessPayload;
    }
  }
}

/** Requires `Authorization: Bearer <access token>`; attaches req.auth. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "UNAUTHORIZED", "Missing access token"));
  }
  try {
    req.auth = verifyAccess(header.slice(7));
    next();
  } catch {
    next(new ApiError(401, "UNAUTHORIZED", "Invalid or expired access token"));
  }
}

/** Attaches req.auth when a valid token is present; never rejects (public feeds). */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.auth = verifyAccess(header.slice(7));
    } catch {
      // ignore invalid/expired token on public routes
    }
  }
  next();
}

/** Role gate — use after requireAuth. Role edits take effect without waiting for token expiry. */
export function requireRole(...roles: string[]) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.auth) throw new ApiError(401, "UNAUTHORIZED", "Missing access token");
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub }, select: { role: true, verified: true } });
    if (!user?.verified || !roles.includes(user.role)) throw new ApiError(403, "FORBIDDEN", "Insufficient permissions");
    req.auth.role = user.role;
    next();
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  console.error("[api] unhandled error:", err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
}
