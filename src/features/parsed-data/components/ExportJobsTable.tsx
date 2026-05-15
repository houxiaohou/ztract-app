import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadIcon, Loader2Icon, Trash2Icon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/date';
import { intlLocale } from '@/features/billing/utils';
import { ExportStatusBadge } from '@/features/parsed-data/components/ExportStatusBadge';
import {
  useDeleteExportJob,
  useDownloadExport,
} from '@/features/parsed-data/hooks/useExportActions';
import type { ExportJobRead } from '@/features/parsed-data/types';

interface ExportJobsTableProps {
  projectId: string;
  items: ExportJobRead[];
}

function snapshotRangeLabel(
  snapshot: Record<string, unknown> | null,
  fallback: string,
): string {
  if (!snapshot) return fallback;
  const from = typeof snapshot.parsed_from === 'string' ? snapshot.parsed_from : null;
  const to = typeof snapshot.parsed_to === 'string' ? snapshot.parsed_to : null;
  if (from && to) return `${from} – ${to}`;
  if (from) return `≥ ${from}`;
  if (to) return `≤ ${to}`;
  return fallback;
}

export function ExportJobsTable({ projectId, items }: ExportJobsTableProps) {
  const { t, i18n } = useTranslation('parsed-data');
  const locale = intlLocale(i18n.language);

  const [deleteTarget, setDeleteTarget] = useState<ExportJobRead | null>(null);
  const deleteMutation = useDeleteExportJob(projectId);
  const downloadMutation = useDownloadExport(projectId);

  const deletingId =
    deleteMutation.isPending && typeof deleteMutation.variables === 'string'
      ? deleteMutation.variables
      : null;
  const downloadingId =
    downloadMutation.isPending &&
    typeof downloadMutation.variables === 'string'
      ? downloadMutation.variables
      : null;

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48 text-xs">
                {t('exports_col_created')}
              </TableHead>
              <TableHead className="w-24 text-xs">
                {t('exports_col_format')}
              </TableHead>
              <TableHead className="w-32 text-xs">
                {t('exports_col_status')}
              </TableHead>
              <TableHead className="w-24 text-right text-xs">
                {t('exports_col_rows')}
              </TableHead>
              <TableHead className="text-xs">
                {t('exports_col_range')}
              </TableHead>
              <TableHead className="w-32 text-right text-xs">
                <span className="sr-only">{t('exports_col_actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((job) => {
              const isDeleting = deletingId === job.id;
              const isDownloading = downloadingId === job.id;
              return (
                <TableRow
                  key={job.id}
                  className={isDeleting ? 'pointer-events-none opacity-50' : undefined}
                >
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {formatDateTime(job.created_at, locale)}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs font-medium uppercase text-foreground">
                    {job.format}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <ExportStatusBadge status={job.status} />
                      {job.status === 'failed' && job.error_message ? (
                        <span
                          className="truncate text-[11px] text-destructive"
                          title={job.error_message}
                        >
                          {job.error_message}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-xs tabular-nums">
                    {job.row_count != null
                      ? job.row_count.toLocaleString(locale)
                      : '—'}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {snapshotRangeLabel(job.filter_snapshot, t('export_row_range_all'))}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={job.status !== 'success' || isDownloading}
                        onClick={() => downloadMutation.mutate(job.id)}
                        className="cursor-pointer gap-1.5"
                      >
                        {isDownloading ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <DownloadIcon className="size-4" />
                        )}
                        {t('export_download')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer text-destructive hover:text-destructive"
                        aria-label={t('export_delete')}
                        onClick={() => setDeleteTarget(job)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('export_delete_confirm_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('export_delete_confirm_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('export_delete_confirm_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDeleteConfirm();
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              {t('export_delete_confirm_cta')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
