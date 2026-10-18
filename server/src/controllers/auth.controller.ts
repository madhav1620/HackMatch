import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service.js";
import { assertValid } from "../lib/validate.js";
import { signAccess, signRefresh, verifyRefresh } from "../lib/jwt.js";
import { REFRESH_COOKIE } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/error.js";

type Ctx = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

/** Mints an access token + sets the refresh cookie. Returns the access token —
 *  the caller owns the response (never write headers here). */
function issueTokens(res: Response, user: { id: string; role: string; email: string }): string {
  const access = signAccess({ sub: user.id, role: user.role, email: user.email });
  setRefreshCookie(res, signRefresh(user.id));
  return access;
}

export const register: Ctx = async (req, res) => {
  const input = assertValid(authService.registerSchema.safeParse(req.body));
  res.status(201).json(await authService.register(input));
};

export const verifyOtp: Ctx = async (req, res) => {
  const input = assertValid(authService.otpSchema.safeParse(req.body));
  const user = await authService.verifyOtp(input);
  const accessToken = issueTokens(res, user);
  res.json({ accessToken, user });
};

export const resendOtp: Ctx = async (req, res) => {
  const input = assertValid(z.object({ email: z.string().trim().toLowerCase().email() }).safeParse(req.body));
  res.json(await authService.resendOtp(input.email));
};

export const login: Ctx = async (req, res) => {
  const input = assertValid(authService.loginSchema.safeParse(req.body));
  const user = await authService.login(input);
  const accessToken = issueTokens(res, user);
  res.json({ accessToken, user });
};

export const refresh: Ctx = async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) throw new ApiError(401, "NO_REFRESH", "Missing refresh token");
  let sub: string;
  try {
    sub = verifyRefresh(token).sub;
  } catch {
    throw new ApiError(401, "BAD_REFRESH", "Invalid refresh token");
  }
  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user?.verified) throw new ApiError(401, "BAD_REFRESH", "Invalid refresh token");
  const accessToken = issueTokens(res, user);
  res.json({ ok: true, accessToken });
};

export const logout: Ctx = async (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.json({ ok: true });
};

export const me: Ctx = async (req, res) => {
  const user = await authService.getProfile(req.auth!.sub);
  res.json({ user });
};

export const profile: Ctx = async (req, res) => {
  const user = await authService.getPublicProfile(req.params.id);
  res.json({ user });
};

export const updateMe: Ctx = async (req, res) => {
  const input = assertValid(authService.profileUpdateSchema.safeParse(req.body));
  const user = await authService.updateProfile(req.auth!.sub, input);
  res.json({ user });
};
