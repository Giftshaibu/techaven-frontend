import { getTechavenApiBaseUrl } from "./env";
import type { ApiEnvelope } from "./types";
import { getAccessToken } from "./token";

export class TechavenApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "TechavenApiError";
    this.status = status;
    this.body = body;
  }
}

export type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean | "optional";
  headers?: Record<string, string>;
  /** When set, body is sent as FormData and Content-Type is omitted */
  formData?: FormData;
};

export async function techavenRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = false, headers = {}, formData } = options;
  const url = `${getTechavenApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const reqHeaders = new Headers(headers);
  if (!formData && body !== undefined && method !== "GET" && method !== "HEAD") {
    reqHeaders.set("Content-Type", "application/json");
  }

  if (auth === true || auth === "optional") {
    const token = getAccessToken();
    if (token) reqHeaders.set("Authorization", `Bearer ${token}`);
    else if (auth === true) {
      throw new TechavenApiError("Sign in required", 401);
    }
  }

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const parsed: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const envelope = parsed as ApiEnvelope<unknown> | undefined;
    const message =
      envelope && typeof envelope === "object" && "message" in envelope && envelope.message
        ? String(envelope.message)
        : `Request failed (${response.status})`;
    throw new TechavenApiError(message, response.status, parsed);
  }

  if (parsed && typeof parsed === "object" && "success" in parsed) {
    const envelope = parsed as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new TechavenApiError(envelope.message || "Request failed", response.status, envelope);
    }
    return envelope.data;
  }

  return parsed as T;
}
