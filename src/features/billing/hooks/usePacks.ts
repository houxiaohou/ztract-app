import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listMyPacks } from '@/features/billing/api';
import { useAuthStore } from '@/features/auth/store';
import type { PaginatedQuotaPacks } from '@/features/billing/types';
import type { ApiError } from '@/lib/api';

export const packsQueryKey = (page: number, size: number) =>
  ['billing', 'packs', { page, size }] as const;

export function usePacks(page: number, size: number) {
  const token = useAuthStore((state) => state.token);

  return useQuery<PaginatedQuotaPacks, ApiError>({
    queryKey: packsQueryKey(page, size),
    queryFn: () => listMyPacks({ page, size }),
    enabled: Boolean(token),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
