import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listProjects } from '@/features/projects/api';
import { useAuthStore } from '@/features/auth/store';
import type {
  ListProjectsParams,
  PaginatedProjects,
} from '@/features/projects/types';
import type { ApiError } from '@/lib/api';

export const projectsQueryKey = (params: ListProjectsParams) =>
  [
    'projects',
    'list',
    { page: params.page, size: params.size, q: params.q ?? '', sort: params.sort ?? 'created_at_desc' },
  ] as const;

export function useProjects(params: ListProjectsParams) {
  const token = useAuthStore((state) => state.token);

  return useQuery<PaginatedProjects, ApiError>({
    queryKey: projectsQueryKey(params),
    queryFn: () => listProjects(params),
    enabled: Boolean(token),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
