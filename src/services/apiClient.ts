import { getServerUrl } from "./syncConfig";

export type ApiError = { message: string; status?: number };

async function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Request timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = await getServerUrl();
  if (!base) throw new Error("Server URL nije podešen. Otvori Sync Settings i upiši URL.");
  const url = base.replace(/\/+$/, "") + path;

  return withTimeout(fetch(url, init), 12000);
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw { message: text || `HTTP ${res.status}`, status: res.status } as ApiError;
  }
  return (await res.json()) as T;
}
