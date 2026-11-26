import { getTechavenApiBaseUrl } from "@/integrations/techaven/env";

export type UploadProgress = (percent: number) => void;

export class UploadError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Sends one file as multipart field "file" and reports upload progress (0–100).
 * fetch() cannot observe request-body progress, so this uses XMLHttpRequest.
 * The backend stores the file in Cloudflare R2 and returns its URL.
 */
export function uploadFile<T>(
  path: string,
  file: File,
  { token, onProgress }: { token: string; onProgress?: UploadProgress | undefined },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${getTechavenApiBaseUrl()}${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.responseType = "text";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        // Hold at 99% until the server confirms the file reached storage.
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onerror = () => reject(new UploadError("Upload failed. Check your connection.", 0));
    xhr.onabort = () => reject(new UploadError("Upload cancelled", 0));
    xhr.onload = () => {
      let body: { success?: boolean; message?: string; code?: string; data?: T } | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && body?.success !== false && body?.data) {
        onProgress?.(100);
        resolve(body.data);
        return;
      }
      const fallback =
        xhr.status === 413 ? "That file is too large" : `Upload failed (${xhr.status})`;
      reject(new UploadError(body?.message || fallback, xhr.status, body?.code));
    };
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}
