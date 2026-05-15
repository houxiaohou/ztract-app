import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createProject } from '@/features/projects/api';
import type { ProjectCreate, ProjectRead } from '@/features/projects/types';
import type { ApiError } from '@/lib/api';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<ProjectRead, ApiError, ProjectCreate>({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', 'list'] });
    },
  });
}
