import type { NextFunction, Request, Response } from "express";
import { verifyAccess, type AccessPayload } from "../lib/jwt.js";
import { ApiError } from "../lib/error.js";

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

/** Role gate — use after requireAuth. */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(new ApiError(401, "UNAUTHORIZED", "Missing access token"));
    if (!roles.includes(req.auth.role)) {
      return next(new ApiError(403, "FORBIDDEN", "Insufficient permissions"));
    }
    next();
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  console.error("[api] unhandled error:", err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
}
