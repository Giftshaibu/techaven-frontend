export function getTechavenApiBaseUrl(): string {
  if (!import.meta.env.SSR) return '';
  const serverUrl = import.meta.env['VITE_TECHAVEN_SERVER_API_URL'] as string | undefined;
  const url = import.meta.env['VITE_TECHAVEN_API_URL'] as string | undefined;
  return ((process.env.TECHAVEN_API_URL || serverUrl || url)?.replace(/\/$/, "") || "http://localhost:8000").trim();
}
