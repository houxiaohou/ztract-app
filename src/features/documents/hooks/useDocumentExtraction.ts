import { useQuery, type Query } from '@tanstack/react-query';

import {
  getDocumentExtractionById,
  listDocumentExtractions,
} from '@/features/documents/api';
import { useAuthStore } from '@/features/auth/store';
import type {
  DocumentExtractionRead,
  PaginatedDocumentExtractions,
} from '@/features/documents/types';
import type { ApiError } from '@/lib/api';

export const documentExtractionsListQueryKey = (
  projectId: string,
  documentId: string,
) => ['documents', 'extractions', projectId, documentId] as const;

export const documentExtractionQueryKey = (
  projectId: string,
  documentId: string,
  extractionId: string,
) =>
  [
    'documents',
    'extraction',
    projectId,
    documentId,
    extractionId,
  ] as const;

export function useDocumentExtractions(
  projectId: string | undefined,
  documentId: string | undefined,
) {
  const token = useAuthStore((state) => state.token);

  return useQuery<PaginatedDocumentExtractions, ApiError>({
    queryKey: documentExtractionsListQueryKey(
      projectId ?? '',
      documentId ?? '',
    ),
    queryFn: () =>
      listDocumentExtractions(projectId as string, documentId as string, {
        page: 1,
        size: 200,
      }),
    enabled: Boolean(projectId && documentId && token),
    staleTime: 10 * 1000,
    refetchInterval: (
      query: Query<PaginatedDocumentExtractions, ApiError>,
    ) => {
      const data = query.state.data;
      if (!data) return false;
      const hasInflight = data.items.some(
        (item) => item.status === 'pending' || item.status === 'processing',
      );
      return hasInflight ? 5_000 : false;
    },
  });
}

export function useDocumentExtraction(
  projectId: string | undefined,
  documentId: string | undefined,
  extractionId: string | undefined | null,
) {
  const token = useAuthStore((state) => state.token);

  return useQuery<DocumentExtractionRead, ApiError>({
    queryKey: documentExtractionQueryKey(
      projectId ?? '',
      documentId ?? '',
      extractionId ?? '',
    ),
    queryFn: () =>
      getDocumentExtractionById(
        projectId as string,
        documentId as string,
        extractionId as string,
      ),
    enabled: Boolean(projectId && documentId && extractionId && token),
    staleTime: 30 * 1000,
  });
}
