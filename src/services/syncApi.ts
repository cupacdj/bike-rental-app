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
  const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() : "jpg";
  const mime = ext === "png" ? "image/png" : "image/jpeg";

  // Create FormData - note: 'kind' must be appended before 'file' for multer to read it
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", {
    uri: localUri,
    name: filename,
    type: mime,
  } as any);

  console.log('[uploadImageAsync] Uploading:', { localUri, kind, filename, mime });

  const res = await apiFetch("/api/upload", { 
    method: "POST", 
    body: form,
    // Don't set Content-Type header - let fetch set it with boundary
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error('[uploadImageAsync] Upload failed:', res.status, text);
    throw new Error(text || `Upload failed (${res.status})`);
  }
  
  const data = (await res.json()) as { url: string };
  console.log('[uploadImageAsync] Upload success:', data.url);
  return data.url;
}

/**
 * Update bike location on server when bike is returned
 */
export async function updateBikeLocation(bikeId: string, lat: number, lng: number): Promise<boolean> {
  try {
    console.log('[updateBikeLocation] Updating bike location:', { bikeId, lat, lng });
    await apiJson(`/api/bikes/${bikeId}/location`, {
      method: "PATCH",
      body: JSON.stringify({ lat, lng }),
    });
    console.log('[updateBikeLocation] Location updated successfully');
    return true;
  } catch (error) {
    console.error('[updateBikeLocation] Failed to update bike location:', error);
    return false;
  }
}
