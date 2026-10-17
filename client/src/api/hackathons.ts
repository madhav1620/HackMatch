import type {
  BookmarkToggleResponse,
  BookmarksResponse,
  Hackathon,
  HackathonDraft,
  HackathonListResponse,
  HackathonQuery,
} from "./types";

const base = "";

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(base + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `${res.status} ${res.statusText}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error?.message) message = parsed.error.message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const auth = (token?: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

/** Serialise the feed query — arrays become comma-separated, blanks dropped. */
export function toSearchParams(q: HackathonQuery): string {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.mode) params.set("mode", q.mode);
  if (q.orgType) params.set("orgType", q.orgType);
  if (q.tech?.length) params.set("tech", q.tech.join(","));
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  if (q.minPrize !== undefined) params.set("minPrize", String(q.minPrize));
  if (q.sort) params.set("sort", q.sort);
  if (q.page) params.set("page", String(q.page));
  if (q.limit) params.set("limit", String(q.limit));
  if (q.includeClosed) params.set("includeClosed", "true");
  return params.toString();
}

export const hackathonsApi = {
  list: (q: HackathonQuery, token?: string | null) =>
    http<HackathonListResponse>(`/api/hackathons?${toSearchParams(q)}`, { headers: auth(token) }),

  get: (id: string, token?: string | null) =>
    http<Hackathon>(`/api/hackathons/${id}`, { headers: auth(token) }),

  create: (body: HackathonDraft, token: string) =>
    http<Hackathon>("/api/hackathons", { method: "POST", headers: auth(token), body: JSON.stringify(body) }),

  update: (id: string, body: Partial<HackathonDraft>, token: string) =>
    http<Hackathon>(`/api/hackathons/${id}`, { method: "PATCH", headers: auth(token), body: JSON.stringify(body) }),

  remove: (id: string, token: string) =>
    http<void>(`/api/hackathons/${id}`, { method: "DELETE", headers: auth(token) }),

  mine: (token: string) => http<HackathonListResponse>("/api/hackathons/mine", { headers: auth(token) }),

  bookmark: (id: string, token: string, remindAt?: string) =>
    http<BookmarkToggleResponse>(`/api/hackathons/${id}/bookmark`, {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify(remindAt ? { remindAt } : {}),
    }),

  unbookmark: (id: string, token: string) =>
    http<BookmarkToggleResponse>(`/api/hackathons/${id}/bookmark`, { method: "DELETE", headers: auth(token) }),

  bookmarks: (token: string) => http<BookmarksResponse>("/api/bookmarks", { headers: auth(token) }),
};
