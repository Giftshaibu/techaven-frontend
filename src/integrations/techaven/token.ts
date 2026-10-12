import type { AuthPayload } from './types';
let accessToken: string | null = null;
let currentSession: AuthPayload | null = null;
let accessExpiresAt = 0;
let restoration: Promise<AuthPayload | null> | undefined;
let refreshOperation: Promise<AuthPayload | null> | undefined;
const listeners = new Set<() => void>();
let sessionGeneration = 0;
export class SessionError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}
function removeLegacyTokens() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem('techaven.access_token'); window.localStorage.removeItem('techaven.refresh_token'); } catch { /* Storage can be unavailable. */ }
}
export function getAccessToken(): string | null { return typeof window === 'undefined' ? null : accessToken; }
export function getSession(): AuthPayload | null { return typeof window === 'undefined' ? null : currentSession; }
export function subscribeSession(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setAccessToken(token: string | null) { accessToken = token; removeLegacyTokens(); }
export function clearAuthTokens() {
  sessionGeneration++;
  accessToken = null; currentSession = null; removeLegacyTokens();
  accessExpiresAt = 0;
  restoration = Promise.resolve(null);
  for (const listener of listeners) listener();
}
export function persistAuthTokens(payload: AuthPayload) {
  if (typeof window === 'undefined') return;
  sessionGeneration++;
  accessToken = payload.access_token; currentSession = payload; removeLegacyTokens();
  accessExpiresAt = Date.now() + (payload.expires_in ?? 900) * 1000;
  restoration = Promise.resolve(payload);
  for (const listener of listeners) listener();
}
export function refreshSession(): Promise<AuthPayload | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (refreshOperation) return refreshOperation;
  removeLegacyTokens();
  const generation = sessionGeneration;
  refreshOperation = (async () => {
    const performRefresh = () => fetch('/api/v2/auth/refresh', { method: 'POST', credentials: 'same-origin' as const, headers: { 'Content-Type': 'application/json' }, body: '{}' });
    // Serialize cookie rotation between tabs where Web Locks are available.
    const response = navigator.locks ? await navigator.locks.request('techaven-auth-refresh', performRefresh) : await performRefresh();
    const body = await response.json();
    if (generation !== sessionGeneration) return currentSession;
    if (response.status === 401) { clearAuthTokens(); return null; }
    if (!response.ok || !body.success) throw new SessionError(body.message || 'Unable to restore your session. Please retry', response.status, body.code);
    if (typeof body.data?.access_token !== 'string' || !body.data?.user?.id) throw new SessionError('Unable to restore your session. Please retry', 503);
    persistAuthTokens(body.data as AuthPayload);
    return body.data as AuthPayload;
  })().finally(() => { refreshOperation = undefined; });
  return refreshOperation;
}
export function ensureSession(): Promise<AuthPayload | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (currentSession) return accessExpiresAt > Date.now() + 30000 ? Promise.resolve(currentSession) : refreshSession();
  if (!restoration) restoration = refreshSession().catch(error => { restoration = undefined; throw error; });
  return restoration;
}
export function resetSessionRestoration() { restoration = undefined; }
