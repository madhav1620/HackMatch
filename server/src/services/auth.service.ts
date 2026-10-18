import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/error.js";
import { env } from "../config/env.js";
import { generateOtp, sendOtpEmail } from "../lib/mailer.js";
import { toArray, toStrArray } from "../lib/jsonArrays.js";
import bcrypt from "bcryptjs";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(2).max(80),
});

export const otpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  primaryRole: z
    .enum(["FRONTEND", "BACKEND", "AIML", "UIUX", "PITCH", "DEVOPS", "DATA", "OTHER"])
    .optional(),
  bio: z.string().max(500).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
  githubUrl: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  linkedinUrl: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  portfolioUrl: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  discordHandle: z.string().trim().max(40).nullable().optional(),
  whatsappNo: z.string().trim().max(20).nullable().optional(),
  availability: z.enum(["AVAILABLE", "BUSY", "UNAVAILABLE"]).optional(),
  avatarUrl: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
});

const OTP_TTL_MS = 10 * 60 * 1000;

/** College email gate: domain must equal or end with an allowed suffix (e.g. ".edu", ".ac.in") */
export function isCollegeEmail(email: string): boolean {
  const domain = email.split("@")[1] ?? "";
  return env.collegeDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/** Public representation — NEVER includes passwordHash or OTP fields (API leak guard). */
function publicUser(u: {
  id: string; email: string; name: string; avatarUrl: string | null; verified: boolean;
  role: string; primaryRole: string; bio: string | null; skills: string[];
  githubUrl: string | null; linkedinUrl: string | null; portfolioUrl: string | null;
  discordHandle: string | null; whatsappNo: string | null; availability: string;
  createdAt?: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    verified: u.verified,
    role: u.role,
    primaryRole: u.primaryRole,
    bio: u.bio,
    skills: toArray(u.skills),
    githubUrl: u.githubUrl,
    linkedinUrl: u.linkedinUrl,
    portfolioUrl: u.portfolioUrl,
    discordHandle: u.discordHandle,
    whatsappNo: u.whatsappNo,
    availability: u.availability,
    createdAt: u.createdAt,
  };
}

export async function register(input: z.infer<typeof registerSchema>) {
  if (!isCollegeEmail(input.email)) {
    throw new ApiError(403, "NOT_COLLEGE_EMAIL", "Use your college email address to sign up");
  }
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing?.verified) {
    throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, name: input.name, otpCode, otpExpiresAt, verified: false },
      })
    : await prisma.user.create({
        data: { email: input.email, passwordHash, name: input.name, otpCode, otpExpiresAt },
      });

  await sendOtpEmail(user.email, otpCode);
  return { userId: user.id, email: user.email };
}

export async function verifyOtp(input: z.infer<typeof otpSchema>) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.otpCode || !user.otpExpiresAt) {
    throw new ApiError(400, "OTP_INVALID", "No pending verification for this email");
  }
  if (user.otpExpiresAt < new Date()) {
    throw new ApiError(400, "OTP_EXPIRED", "Code expired — request a new one");
  }
  if (user.otpCode !== input.code) {
    throw new ApiError(400, "OTP_INVALID", "Incorrect code");
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { verified: true, otpCode: null, otpExpiresAt: null },
  });
  return publicUser(updated);
}

export async function resendOtp(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "NOT_FOUND", "No account with this email — sign up first");
  if (user.verified) throw new ApiError(409, "ALREADY_VERIFIED", "Account is already verified");
  const otpCode = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode, otpExpiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  await sendOtpEmail(user.email, otpCode);
  return { email: user.email };
}

export async function login(input: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new ApiError(401, "BAD_CREDENTIALS", "Invalid email or password");
  }
  if (!user.verified) {
    throw new ApiError(403, "NOT_VERIFIED", "Verify your college email first — check your OTP");
  }
  return publicUser(user);
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");
  return publicUser(user);
}

/** Profile fields visible to other signed-in students. Private contact details stay in /me. */
export async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, verified: true },
    select: {
      id: true, name: true, avatarUrl: true, verified: true, primaryRole: true,
      bio: true, skills: true, githubUrl: true, linkedinUrl: true,
      portfolioUrl: true, availability: true, email: true, createdAt: true,
    },
  });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");
  const { email, ...profile } = user;
  return { ...profile, collegeDomain: email.split("@")[1] ?? "" };
}

export async function updateProfile(userId: string, input: z.infer<typeof profileUpdateSchema>) {
  const data: Record<string, unknown> = { ...input };
  if (input.skills !== undefined) data.skills = toStrArray(input.skills);
  const user = await prisma.user.update({ where: { id: userId }, data });
  return publicUser(user);
}
