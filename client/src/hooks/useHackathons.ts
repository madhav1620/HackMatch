import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hackathonsApi } from "../api/hackathons";
import type { Hackathon, HackathonDraft, HackathonQuery } from "../api/types";
import { useAuth } from "../context/AuthContext";

export const hackathonKeys = {
  all: ["hackathons"] as const,
  list: (q: HackathonQuery) => ["hackathons", "list", q] as const,
  detail: (id: string) => ["hackathons", "detail", id] as const,
  mine: ["hackathons", "mine"] as const,
  bookmarks: ["bookmarks"] as const,
};

/** Discovery feed — public, but picks up `bookmarked` when signed in. */
export function useHackathons(query: HackathonQuery) {
  const { token } = useAuth();
  return useQuery({
    queryKey: hackathonKeys.list(query),
    queryFn: () => hackathonsApi.list(query, token),
    placeholderData: (prev) => prev,
  });
}

export function useHackathon(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: hackathonKeys.detail(id ?? ""),
    queryFn: () => hackathonsApi.get(id as string, token),
    enabled: Boolean(id),
  });
}

export function useMyHackathons(enabled = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: hackathonKeys.mine,
    queryFn: () => hackathonsApi.mine(token as string),
    enabled: enabled && Boolean(token),
  });
}

export function useBookmarks() {
  const { token } = useAuth();
  return useQuery({
    queryKey: hackathonKeys.bookmarks,
    queryFn: () => hackathonsApi.bookmarks(token as string),
    enabled: Boolean(token),
  });
}

/**
 * Bookmark toggle with optimistic updates across every cached feed page and the
 * detail entry, so the pill flips instantly and rolls back if the request fails.
 */
export function useToggleBookmark() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ hackathon, bookmarked }: { hackathon: Hackathon; bookmarked: boolean }) =>
      bookmarked
        ? hackathonsApi.unbookmark(hackathon.id, token as string)
        : hackathonsApi.bookmark(hackathon.id, token as string),

    onMutate: async ({ hackathon, bookmarked }) => {
      await qc.cancelQueries({ queryKey: hackathonKeys.all });
      const prevLists = qc.getQueriesData({ queryKey: hackathonKeys.all });
      const patch = (h: Hackathon) => (h.id === hackathon.id ? { ...h, bookmarked: !bookmarked } : h);
      qc.setQueriesData({ queryKey: hackathonKeys.all }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const data = old as { items?: Hackathon[] };
        if (!Array.isArray(data.items)) return old;
        return { ...data, items: data.items.map(patch) };
      });
      return { prevLists };
    },

    onError: (_err, _vars, ctx) => {
      for (const [key, value] of ctx?.prevLists ?? []) qc.setQueryData(key, value);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: hackathonKeys.all });
      qc.invalidateQueries({ queryKey: hackathonKeys.bookmarks });
    },
  });
}

export function useCreateHackathon() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: HackathonDraft) => hackathonsApi.create(body, token as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hackathonKeys.all });
      qc.invalidateQueries({ queryKey: hackathonKeys.mine });
    },
  });
}

export function useDeleteHackathon() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hackathonsApi.remove(id, token as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hackathonKeys.all });
      qc.invalidateQueries({ queryKey: hackathonKeys.mine });
    },
  });
}
