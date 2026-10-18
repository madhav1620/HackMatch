import { request } from "./http";
import type { HackathonDraft, HackathonStatus, Mode, OrgType, Paged, User } from "./types";

export type AdminSummary = {
  users: number;
  upcomingEvents: number;
  draftEvents: number;
  teams: number;
  pendingRequests: number;
  soloPosts: number;
};

export type AdminEvent = HackathonDraft & {
  id: string;
  tagline: string | null;
  logoUrl: string | null;
  url: string | null;
  location: string | null;
  mode: Mode;
  orgType: OrgType;
  status: HackathonStatus;
  organizerId: string | null;
  organizer: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  _count: { teams: number; soloPosts: number; bookmarks: number };
};

export type AdminUser = User & {
  createdAt: string;
  updatedAt: string;
  _count: { teams: number; teamsCreated: number; requestsSent: number; hackathons: number; bookmarks: number; soloPosts: number };
};

export type AdminUserDetail = AdminUser & {
  teams: { id: string; role: string; isLeader: boolean; team: { id: string; name: string; hackathon: { id: string; name: string } } }[];
  requestsSent: { id: string; status: string; createdAt: string; team: { id: string; name: string } }[];
  hackathons: { id: string; name: string; status: string }[];
  bookmarks: { id: string; createdAt: string; hackathon: { id: string; name: string } }[];
  soloPosts: { id: string; pitch: string; isOpen: boolean; hackathon: { id: string; name: string } }[];
};

export type AdminUserPatch = Partial<Pick<User,
  "email" | "name" | "verified" | "role" | "primaryRole" | "bio" | "skills" |
  "avatarUrl" | "githubUrl" | "linkedinUrl" | "portfolioUrl" |
  "discordHandle" | "whatsappNo" | "availability"
>>;

export type AdminTeam = {
  id: string;
  name: string;
  description: string;
  track: string | null;
  isRecruiting: boolean;
  openSlots: number;
  requiredRoles: string[];
  requiredSkills: string[];
  contactChannel: "DISCORD" | "WHATSAPP" | "EMAIL";
  contactValue: string | null;
  createdAt: string;
  updatedAt: string;
  hackathon: { id: string; name: string; registrationDeadline: string };
  createdBy: { id: string; name: string; email: string };
  members: { id: string; role: string; isLeader: boolean; user: { id: string; name: string; email: string } }[];
  _count: { joinRequests: number };
};

export type AdminTeamPatch = Partial<Pick<AdminTeam,
  "name" | "description" | "track" | "isRecruiting" | "openSlots" |
  "requiredRoles" | "requiredSkills" | "contactChannel" | "contactValue"
>>;

export type AdminRequest = {
  id: string; type: string; message: string | null; role: string | null;
  status: string; createdAt: string;
  requester: { id: string; name: string; email: string };
  team: { id: string; name: string; hackathon: { id: string; name: string } };
};
export type AdminSoloPost = {
  id: string; pitch: string; isOpen: boolean; createdAt: string;
  user: { id: string; name: string; email: string };
  hackathon: { id: string; name: string };
};
export type AdminBookmark = {
  id: string; remindAt: string | null; createdAt: string;
  user: { id: string; name: string; email: string };
  hackathon: { id: string; name: string };
};

type Listing = { page?: number; limit?: number; search?: string };
type AdminEventPatch = Omit<Partial<HackathonDraft>, "tagline" | "logoUrl" | "url" | "location"> & {
  tagline?: string | null;
  logoUrl?: string | null;
  url?: string | null;
  location?: string | null;
};
function query(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export const adminApi = {
  summary: (token: string) => request<AdminSummary>("/api/admin/summary", { token }),
  events: (token: string, params: Listing & { status?: string; scope?: "upcoming" | "all" }) =>
    request<Paged<AdminEvent>>(`/api/admin/events?${query(params)}`, { token }),
  event: (token: string, id: string) => request<AdminEvent>(`/api/admin/events/${encodeURIComponent(id)}`, { token }),
  updateEvent: (token: string, id: string, patch: AdminEventPatch) =>
    request<AdminEvent>(`/api/admin/events/${encodeURIComponent(id)}`, { token, method: "PATCH", body: JSON.stringify(patch) }),
  users: (token: string, params: Listing & { role?: string }) =>
    request<Paged<AdminUser>>(`/api/admin/users?${query(params)}`, { token }),
  user: (token: string, id: string) =>
    request<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(id)}`, { token }),
  updateUser: (token: string, id: string, patch: AdminUserPatch) =>
    request<AdminUser>(`/api/admin/users/${encodeURIComponent(id)}`, { token, method: "PATCH", body: JSON.stringify(patch) }),
  teams: (token: string, params: Listing) =>
    request<Paged<AdminTeam>>(`/api/admin/teams?${query(params)}`, { token }),
  team: (token: string, id: string) => request<AdminTeam>(`/api/admin/teams/${encodeURIComponent(id)}`, { token }),
  updateTeam: (token: string, id: string, patch: AdminTeamPatch) =>
    request<AdminTeam>(`/api/admin/teams/${encodeURIComponent(id)}`, { token, method: "PATCH", body: JSON.stringify(patch) }),
  requests: (token: string, page = 1) =>
    request<Paged<AdminRequest>>(`/api/admin/activity?${query({ kind: "requests", page })}`, { token }),
  soloPosts: (token: string, page = 1) =>
    request<Paged<AdminSoloPost>>(`/api/admin/activity?${query({ kind: "solo-posts", page })}`, { token }),
  bookmarks: (token: string, page = 1) =>
    request<Paged<AdminBookmark>>(`/api/admin/activity?${query({ kind: "bookmarks", page })}`, { token }),
};
