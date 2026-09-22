export function getTechavenApiBaseUrl(): string {
  const url = import.meta.env.VITE_TECHAVEN_API_URL as string | undefined;
  return (url?.replace(/\/$/, "") || "http://72.62.213.127:8000").trim();
}
