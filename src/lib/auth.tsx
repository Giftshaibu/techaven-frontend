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

import { logout as apiLogout } from "@/integrations/techaven/customer";
import {
  clearAuthTokens,
  getAccessToken,
  persistAuthTokens,
  ensureSession, getSession, refreshSession, resetSessionRestoration, subscribeSession,
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
  const [sessionError, setSessionError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const session = await refreshSession();
    setUser(session?.user ?? null);
    setAccessTokenState(session?.access_token ?? null);
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
    await apiLogout();
    clearAuthTokens();
    setUser(null);
    setAccessTokenState(null);
    router.invalidate();
  }, [router]);

  useEffect(() => {
    const unsubscribe = subscribeSession(() => {
      const session = getSession();
      setUser(session?.user ?? null);
      setAccessTokenState(getAccessToken());
      setSessionError(null);
    });
    void ensureSession().then(session => {
      setUser(session?.user ?? null);
      setAccessTokenState(session?.access_token ?? null);
    }).catch(() => setSessionError('Unable to restore your session. Check your connection and retry.'))
      .finally(() => setLoading(false));
    return unsubscribe;
  }, []);

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

  return <AuthContext.Provider value={value}>
    {sessionError ? <div role="alert" className="shell py-3 text-sm">
      {sessionError} <button className="ml-2 underline" onClick={async () => {
        resetSessionRestoration();
        try { await ensureSession(); setSessionError(null); router.invalidate(); }
        catch { setSessionError('Unable to restore your session. Check your connection and retry.'); }
      }}>Retry</button>
    </div> : null}
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Only allow same-origin relative paths as a post-sign-in destination. */
export function safeRedirect(value: string | undefined): string {
  if (!value) return "/account";
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/account";
  return value;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
