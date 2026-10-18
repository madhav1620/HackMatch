/** Shared JSON fetch helper for the API client modules.
 *  Adds the bearer token when present and unwraps `{ error: { code, message } }`. */
export type HttpOptions = RequestInit & { token?: string | null };

export async function request<T>(path: string, { token, ...init }: HttpOptions = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let message = res.statusText || "Request failed";
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error?.message) message = parsed.error.message;
      else if (typeof parsed === "string") message = parsed;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
