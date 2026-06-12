import { QueryClient } from "@tanstack/react-query";

/**
 * Общий QueryClient. staleTime подобран так, чтобы лента и профиль не
 * перезапрашивались зря, но signed URL фото (TTL ~1ч) успевали обновляться
 * раньше истечения — для фото будем ставить точечный staleTime/refetch.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
