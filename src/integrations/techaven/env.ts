export function getTechavenApiBaseUrl(): string {
  const url = import.meta.env.VITE_TECHAVEN_API_URL as string | undefined;
  return (url?.replace(/\/$/, "") || "http://localhost:8000").trim();
}
