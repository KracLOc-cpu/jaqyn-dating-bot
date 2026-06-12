/**
 * HTTP-клиент к бэкенду. В каждый запрос подставляет X-Telegram-Init-Data
 * (см. API_FOR_FRONTEND.md). Базовый URL — из VITE_API_URL.
 *
 * Когда VITE_USE_MOCKS=true, реальные запросы не идут — данные отдаёт lib/mock
 * через хуки (api/hooks.ts). Этот модуль используется только в «боевом» режиме.
 */
import { getInitData } from "./telegram";
import type {
  FeedParams,
  MatchOut,
  MeProfile,
  PhotoOut,
  PresignOut,
  ProfileCard,
  ProfileCreate,
  ProfileUpdate,
  SwipeResult,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const USE_MOCKS =
  (import.meta.env.VITE_USE_MOCKS ?? "true").toString() === "true";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, unknown> } = {}
): Promise<T> {
  const url = new URL(BASE_URL + path);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, String(x)));
      else url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": getInitData(),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // профили
  feed: (p: FeedParams = {}) =>
    request<ProfileCard[]>("/profiles/feed", {
      query: { limit: p.limit, city: p.city, languages: p.languages },
    }),
  me: () => request<MeProfile>("/profiles/me"),
  createProfile: (body: ProfileCreate) =>
    request<MeProfile>("/profiles", { method: "POST", body }),
  updateProfile: (body: ProfileUpdate) =>
    request<MeProfile>("/profiles/me", { method: "PATCH", body }),
  finalize: () => request<MeProfile>("/profiles/finalize", { method: "POST" }),
  deleteProfile: () => request<{ ok: boolean }>("/profiles/me", { method: "DELETE" }),

  // свайпы / мэтчи
  swipe: (swiped_id: number, liked: boolean) =>
    request<SwipeResult>("/swipes", { method: "POST", body: { swiped_id, liked } }),
  matches: () => request<MatchOut[]>("/matches"),

  // фото
  myPhotos: () => request<PhotoOut[]>("/photos/me"),
  presign: (content_type: string) =>
    request<PresignOut>("/photos/presign", { method: "POST", body: { content_type } }),
  confirmPhoto: (storage_key: string) =>
    request<PhotoOut>("/photos/confirm", { method: "POST", body: { storage_key } }),
  deletePhoto: (id: string) =>
    request<{ ok: boolean }>(`/photos/${id}`, { method: "DELETE" }),

  // модерация
  report: (reported_id: number, reason: string) =>
    request<{ ok: boolean }>("/reports", { method: "POST", body: { reported_id, reason } }),
  block: (blocked_id: number) =>
    request<{ ok: boolean }>("/blocks", { method: "POST", body: { blocked_id } }),
};

export async function uploadToPresignedPost(
  presign: PresignOut,
  file: File
): Promise<void> {
  const form = new FormData();
  for (const [key, value] of Object.entries(presign.fields)) {
    form.append(key, value);
  }
  form.append("file", file);

  const res = await fetch(presign.url, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `photo upload failed: ${res.statusText}`);
  }
}

export { ApiError };
