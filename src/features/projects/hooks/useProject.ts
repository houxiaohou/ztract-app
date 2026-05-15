import { useQuery } from '@tanstack/react-query';

import { getProject } from '@/features/projects/api';
import { useAuthStore } from '@/features/auth/store';
import type { ProjectRead } from '@/features/projects/types';
import type { ApiError } from '@/lib/api';

export const projectQueryKey = (projectId: string) =>
  ['projects', 'detail', projectId] as const;

export function useProject(projectId: string | undefined) {
  const token = useAuthStore((state) => state.token);

  return useQuery<ProjectRead, ApiError>({
    queryKey: projectQueryKey(projectId ?? ''),
    queryFn: () => getProject(projectId as string),
    enabled: Boolean(projectId && token),
    staleTime: 30 * 1000,
  });
}
