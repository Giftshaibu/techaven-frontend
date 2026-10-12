import { useEffect, useRef, useState } from 'react';
import { googleChallenge, googleSignIn } from '@/integrations/techaven/customer';
import type { AuthPayload } from '@/integrations/techaven/types';

type GoogleIdentity = { initialize: (options: { client_id: string; nonce: string; auto_select: false; callback: (result: { credential: string }) => void }) => void;
  renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string }) => void };
declare global { interface Window { google?: { accounts: { id: GoogleIdentity } } } }
let scriptPromise: Promise<void> | undefined;
function loadGoogle() {
  if (window.google?.accounts.id) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    const timer = setTimeout(() => { script.remove(); reject(new Error('Google sign-in did not load. Please retry')); }, 15000);
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Google sign-in did not load. Please retry')); };
    document.head.appendChild(script);
  }).catch(error => { scriptPromise = undefined; throw error; });
  return scriptPromise;
}
export function GoogleSignIn({ onAuth, onLink }: { onAuth: (session: AuthPayload) => void; onLink: (challenge: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const onAuthRef = useRef(onAuth); onAuthRef.current = onAuth;
  const onLinkRef = useRef(onLink); onLinkRef.current = onLink;
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setError(null);
    void googleChallenge().then(async challenge => {
      await loadGoogle();
      if (!active || !container.current) return;
      window.google!.accounts.id.initialize({ client_id: challenge.client_id, nonce: challenge.nonce, auto_select: false,
        callback: result => {
          if (!active) return;
          setBusy(true);
          void googleSignIn({ id_token: result.credential, challenge_id: challenge.challenge_id, nonce: challenge.nonce })
            .then(value => { if (!active) return; if ('link_required' in value) onLinkRef.current(value.linking_challenge); else onAuthRef.current(value); })
            .catch(error => { if (active) { setError(error instanceof Error ? error.message : 'Google sign-in failed'); } })
            .finally(() => { if (active) setBusy(false); });
        } });
      container.current.replaceChildren();
      window.google!.accounts.id.renderButton(container.current, { theme: 'outline', size: 'large', text: 'continue_with' });
    }).catch(() => { if (active) setError('Google sign-in is currently unavailable. You can sign in with email.'); });
    // The nonce expires after five minutes; refresh before the next click can use an expired challenge.
    const timer = setTimeout(() => { if (active) setRetry(value => value + 1); }, 240000);
    return () => { active = false; clearTimeout(timer); };
  }, [retry]);
  return <div className="mt-6 border-t border-border pt-6">
    <div ref={container} aria-label="Continue with Google" className={busy ? 'pointer-events-none opacity-60' : ''} />
    {busy ? <p role="status" className="mt-2 text-sm">Signing in…</p> : null}
    {error ? <p role="status" className="text-sm text-muted-foreground">{error} <button type="button" className="underline" onClick={() => setRetry(value => value + 1)}>Retry</button></p> : null}
  </div>;
}
