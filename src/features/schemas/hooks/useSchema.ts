import { useQuery } from '@tanstack/react-query';

import { getSchema } from '@/features/schemas/api';
import { useAuthStore } from '@/features/auth/store';
import type { SchemaRead } from '@/features/schemas/types';
import type { ApiError } from '@/lib/api';

export const schemaQueryKey = (projectId: string) =>
  ['schemas', 'detail', projectId] as const;

export function useSchema(projectId: string | undefined) {
  const token = useAuthStore((state) => state.token);

  return useQuery<SchemaRead | null, ApiError>({
    queryKey: schemaQueryKey(projectId ?? ''),
    queryFn: () => getSchema(projectId as string),
    enabled: Boolean(projectId && token),
    staleTime: 30 * 1000,
  });
}
