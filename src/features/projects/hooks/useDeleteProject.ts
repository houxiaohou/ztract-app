import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteProject } from '@/features/projects/api';
import type { ApiError } from '@/lib/api';

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (projectId) => deleteProject(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', 'list'] });
    },
  });
}
