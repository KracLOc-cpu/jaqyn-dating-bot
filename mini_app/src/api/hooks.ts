/**
 * TanStack Query хуки. В мок-режиме (USE_MOCKS) возвращают фейк из lib/mock
 * с искусственной задержкой — UI разрабатывается без бэкенда. В боевом режиме
 * ходят в api (lib/api.ts).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError, USE_MOCKS } from "../lib/api";
import { MOCK_FEED, MOCK_MATCHES, MOCK_ME, MOCK_PHOTOS } from "../lib/mock";
import type { FeedParams, ProfileUpdate, SwipeResult } from "../lib/types";

const delay = <T>(data: T, ms = 400) =>
  new Promise<T>((r) => setTimeout(() => r(data), ms));

export function useFeed(params: FeedParams = {}) {
  return useQuery({
    queryKey: ["feed", params],
    queryFn: () => (USE_MOCKS ? delay(MOCK_FEED) : api.feed(params)),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => (USE_MOCKS ? delay(MOCK_ME) : api.me()),
    // 404 = профиля ещё нет (новый пользователь) — это не ошибка сети, не ретраим,
    // чтобы вход и гейт «/» отрабатывали сразу.
    retry: (count, err) =>
      !(err instanceof ApiError && err.status === 404) && count < 1,
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: () => (USE_MOCKS ? delay(MOCK_MATCHES) : api.matches()),
  });
}

export function useMyPhotos() {
  return useQuery({
    queryKey: ["myPhotos"],
    queryFn: () => (USE_MOCKS ? delay(MOCK_PHOTOS) : api.myPhotos()),
  });
}

export function useSwipe() {
  return useMutation({
    mutationFn: async ({
      swipedId,
      liked,
    }: {
      swipedId: number;
      liked: boolean;
    }): Promise<SwipeResult> => {
      if (USE_MOCKS) {
        // в моках: лайк по чётному id → мэтч (для проверки celebration)
        return delay(
          { matched: liked && swipedId % 2 === 0, contact_username: "dana_a" },
          200
        );
      }
      return api.swipe(swipedId, liked);
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileUpdate) =>
      USE_MOCKS ? delay({ ...MOCK_ME, ...body }) : api.updateProfile(body),
    onSuccess: (profile) => {
      qc.setQueryData(["me"], profile);
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => (USE_MOCKS ? delay({ ok: true }) : api.deleteProfile()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["myPhotos"] });
    },
  });
}

export function useReportProfile() {
  return useMutation({
    mutationFn: ({ reportedId, reason }: { reportedId: number; reason: string }) =>
      USE_MOCKS ? delay({ ok: true }, 250) : api.report(reportedId, reason),
  });
}

export function useBlockProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: number) =>
      USE_MOCKS ? delay({ ok: true }, 250) : api.block(blockedId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
