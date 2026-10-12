import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const requestUrl = new URL(request.url);
      if (requestUrl.pathname.startsWith('/api/')) {
        const target = (import.meta.env['VITE_TECHAVEN_SERVER_API_URL'] as string | undefined) || 'http://localhost:8000';
        const headers = new Headers(request.headers);
        headers.delete('host');
        headers.delete('connection');
        const upstream = await fetch(`${target.replace(/\/$/, '')}${requestUrl.pathname}${requestUrl.search}`, {
          method: request.method, headers, redirect: 'manual',
          ...(request.method !== 'GET' && request.method !== 'HEAD' ? { body: await request.arrayBuffer() } : {}),
        });
        const responseHeaders = new Headers(upstream.headers);
        // Fetch may decompress upstream bodies; forward the resulting bytes consistently.
        for (const name of ['content-length', 'content-encoding', 'connection', 'transfer-encoding']) responseHeaders.delete(name);
        const cookies = upstream.headers.getSetCookie?.() ?? [];
        if (cookies.length) {
          responseHeaders.delete('set-cookie');
          for (const cookie of cookies) responseHeaders.append('set-cookie', cookie);
        }
        responseHeaders.set('Cache-Control', 'no-store');
        return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
