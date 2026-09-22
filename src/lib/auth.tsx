import { useRouter } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getProfile, logout as apiLogout } from "@/integrations/techaven/customer";
import {
  clearAuthTokens,
  getAccessToken,
  persistAuthTokens,
} from "@/integrations/techaven/token";
import type { AuthPayload, TechavenUser } from "@/integrations/techaven/types";

type AuthContextValue = {
  user: TechavenUser | null;
  accessToken: string | null;
  loading: boolean;
  setSessionFromAuth: (payload: AuthPayload) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  accessToken: null,
  loading: true,
  setSessionFromAuth: () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TechavenUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setAccessTokenState(null);
      return;
    }
    setAccessTokenState(token);
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch {
      clearAuthTokens();
      setUser(null);
      setAccessTokenState(null);
    }
  }, []);

  const setSessionFromAuth = useCallback(
    (payload: AuthPayload) => {
      persistAuthTokens(payload);
      setAccessTokenState(payload.access_token);
      setUser(payload.user);
      router.invalidate();
    },
    [router],
  );

  const signOut = useCallback(async () => {
    try {
      if (getAccessToken()) await apiLogout();
    } catch {
      /* ignore network errors on logout */
    }
    clearAuthTokens();
    setUser(null);
    setAccessTokenState(null);
    router.invalidate();
  }, [router]);

  useEffect(() => {
    void (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      setSessionFromAuth,
      signOut,
      refreshUser,
    }),
    [user, accessToken, loading, setSessionFromAuth, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Only allow same-origin relative paths as a post-sign-in destination. */
export function safeRedirect(value: string | undefined): string {
  if (!value) return "/account";
  if (!value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
