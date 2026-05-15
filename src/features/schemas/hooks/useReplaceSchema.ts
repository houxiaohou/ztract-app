import { useMutation, useQueryClient } from '@tanstack/react-query';

import { replaceSchema } from '@/features/schemas/api';
import { schemaQueryKey } from '@/features/schemas/hooks/useSchema';
import { projectQueryKey } from '@/features/projects/hooks/useProject';
import type {
  SchemaRead,
  SchemaReplaceRequest,
} from '@/features/schemas/types';
import type { ApiError } from '@/lib/api';

interface Variables {
  projectId: string;
  payload: SchemaReplaceRequest;
}

export function useReplaceSchema() {
  const queryClient = useQueryClient();

  return useMutation<SchemaRead, ApiError, Variables>({
    mutationFn: ({ projectId, payload }) => replaceSchema(projectId, payload),
    onSuccess: (data, { projectId }) => {
      queryClient.setQueryData(schemaQueryKey(projectId), data);
      // Project.schema_version is bumped server-side; invalidate the project
      // so dependent UI (e.g. stale-document badges on the Documents tab)
      // compares against the fresh version.
      void queryClient.invalidateQueries({
        queryKey: projectQueryKey(projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'list', projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'stale-count', projectId],
      });
      // Switching extraction_mode rebuilds extraction rows server-side, so
      // cached results for every document in this project are out of date.
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'extractions', projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'extraction', projectId],
      });
    },
  });
}
