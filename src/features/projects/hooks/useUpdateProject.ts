import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateProject } from '@/features/projects/api';
import type { ProjectRead, ProjectUpdate } from '@/features/projects/types';
import type { ApiError } from '@/lib/api';

interface UpdateVariables {
  projectId: string;
  payload: ProjectUpdate;
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<ProjectRead, ApiError, UpdateVariables>({
    mutationFn: ({ projectId, payload }) => updateProject(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', 'list'] });
    },
  });
}
