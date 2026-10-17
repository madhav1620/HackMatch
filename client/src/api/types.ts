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

// ── Discovery Hub (mirrors server/src/services/hackathon.service.ts) ──────────

export type Mode = "ONLINE" | "OFFLINE" | "HYBRID";
export type OrgType = "INTERNAL" | "EXTERNAL";
export type HackathonStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type Sort = "deadline" | "prize" | "recent";

export type Hackathon = {
  id: string;
  name: string;
  tagline: string | null;
  description: string;
  logoUrl: string | null;
  url: string | null;
  mode: Mode | string;
  location: string | null;
  orgType: OrgType | string;
  prizePool: number;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
  techTags: string[];
  minTeamSize: number;
  maxTeamSize: number;
  status: HackathonStatus | string;
  organizerId: string | null;
  createdAt: string;
  /** Card extras injected by the API */
  teamCount: number;
  soloPostCount: number;
  bookmarked: boolean;
  remindAt: string | null;
};

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type HackathonListResponse = Paged<Hackathon>;

export type BookmarkEntry = {
  remindAt: string | null;
  savedAt: string;
  hackathon: Hackathon;
};

export type BookmarksResponse = { items: BookmarkEntry[] };

export type BookmarkToggleResponse = {
  ok: true;
  bookmarked: boolean;
  remindAt?: string | null;
};

/** Query string accepted by `GET /hackathons`. */
export type HackathonQuery = {
  search?: string;
  mode?: string;
  orgType?: string;
  tech?: string[];
  from?: string;
  to?: string;
  minPrize?: number;
  sort?: Sort;
  page?: number;
  limit?: number;
  includeClosed?: boolean;
};

/** Body accepted by `POST` / `PATCH /hackathons`. */
export type HackathonDraft = {
  name: string;
  tagline?: string;
  description: string;
  logoUrl?: string;
  url?: string;
  mode: Mode;
  location?: string;
  orgType: OrgType;
  prizePool: number;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
  techTags: string[];
  minTeamSize: number;
  maxTeamSize: number;
  status: HackathonStatus;
};
