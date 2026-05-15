import { useQuery } from '@tanstack/react-query';

import { listTiers } from '@/features/billing/api';
import type { TierRead } from '@/features/billing/types';
import type { ApiError } from '@/lib/api';

export const tiersQueryKey = ['billing', 'tiers'] as const;

export function useTiers() {
  return useQuery<TierRead[], ApiError>({
    queryKey: tiersQueryKey,
    queryFn: listTiers,
    staleTime: 5 * 60 * 1000,
  });
}
