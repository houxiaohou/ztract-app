import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  countStaleDocuments,
  deleteDocument,
  rerunDocument,
  rerunStaleDocuments,
} from '@/features/documents/api';
import { quotaQueryKey } from '@/features/billing';
import type { ApiError } from '@/lib/api';
import type {
  DocumentRead,
  RerunStaleResponse,
  StaleDocumentsCount,
} from '@/features/documents/types';

export const staleDocumentsCountQueryKey = (projectId: string) =>
  ['documents', 'stale-count', projectId] as const;

export function useRerunDocument(projectId: string) {
  const { t } = useTranslation('documents');
  const queryClient = useQueryClient();

  return useMutation<DocumentRead, ApiError, string>({
    mutationFn: (documentId) => rerunDocument(projectId, documentId),
    onSuccess: (doc) => {
      toast.success(t('rerun_queued'));
      queryClient.setQueryData(
        ['documents', 'detail', projectId, doc.id],
        doc,
      );
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'list', projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'extractions', projectId, doc.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'extraction', projectId, doc.id],
      });
      void queryClient.invalidateQueries({ queryKey: quotaQueryKey });
    },
    onError: (error) => {
      if (error.code === 'DOCUMENT_IN_FLIGHT' || error.status === 409) {
        toast.error(t('rerun_in_flight'));
        return;
      }
      toast.error(error.message || t('rerun_failed'));
    },
  });
}

export function useStaleDocumentsCount(projectId: string, enabled: boolean) {
  return useQuery<StaleDocumentsCount, ApiError>({
    queryKey: staleDocumentsCountQueryKey(projectId),
    queryFn: () => countStaleDocuments(projectId),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useRerunStaleDocuments(projectId: string) {
  const { t } = useTranslation('documents');
  const queryClient = useQueryClient();

  return useMutation<RerunStaleResponse, ApiError, void>({
    mutationFn: () => rerunStaleDocuments(projectId),
    onSuccess: (result) => {
      if (result.queued > 0) {
        toast.success(
          t('rerun_stale_queued', { count: result.queued }),
          result.skipped_in_flight > 0
            ? {
                description: t('rerun_stale_skipped', {
                  count: result.skipped_in_flight,
                }),
              }
            : undefined,
        );
      } else if (result.skipped_in_flight > 0) {
        toast.info(
          t('rerun_stale_skipped', { count: result.skipped_in_flight }),
        );
      } else {
        toast.success(t('rerun_stale_none'));
      }
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'list', projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: staleDocumentsCountQueryKey(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: quotaQueryKey });
    },
    onError: (error) => {
      toast.error(error.message || t('rerun_stale_failed'));
    },
  });
}

export function useDeleteDocument(projectId: string) {
  const { t } = useTranslation('documents');
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (documentId) => deleteDocument(projectId, documentId),
    onSuccess: (_, documentId) => {
      toast.success(t('delete_success'));
      queryClient.removeQueries({
        queryKey: ['documents', 'detail', projectId, documentId],
      });
      queryClient.removeQueries({
        queryKey: ['documents', 'extraction', projectId, documentId],
      });
      queryClient.removeQueries({
        queryKey: ['documents', 'extractions', projectId, documentId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['documents', 'list', projectId],
      });
      void queryClient.invalidateQueries({ queryKey: quotaQueryKey });
    },
    onError: (error) => {
      toast.error(error.message || t('delete_failed'));
    },
  });
}
