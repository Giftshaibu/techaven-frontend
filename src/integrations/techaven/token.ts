const ACCESS_TOKEN_KEY = "techaven.access_token";
const REFRESH_TOKEN_KEY = "techaven.refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}

export function persistAuthTokens(payload: {
  access_token: string;
  refresh_token?: string;
}): void {
  setAccessToken(payload.access_token);
  if (payload.refresh_token) setRefreshToken(payload.refresh_token);
}
