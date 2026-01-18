import { apiFetch, apiJson } from "./apiClient";

export type RemoteState = any; // server drži isti shape kao tvoj AppState

export async function getRemoteState(): Promise<RemoteState> {
  return apiJson<RemoteState>("/api/state", { method: "GET" });
}

export async function putRemoteState(state: RemoteState): Promise<void> {
  await apiJson("/api/state", { method: "PUT", body: JSON.stringify(state) });
}

/**
 * Upload image to server (multipart/form-data).
 * Returns absolute URL to uploaded image so admin web can open it.
 */
export async function uploadImageAsync(localUri: string, kind: "rental" | "issue"): Promise<string> {
  const filename = localUri.split("/").pop() || `${kind}_${Date.now()}.jpg`;
  const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
  const mime = ext === "png" ? "image/png" : "image/jpeg";

  const form = new FormData();
  form.append("file", {
    uri: localUri,
    name: filename,
    type: mime,
  } as any);
  form.append("kind", kind);

  const res = await apiFetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
