import { QueryClient, useQuery } from "@tanstack/react-query";
import * as loaders from "@/features/municipalities/server/loaders";

// Query Keys Factory
export const queryKeys = {
  all: ["municipalities"] as const,
  municipalities: () => [...queryKeys.all] as const,
  municipality: (id: string) => [...queryKeys.all, id] as const,
  availableMunicipalities: () => [...queryKeys.all, "available"] as const,
};

// Query Functions Factory
export const queryFns = {
  getMunicipalities: () => loaders.getMunicipalities(),
  getMunicipality: (id: string) => loaders.getMunicipality(id),
  getAvailableMunicipalities: () => loaders.loadAvailableMunicipalities(),
};

export function useMunicipalities() {
  return useQuery({
    queryKey: queryKeys.municipalities(),
    queryFn: queryFns.getMunicipalities,
  });
}

export function useAvailableMunicipalities() {
  return useQuery({
    queryKey: queryKeys.availableMunicipalities(),
    queryFn: queryFns.getAvailableMunicipalities,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export async function prefetchMunicipalities(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.municipalities(),
    queryFn: queryFns.getMunicipalities,
  });
}

export function useMunicipality(id: string) {
  return useQuery({
    queryKey: queryKeys.municipality(id),
    queryFn: async () => await queryFns.getMunicipality(id),
  });
}

export async function prefetchMunicipality(
  queryClient: QueryClient,
  id: string
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.municipality(id),
    queryFn: async () => await queryFns.getMunicipality(id),
  });
}
