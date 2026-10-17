import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, type User } from "../api/auth";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
};

type AuthCtx = AuthState & {
  login: (email: string, password: string) => Promise<User | null>;
  register: (email: string, password: string, name: string) => Promise<{ email: string; userId: string }>;
  verifyOtp: (email: string, code: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateMe: (body: Partial<User>) => Promise<User>;
};

const STORAGE_KEY = "hm_access_token";

const Ctx = createContext<AuthCtx | null>(null);

function useLocalStorage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const set = useCallback((t: string | null) => {
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
    setToken(t);
  }, []);

  return { token, set };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, set } = useLocalStorage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.me(token);
        if (!alive) return;
        setUser(res.user);
      } catch {
        // Access token expired/invalid → silently rotate using the httpOnly refresh cookie.
        // Setting the new token re-runs this effect, which then re-fetches the profile.
        try {
          const rotated = await authApi.refresh();
          if (!alive) return;
          set(rotated.accessToken);
        } catch {
          if (!alive) return;
          set(null);
          setUser(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [token, set]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      set(res.accessToken);
      const user = res.user ?? (await authApi.me(res.accessToken)).user;
      setUser(user);
      return user;
    },
    [set],
  );

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await authApi.register({ email, password, name });
    return res;
  }, []);

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      const res = await authApi.verifyOtp({ email, code });
      set(res.accessToken);
      setUser(res.user);
      return res.user;
    },
    [set],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    set(null);
    setUser(null);
  }, [set]);

  const refresh = useCallback(async () => {
    const rotated = await authApi.refresh();
    set(rotated.accessToken);
  }, [set]);

  const updateMe = useCallback(
    async (body: Partial<User>) => {
      if (!token) throw new Error("Not authenticated");
      const res = await authApi.updateMe(token, body);
      setUser(res.user);
      return res.user;
    },
    [token],
  );

  const value = useMemo(
    () => ({ user, token, loading, login, register, verifyOtp, logout, refresh, updateMe }),
    [user, token, loading, login, register, verifyOtp, logout, refresh, updateMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
