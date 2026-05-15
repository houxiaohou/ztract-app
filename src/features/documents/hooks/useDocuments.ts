import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listDocuments } from '@/features/documents/api';
import { useAuthStore } from '@/features/auth/store';
import type {
  DocumentListFilters,
  PaginatedDocuments,
} from '@/features/documents/types';
import type { ApiError } from '@/lib/api';

export const documentsQueryKey = (
  projectId: string,
  page: number,
  size: number,
  filters: DocumentListFilters = {},
) =>
  [
    'documents',
    'list',
    projectId,
    { page, size, status: filters.status ?? null, stale: filters.stale ?? null },
  ] as const;

export function useDocuments(
  projectId: string | undefined,
  page: number,
  size: number,
  filters: DocumentListFilters = {},
) {
  const token = useAuthStore((state) => state.token);

  return useQuery<PaginatedDocuments, ApiError>({
    queryKey: documentsQueryKey(projectId ?? '', page, size, filters),
    queryFn: () =>
      listDocuments(projectId as string, { page, size, ...filters }),
    enabled: Boolean(projectId && token),
    staleTime: 10 * 1000,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasInFlight = items.some(
        (doc) => doc.status === 'pending' || doc.status === 'processing',
      );
      return hasInFlight ? 5_000 : false;
    },
  });
}
