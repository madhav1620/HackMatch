import { request } from "./http";
import type {
  JoinRequest,
  JoinRequestBody,
  MyRequestsResponse,
  MyTeam,
  SoloPost,
  SoloPostsResponse,
  Team,
  TeamBoardQuery,
  TeamBoardResponse,
  TeamDetail,
  TeamDraft,
} from "./types";

const qs = (q: TeamBoardQuery): string => {
  const params = new URLSearchParams();
  if (q.skills) params.set("skills", q.skills);
  if (q.role) params.set("role", q.role);
  if (q.openOnly) params.set("openOnly", "true");
  if (q.page) params.set("page", String(q.page));
  if (q.limit) params.set("limit", String(q.limit));
  return params.toString();
};

/** Phase 4 — Team Matchmaking & Recruitment. */
export const teamsApi = {
  // board + authoring
  board: (hackathonId: string, q: TeamBoardQuery, token?: string | null) =>
    request<TeamBoardResponse>(`/api/hackathons/${hackathonId}/teams?${qs(q)}`, { token }),

  create: (hackathonId: string, body: TeamDraft, token: string) =>
    request<Team>(`/api/hackathons/${hackathonId}/teams`, { method: "POST", token, body: JSON.stringify(body) }),

  get: (id: string, token?: string | null) => request<TeamDetail>(`/api/teams/${id}`, { token }),

  update: (id: string, body: Partial<TeamDraft> & { isRecruiting?: boolean; openSlots?: number }, token: string) =>
    request<Team>(`/api/teams/${id}`, { method: "PATCH", token, body: JSON.stringify(body) }),

  remove: (id: string, token: string) => request<void>(`/api/teams/${id}`, { method: "DELETE", token }),

  mine: (token: string) => request<{ items: MyTeam[] }>("/api/teams/mine", { token }),

  // join requests
  apply: (teamId: string, body: JoinRequestBody, token: string) =>
    request<JoinRequest>(`/api/teams/${teamId}/requests`, { method: "POST", token, body: JSON.stringify(body) }),

  teamRequests: (teamId: string, token: string, status = "PENDING") =>
    request<{ items: JoinRequest[] }>(`/api/teams/${teamId}/requests?status=${status}`, { token }),

  review: (requestId: string, status: "ACCEPTED" | "DECLINED", token: string) =>
    request<JoinRequest>(`/api/requests/${requestId}`, { method: "PATCH", token, body: JSON.stringify({ status }) }),

  cancel: (requestId: string, token: string) =>
    request<JoinRequest>(`/api/requests/${requestId}`, { method: "DELETE", token }),

  myRequests: (token: string) => request<MyRequestsResponse>("/api/requests/mine", { token }),

  // solo builders ("Looking for Team")
  soloPosts: (hackathonId: string, q: TeamBoardQuery, token?: string | null) =>
    request<SoloPostsResponse>(`/api/hackathons/${hackathonId}/solo-posts?${qs(q)}`, { token }),

  postSolo: (hackathonId: string, pitch: string, token: string) =>
    request<SoloPost>(`/api/hackathons/${hackathonId}/solo-post`, { method: "POST", token, body: JSON.stringify({ pitch }) }),

  deleteSolo: (id: string, token: string) => request<void>(`/api/solo-posts/${id}`, { method: "DELETE", token }),
};
