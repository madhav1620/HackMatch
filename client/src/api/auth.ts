import type {
  AuthResponse,
  BasicOk,
  MeResponse,
  PublicProfileResponse,
  OtpVerifyResponse,
  RefreshResponse,
  RegisterResponse,
  User,
} from "./types";

const base = "";

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(base + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    credentials: "include", // send/receive the httpOnly refresh cookie
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
  return res.json() as Promise<T>;
}

export const authApi = {
  register: (body: { email: string; password: string; name: string }) =>
    http<RegisterResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  verifyOtp: (body: { email: string; code: string }) =>
    http<OtpVerifyResponse>("/api/auth/verify-otp", { method: "POST", body: JSON.stringify(body) }),
  resendOtp: (body: { email: string }) =>
    http<BasicOk>("/api/auth/resend-otp", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    http<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  refresh: () => http<RefreshResponse>("/api/auth/refresh", { method: "POST" }),
  logout: () => http<BasicOk>("/api/auth/logout", { method: "POST" }),
  me: (token: string) =>
    http<MeResponse>("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
  profile: (id: string, token: string) =>
    http<PublicProfileResponse>(`/api/auth/profiles/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } }),
  updateMe: (token: string, body: Partial<User>) =>
    http<MeResponse>("/api/auth/me", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
};

export type { User };
