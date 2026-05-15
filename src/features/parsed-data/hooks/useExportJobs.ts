import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listExportJobs } from '@/features/parsed-data/api';
import { useAuthStore } from '@/features/auth/store';
import type { PaginatedExportJobs } from '@/features/parsed-data/types';
import type { ApiError } from '@/lib/api';

export const exportJobsQueryKey = (
  projectId: string,
  page: number,
  size: number,
) => ['parsed-data', 'exports', projectId, { page, size }] as const;

export function useExportJobs(
  projectId: string | undefined,
  page: number,
  size: number,
) {
  const token = useAuthStore((state) => state.token);

  return useQuery<PaginatedExportJobs, ApiError>({
    queryKey: exportJobsQueryKey(projectId ?? '', page, size),
    queryFn: () => listExportJobs(projectId as string, { page, size }),
    enabled: Boolean(projectId && token),
    staleTime: 5 * 1000,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const inFlight = items.some(
        (job) => job.status === 'pending' || job.status === 'processing',
      );
      return inFlight ? 4_000 : false;
    },
  });
}
