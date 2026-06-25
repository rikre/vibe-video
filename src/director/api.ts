const apiRoot = (import.meta.env.VITE_DIRECTOR_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:4174/api" : "/api")).replace(/\/$/, "");

export type RemoteProject<T> = {
  id: string;
  schemaVersion: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  state: T;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function projectIdFromUrl() {
  const value = new URL(window.location.href).searchParams.get("project");
  return value && /^[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : null;
}

export function getProjectId() {
  const fromUrl = projectIdFromUrl();
  if (fromUrl) {
    localStorage.setItem("vibevideo-director-project-id", fromUrl);
    return fromUrl;
  }
  const saved = localStorage.getItem("vibevideo-director-project-id");
  const projectId = saved && /^[a-zA-Z0-9_-]{1,128}$/.test(saved) ? saved : crypto.randomUUID();
  localStorage.setItem("vibevideo-director-project-id", projectId);
  const url = new URL(window.location.href);
  url.searchParams.set("project", projectId);
  window.history.replaceState(null, "", url);
  return projectId;
}

async function request<T>(path: string, init?: RequestInit, allowNotFound = false): Promise<T | null> {
  const response = await fetch(`${apiRoot}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  if (allowNotFound && (response.status === 404 || response.status === 204)) return null;
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body ? String(body.message) : `请求失败 (${response.status})`;
    throw new ApiError(response.status, message, body);
  }
  return body as T;
}

export function absoluteApiUrl(url: string) {
  if (!url.startsWith("/")) return url;
  const origin = /^https?:\/\//.test(apiRoot) ? new URL(apiRoot).origin : window.location.origin;
  return new URL(url, origin).toString();
}

export async function fetchProject<T>(projectId: string, signal?: AbortSignal) {
  return request<RemoteProject<T>>(`/director-projects/${encodeURIComponent(projectId)}`, { signal }, true);
}

export async function saveProject<T>(projectId: string, state: T, revision: number, signal?: AbortSignal) {
  return request<RemoteProject<T>>(`/director-projects/${encodeURIComponent(projectId)}`, {
    method: "PUT",
    signal,
    headers: { "if-match": `\"${revision}\"` },
    body: JSON.stringify({ revision, state }),
  }) as Promise<RemoteProject<T>>;
}

export async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("读取文件失败"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

type StoredFile = { id: string; url: string; mimeType: string; size: number; sha256: string; fileName: string };

export async function uploadAsset(projectId: string, file: File, id = crypto.randomUUID()) {
  const result = await request<StoredFile>(`/director-projects/${encodeURIComponent(projectId)}/assets`, {
    method: "POST",
    body: JSON.stringify({ id, fileName: file.name, dataUrl: await fileToDataUrl(file) }),
  });
  return { ...result!, url: absoluteApiUrl(result!.url) };
}

export async function uploadAssetData(projectId: string, dataUrl: string, fileName: string, id = crypto.randomUUID()) {
  const result = await request<StoredFile>(`/director-projects/${encodeURIComponent(projectId)}/assets`, {
    method: "POST",
    body: JSON.stringify({ id, fileName, dataUrl }),
  });
  return { ...result!, url: absoluteApiUrl(result!.url) };
}

export async function uploadCapture(projectId: string, captureId: string, dataUrl: string) {
  const result = await request<StoredFile>(`/director-projects/${encodeURIComponent(projectId)}/captures`, {
    method: "POST",
    body: JSON.stringify({ id: captureId, fileName: `${captureId}.jpg`, dataUrl }),
  });
  return { ...result!, url: absoluteApiUrl(result!.url) };
}

export async function deleteCaptureFile(projectId: string, captureId: string) {
  await request(`/director-projects/${encodeURIComponent(projectId)}/captures/${encodeURIComponent(captureId)}`, { method: "DELETE" });
}

export async function sendCaptureToCanvas(projectId: string, capture: { id: string; cameraId: string; ratio: string; imageUrl: string }) {
  return request(`/canvases/${encodeURIComponent(projectId)}/nodes/from-capture`, {
    method: "POST",
    body: JSON.stringify({
      id: capture.id,
      type: "image",
      source: { directorProjectId: projectId, cameraId: capture.cameraId, captureId: capture.id },
      ratio: capture.ratio,
      imageUrl: capture.imageUrl,
    }),
  });
}
