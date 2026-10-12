// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthPayload } from './types';

const payload = { access_token: 'new-access', user: { id: 12, name: 'Customer', role: 'customer' }, expires_in: 900 } as AuthPayload;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => { vi.resetModules(); vi.stubEnv('SSR', false); localStorage.clear(); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('storefront sessions', () => {
  it('renews an expired in-memory access token before loading a protected account', async () => {
    let now = Date.now(); vi.spyOn(Date, 'now').mockImplementation(() => now);
    const tokens = await import('./token'); tokens.persistAuthTokens(payload);
    now += 901000;
    const fetchMock = vi.fn().mockResolvedValue(json({ success: true, data: payload })); vi.stubGlobal('fetch', fetchMock);
    expect(await tokens.ensureSession()).toEqual(payload); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('restores once for simultaneous requests and removes legacy stored credentials', async () => {
    localStorage.setItem('techaven.access_token', 'legacy'); localStorage.setItem('techaven.refresh_token', 'legacy-refresh');
    const fetchMock = vi.fn().mockResolvedValue(json({ success: true, data: payload })); vi.stubGlobal('fetch', fetchMock);
    const tokens = await import('./token');
    const result = await Promise.all([tokens.ensureSession(), tokens.ensureSession(), tokens.refreshSession()]);
    expect(result.map(value => value?.user.id)).toEqual([12, 12, 12]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(tokens.getAccessToken()).toBe('new-access'); expect(localStorage.length).toBe(0);
    tokens.persistAuthTokens(payload); expect(localStorage.length).toBe(0);
  });
  it('retains identity on a temporary refresh failure and clears it on confirmed rejection', async () => {
    const tokens = await import('./token'); tokens.persistAuthTokens(payload);
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('network failure')).mockResolvedValueOnce(json({ success: false, code: 'SESSION_INVALID' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    await expect(tokens.refreshSession()).rejects.toThrow('network failure'); expect(tokens.getAccessToken()).toBe('new-access');
    expect(await tokens.refreshSession()).toBeNull(); expect(tokens.getAccessToken()).toBeNull(); expect(await tokens.ensureSession()).toBeNull();
  });
  it('allows retry after a failed initial restore', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ success: false, message: 'Unavailable' }, 503)).mockResolvedValueOnce(json({ success: true, data: payload }));
    vi.stubGlobal('fetch', fetchMock); const tokens = await import('./token');
    await expect(tokens.ensureSession()).rejects.toThrow('Unavailable'); expect(await tokens.ensureSession()).toEqual(payload);
  });
  it('does not resurrect a session when logout completes during a pending refresh', async () => {
    let resolve!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(r => { resolve = r; })));
    const tokens = await import('./token'); tokens.persistAuthTokens(payload);
    const pending = tokens.refreshSession(); await Promise.resolve();
    tokens.clearAuthTokens(); resolve(json({ success: true, data: payload }));
    expect(await pending).toBeNull(); expect(tokens.getAccessToken()).toBeNull();
  });
  it('retries an expired commerce request once with one shared refresh', async () => {
    const tokens = await import('./token'); tokens.persistAuthTokens({ ...payload, access_token: 'old-access' });
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (url.endsWith('/refresh')) return json({ success: true, data: payload });
      return new Headers(options?.headers).get('Authorization') === 'Bearer old-access'
        ? json({ success: false, code: 'ACCESS_EXPIRED' }, 401) : json({ success: true, data: { items: [] } });
    });
    vi.stubGlobal('fetch', fetchMock); const { techavenRequest } = await import('./client');
    await Promise.all([techavenRequest('/api/v2/cart', { auth: true }), techavenRequest('/api/v2/cart', { auth: true })]);
    expect(fetchMock.mock.calls.filter(call => call[0].endsWith('/refresh'))).toHaveLength(1);
    expect(fetchMock.mock.calls.every(call => call[0].startsWith('/api/'))).toBe(true);
  });
  it('does not refresh auth endpoints or retry endlessly', async () => {
    const tokens = await import('./token'); tokens.persistAuthTokens(payload);
    const fetchMock = vi.fn().mockImplementation(async (url: string) => url.endsWith('/refresh')
      ? json({ success: true, data: payload }) : json({ success: false, code: 'ACCESS_EXPIRED' }, 401));
    vi.stubGlobal('fetch', fetchMock); const { techavenRequest } = await import('./client');
    await expect(techavenRequest('/api/v2/auth/me', { auth: true })).rejects.toThrow(); expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockClear(); await expect(techavenRequest('/api/v2/cart', { auth: true })).rejects.toThrow(); expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
