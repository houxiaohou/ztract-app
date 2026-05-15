import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  createExportJob,
  deleteExportJob,
  getExportDownloadUrl,
} from '@/features/parsed-data/api';
import type {
  ExportJobCreate,
  ExportJobRead,
} from '@/features/parsed-data/types';
import type { ApiError } from '@/lib/api';

export function useCreateExportJob(projectId: string) {
  const { t } = useTranslation('parsed-data');
  const queryClient = useQueryClient();

  return useMutation<ExportJobRead, ApiError, ExportJobCreate>({
    mutationFn: (payload) => createExportJob(projectId, payload),
    onSuccess: () => {
      toast.success(t('export_toast_queued'));
      void queryClient.invalidateQueries({
        queryKey: ['parsed-data', 'exports', projectId],
      });
    },
    onError: (error) => {
      if (error.code === 'EXPORT_JOB_LIMIT_EXCEEDED' || error.status === 409) {
        toast.error(t('export_toast_limit'));
        return;
      }
      toast.error(error.message || t('export_toast_failed'));
    },
  });
}

export function useDeleteExportJob(projectId: string) {
  const { t } = useTranslation('parsed-data');
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (jobId) => deleteExportJob(projectId, jobId),
    onSuccess: () => {
      toast.success(t('export_delete_success'));
      void queryClient.invalidateQueries({
        queryKey: ['parsed-data', 'exports', projectId],
      });
    },
    onError: (error) => {
      toast.error(error.message || t('export_delete_failed'));
    },
  });
}

export function useDownloadExport(projectId: string) {
  const { t } = useTranslation('parsed-data');

  return useMutation<string, ApiError, string>({
    mutationFn: (jobId) => getExportDownloadUrl(projectId, jobId),
    onSuccess: (url) => {
      window.location.assign(url);
    },
    onError: (error) => {
      toast.error(error.message || t('export_download_failed'));
    },
  });
}
