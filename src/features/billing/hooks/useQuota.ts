import { useQuery } from '@tanstack/react-query';

import { getMyQuota } from '@/features/billing/api';
import { useAuthStore } from '@/features/auth/store';
import type { QuotaSummary } from '@/features/billing/types';
import type { ApiError } from '@/lib/api';

export const quotaQueryKey = ['billing', 'quota', 'me'] as const;

export function useQuota() {
  const token = useAuthStore((state) => state.token);

  return useQuery<QuotaSummary, ApiError>({
    queryKey: quotaQueryKey,
    queryFn: getMyQuota,
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });
}
