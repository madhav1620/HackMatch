import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessPayload {
  sub: string; // user id
  role: string;
  email: string;
}

export function signAccess(payload: AccessPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl as jwt.SignOptions["expiresIn"],
  });
}

export function signRefresh(sub: string): string {
  return jwt.sign({ sub, type: "refresh" }, env.jwtRefreshSecret, {
    expiresIn: env.refreshTokenTtl as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccess(token: string): AccessPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessPayload;
}

export function verifyRefresh(token: string): { sub: string } {
  const decoded = jwt.verify(token, env.jwtRefreshSecret) as { sub: string; type: string };
  if (decoded.type !== "refresh") throw new Error("Invalid token type");
  return decoded;
}
