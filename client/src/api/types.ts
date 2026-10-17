export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  verified: boolean;
  role: "STUDENT" | "ORGANIZER" | "ADMIN" | string;
  primaryRole:
    | "FRONTEND"
    | "BACKEND"
    | "AIML"
    | "UIUX"
    | "PITCH"
    | "DEVOPS"
    | "DATA"
    | "OTHER"
    | string;
  bio: string | null;
  skills: string[];
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  discordHandle: string | null;
  whatsappNo: string | null;
  availability: "AVAILABLE" | "BUSY" | "UNAVAILABLE" | string;
  createdAt?: string;
};

export type AuthResponse = { accessToken: string; user?: User };
export type MeResponse = { user: User };
export type RegisterResponse = { userId: string; email: string };
export type OtpVerifyResponse = { accessToken: string; user: User };
export type BasicOk = { ok: true };
export type RefreshResponse = { ok: true; accessToken: string };
