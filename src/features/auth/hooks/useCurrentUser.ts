import { useQuery } from '@tanstack/react-query';

import { getCurrentUser } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import type { UserRead } from '@/features/auth/types';
import type { ApiError } from '@/lib/api';

export const currentUserQueryKey = ['auth', 'me'] as const;

export function useCurrentUser() {
  const token = useAuthStore((state) => state.token);

  return useQuery<UserRead, ApiError>({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}
