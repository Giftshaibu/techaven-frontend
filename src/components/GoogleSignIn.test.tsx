// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleSignIn } from './GoogleSignIn';
import { googleChallenge, googleSignIn } from '@/integrations/techaven/customer';
vi.mock('@/integrations/techaven/customer', () => ({ googleChallenge: vi.fn(), googleSignIn: vi.fn() }));
const challenge = { challenge_id: 'challenge', nonce: 'nonce', client_id: 'client' };
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: ReturnType<typeof createRoot>;
afterEach(async () => { if (root) await act(async () => root.unmount()); delete window.google; document.body.replaceChildren(); vi.clearAllMocks(); });
describe('Google sign-in', () => {
  it('renders the explicit Google button with a nonce and requests account confirmation when needed', async () => {
    let callback!: (value: { credential: string }) => void;
    const initialize = vi.fn(options => { callback = options.callback; });
    const renderButton = vi.fn((element: HTMLElement) => { const button = document.createElement('button'); button.textContent = 'Continue with Google'; element.append(button); });
    window.google = { accounts: { id: { initialize, renderButton } } };
    vi.mocked(googleChallenge).mockResolvedValue(challenge);
    vi.mocked(googleSignIn).mockResolvedValue({ link_required: true, linking_challenge: 'link-secret' });
    const onAuth = vi.fn(), onLink = vi.fn(); const container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    await act(async () => { root.render(<GoogleSignIn onAuth={onAuth} onLink={onLink} />); });
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ nonce: 'nonce', auto_select: false, client_id: 'client' }));
    expect(container.textContent).toContain('Continue with Google');
    await act(async () => callback({ credential: 'google-id-token' }));
    expect(googleSignIn).toHaveBeenCalledWith({ id_token: 'google-id-token', nonce: 'nonce', challenge_id: 'challenge' });
    expect(onLink).toHaveBeenCalledWith('link-secret'); expect(onAuth).not.toHaveBeenCalled();
  });
  it('keeps email sign-in available when Google configuration or loading fails', async () => {
    vi.mocked(googleChallenge).mockRejectedValue(new Error('unconfigured'));
    const container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    await act(async () => { root.render(<GoogleSignIn onAuth={vi.fn()} onLink={vi.fn()} />); });
    expect(container.textContent).toContain('You can sign in with email'); expect(container.querySelector('button')?.textContent).toBe('Retry');
  });
});
