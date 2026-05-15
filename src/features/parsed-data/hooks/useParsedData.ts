import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listParsedData } from '@/features/parsed-data/api';
import { useAuthStore } from '@/features/auth/store';
import type {
  PaginatedParsedData,
  ParsedDataListParams,
} from '@/features/parsed-data/types';
import type { ApiError } from '@/lib/api';

export const parsedDataQueryKey = (
  projectId: string,
  params: ParsedDataListParams,
) =>
  [
    'parsed-data',
    'list',
    projectId,
    {
      page: params.page,
      size: params.size,
      parsed_from: params.parsed_from ?? null,
      parsed_to: params.parsed_to ?? null,
    },
  ] as const;

export function useParsedData(
  projectId: string | undefined,
  params: ParsedDataListParams,
) {
  const token = useAuthStore((state) => state.token);

  return useQuery<PaginatedParsedData, ApiError>({
    queryKey: parsedDataQueryKey(projectId ?? '', params),
    queryFn: () => listParsedData(projectId as string, params),
    enabled: Boolean(projectId && token),
    staleTime: 10 * 1000,
    placeholderData: keepPreviousData,
  });
}
