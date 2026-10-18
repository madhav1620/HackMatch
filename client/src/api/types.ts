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

// ── Team Matchmaking (mirrors server/src/services/team.service.ts) ────────────

export type PrimaryRole = "FRONTEND" | "BACKEND" | "AIML" | "UIUX" | "PITCH" | "DEVOPS" | "DATA" | "OTHER";
export type TeamChannel = "DISCORD" | "WHATSAPP" | "EMAIL";
export type RequestStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
export type Commitment = "FULL_SPRINT" | "PARTIAL" | "FLEXIBLE";

export type TeamContact = { channel: TeamChannel | string; value: string };

export type TeamMemberPublic = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  primaryRole: string;
  role: string;
  isLeader: boolean;
  joinedAt?: string;
};

export type Team = {
  id: string;
  name: string;
  description: string;
  track: string | null;
  isRecruiting: boolean;
  openSlots: number;
  hackathonId: string;
  createdAt: string;
  hackathon: { id: string; name: string; maxTeamSize: number; mode?: string };
  requiredRoles: string[];
  requiredSkills: string[];
  filledSlots: number;
  slotsTotal: number;
  memberIds: string[];
  members: TeamMemberPublic[];
  /** Viewer state — injected per request. */
  isMember: boolean;
  isLeader: boolean;
  myRequest: { id: string; status: string } | null;
  /** Instant Connect — null unless the viewer is a confirmed member / lead. */
  contact: TeamContact | null;
};

export type TeamDetail = Team & { pendingRequests: JoinRequest[] };

export type JoinRequest = {
  id: string;
  teamId: string;
  requesterId: string;
  type: string;
  message: string | null;
  role: string | null;
  portfolioUrl: string | null;
  commitment: Commitment | string | null;
  status: RequestStatus | string;
  reviewedAt: string | null;
  createdAt: string;
  requester?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    primaryRole: string;
    skills: string[];
  };
  team?: {
    id: string;
    name: string;
    track: string | null;
    openSlots: number;
    isRecruiting: boolean;
    memberCount: number;
    filledSlots: number;
    slotsTotal: number;
    hackathon: { id: string; name: string; registrationDeadline: string };
  };
};

export type MyTeam = {
  id: string;
  name: string;
  description: string;
  track: string | null;
  isRecruiting: boolean;
  openSlots: number;
  filledSlots: number;
  slotsTotal: number;
  requiredRoles: string[];
  requiredSkills: string[];
  contact: TeamContact | null;
  myRole: string | null;
  isLeader: boolean;
  memberCount: number;
  hackathon: { id: string; name: string; maxTeamSize: number; mode?: string };
};

export type TeamBoardResponse = Paged<Team> & { openSlots: number; recruitingTeams: number };

export type TeamBoardQuery = {
  skills?: string;
  role?: PrimaryRole | "";
  openOnly?: boolean;
  page?: number;
  limit?: number;
};

export type TeamDraft = {
  name: string;
  description: string;
  track?: string;
  openSlots?: number;
  requiredRoles: PrimaryRole[];
  requiredSkills: string[];
  contactChannel: TeamChannel;
  contactValue?: string;
};

export type JoinRequestBody = {
  message?: string;
  role?: PrimaryRole;
  portfolioUrl?: string;
  commitment?: Commitment;
};

export type SoloPost = {
  id: string;
  hackathonId: string;
  userId: string;
  pitch: string;
  isOpen: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    primaryRole: string;
    skills: string[];
    availability: string;
    githubUrl: string | null;
  };
};

export type SoloPostsResponse = Paged<SoloPost> & { mine: SoloPost | null };

export type MyRequestsResponse = { outgoing: JoinRequest[]; incoming: JoinRequest[] };
