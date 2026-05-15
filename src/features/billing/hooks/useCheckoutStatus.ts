import { useQuery, type Query } from '@tanstack/react-query';

import { getCheckoutStatus } from '@/features/billing/api';
import { useAuthStore } from '@/features/auth/store';
import type { QuotaPackRead } from '@/features/billing/types';
import type { ApiError } from '@/lib/api';

export const checkoutStatusQueryKey = (sessionId: string) =>
  ['billing', 'checkout-status', sessionId] as const;

const POLL_INTERVAL_MS = 2000;
const WEBHOOK_MAX_RETRIES = 20;
const DEFAULT_MAX_RETRIES = 3;

export function isPackPaid(pack: QuotaPackRead): boolean {
  if (pack.paid_at) return true;
  const status = pack.status?.toLowerCase();
  return status === 'active' || status === 'paid';
}

export function useCheckoutStatus(sessionId: string | null) {
  const token = useAuthStore((state) => state.token);

  return useQuery<QuotaPackRead, ApiError>({
    queryKey: checkoutStatusQueryKey(sessionId ?? ''),
    queryFn: () => getCheckoutStatus(sessionId as string),
    enabled: Boolean(sessionId && token),
    retry: (failureCount, error) => {
      if (error.status === 404) return failureCount < WEBHOOK_MAX_RETRIES;
      return failureCount < DEFAULT_MAX_RETRIES;
    },
    retryDelay: POLL_INTERVAL_MS,
    refetchInterval: (query: Query<QuotaPackRead, ApiError>) => {
      const data = query.state.data;
      if (data && isPackPaid(data)) return false;
      return POLL_INTERVAL_MS;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });
}
