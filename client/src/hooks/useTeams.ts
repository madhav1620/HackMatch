import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamsApi } from "../api/teams";
import type { JoinRequestBody, TeamBoardQuery, TeamDraft } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui";
import { hackathonKeys } from "./useHackathons";

/** Server messages arrive as plain `Error`s via `request<T>`. */
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export const teamKeys = {
  all: ["teams"] as const,
  board: (hackathonId: string | undefined, q: TeamBoardQuery) => ["teams", "board", hackathonId, q] as const,
  detail: (id: string | undefined) => ["teams", "detail", id] as const,
  mine: ["teams", "mine"] as const,
  requests: ["requests", "mine"] as const,
  solo: (hackathonId: string | undefined, q: TeamBoardQuery) => ["solo", hackathonId, q] as const,
};

/** Everything a squad write can affect. */
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: teamKeys.all });
  qc.invalidateQueries({ queryKey: teamKeys.requests });
  qc.invalidateQueries({ queryKey: ["solo"] });
  qc.invalidateQueries({ queryKey: hackathonKeys.all });
}

export function useTeamBoard(hackathonId: string | undefined, query: TeamBoardQuery) {
  const { token } = useAuth();
  return useQuery({
    queryKey: teamKeys.board(hackathonId, query),
    queryFn: () => teamsApi.board(hackathonId as string, query, token),
    enabled: Boolean(hackathonId),
    placeholderData: (prev) => prev,
  });
}

export function useTeam(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => teamsApi.get(id as string, token),
    enabled: Boolean(id),
  });
}

export function useMyTeams(enabled = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: teamKeys.mine,
    queryFn: () => teamsApi.mine(token as string),
    enabled: enabled && Boolean(token),
  });
}

export function useMyRequests(enabled = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: teamKeys.requests,
    queryFn: () => teamsApi.myRequests(token as string),
    enabled: enabled && Boolean(token),
  });
}

export function useSoloPosts(hackathonId: string | undefined, query: TeamBoardQuery) {
  const { token } = useAuth();
  return useQuery({
    queryKey: teamKeys.solo(hackathonId, query),
    queryFn: () => teamsApi.soloPosts(hackathonId as string, query, token),
    enabled: Boolean(hackathonId),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTeam(hackathonId: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (body: TeamDraft) => teamsApi.create(hackathonId, body, token as string),
    onSuccess: (team) => {
      invalidateAll(qc);
      toast.push(`“${team.name}” posted to the matchmaking board`);
    },
    onError: (e) => toast.push(msg(e), "error"),
  });
}

export function useUpdateTeam() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<TeamDraft> & { isRecruiting?: boolean; openSlots?: number }) =>
      teamsApi.update(id, body, token as string),
    onSuccess: () => {
      invalidateAll(qc);
      toast.push("Squad updated");
    },
    onError: (e) => toast.push(msg(e), "error"),
  });
}

export function useDeleteTeam() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => teamsApi.remove(id, token as string),
    onSuccess: () => {
      invalidateAll(qc);
      toast.push("Squad disbanded", "info");
    },
    onError: (e) => toast.push(msg(e), "error"),
  });
}

/** Send (or re-open) a squad application. */
export function useApplyToTeam() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ teamId, body }: { teamId: string; body: JoinRequestBody }) =>
      teamsApi.apply(teamId, body, token as string),
    onSuccess: () => invalidateAll(qc),
    onError: (e) => toast.push(msg(e), "error"),
  });
}

/** Squad lead accepts / declines an application. */
export function useReviewRequest() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: "ACCEPTED" | "DECLINED" }) =>
      teamsApi.review(requestId, status, token as string),
    onSuccess: (_data, vars) => {
      invalidateAll(qc);
      toast.push(
        vars.status === "ACCEPTED"
          ? "Applicant accepted · slot filled and contact shared"
          : "Application declined",
        vars.status === "ACCEPTED" ? "success" : "info",
      );
    },
    onError: (e) => toast.push(msg(e), "error"),
  });
}

export function useCancelRequest() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (requestId: string) => teamsApi.cancel(requestId, token as string),
    onSuccess: () => {
      invalidateAll(qc);
      toast.push("Application withdrawn · you can re-apply anytime", "info");
    },
    onError: (e) => toast.push(msg(e), "error"),
  });
}

export function usePostSolo(hackathonId: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (pitch: string) => teamsApi.postSolo(hackathonId, pitch, token as string),
    onSuccess: () => {
      invalidateAll(qc);
      toast.push("You're on the solo board · squads can find you now");
    },
    onError: (e) => toast.push(msg(e), "error"),
  });
}

export function useDeleteSolo() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => teamsApi.deleteSolo(id, token as string),
    onSuccess: () => {
      invalidateAll(qc);
      toast.push("Removed from the solo board", "info");
    },
    onError: (e) => toast.push(msg(e), "error"),
  });
}
