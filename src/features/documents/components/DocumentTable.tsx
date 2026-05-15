import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EllipsisVerticalIcon,
  Loader2Icon,
  RefreshCcwIcon,
  Trash2Icon,
} from 'lucide-react';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { DocumentStatusBadge } from '@/features/documents/components/DocumentStatusBadge';
import {
  useDeleteDocument,
  useRerunDocument,
} from '@/features/documents/hooks/useDocumentActions';
import type { DocumentRead } from '@/features/documents/types';

interface DocumentTableProps {
  projectId: string;
  items: DocumentRead[];
  onOpenDetail: (documentId: string) => void;
}

export function DocumentTable({
  projectId,
  items,
  onOpenDetail,
}: DocumentTableProps) {
  const { t, i18n } = useTranslation('documents');
  const locale = intlLocale(i18n.language);

  const [rerunTarget, setRerunTarget] = useState<DocumentRead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRead | null>(null);

  const rerunMutation = useRerunDocument(projectId);
  const deleteMutation = useDeleteDocument(projectId);

  const handleRerunConfirm = () => {
    if (!rerunTarget) return;
    rerunMutation.mutate(rerunTarget.id, {
      onSettled: () => setRerunTarget(null),
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  };

  const deletingId =
    deleteMutation.isPending && typeof deleteMutation.variables === 'string'
      ? deleteMutation.variables
      : null;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28 text-xs">
                {t('table_col_status')}
              </TableHead>
              <TableHead className="text-xs">{t('table_col_file')}</TableHead>
              <TableHead className="w-36 text-xs">
                {t('table_col_progress')}
              </TableHead>
              <TableHead className="w-44 text-xs">
                {t('table_col_uploaded_at')}
              </TableHead>
              <TableHead className="w-44 text-xs">
                {t('table_col_parsed_at')}
              </TableHead>
              <TableHead className="w-20 text-right text-xs">
                {t('table_col_pages')}
              </TableHead>
              <TableHead className="w-12 text-right text-xs">
                <span className="sr-only">{t('table_col_actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((doc) => {
              const canRerun =
                doc.status === 'success' ||
                doc.status === 'failed' ||
                doc.status === 'partial';
              const uploadedAt = formatDateTime(doc.created_at, locale);
              const isTerminal =
                doc.status === 'success' ||
                doc.status === 'failed' ||
                doc.status === 'partial';
              const parsedAt = isTerminal
                ? formatDateTime(doc.updated_at, locale)
                : null;
              const pages =
                doc.page_count != null
                  ? doc.page_count.toLocaleString(locale)
                  : t('not_available');

              const summary = doc.extractions_summary;
              const isDeleting = deletingId === doc.id;
              return (
                <TableRow
                  key={doc.id}
                  className={isDeleting ? 'opacity-50 pointer-events-none' : undefined}
                >
                  <TableCell className="py-2.5">
                    <DocumentStatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="max-w-[24rem] py-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(doc.id)}
                      className="min-w-0 truncate text-left text-sm cursor-pointer text-foreground hover:text-primary hover:underline focus-visible:text-primary focus-visible:underline focus-visible:outline-none"
                      title={doc.file_name}
                    >
                      {doc.file_name}
                    </button>
                  </TableCell>
                  <TableCell className="py-2.5 text-[11px] text-muted-foreground tabular-nums">
                    {summary && summary.total > 0 ? (
                      <ProgressSummary summary={summary} locale={locale ?? 'en'} />
                    ) : (
                      t('not_available')
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {uploadedAt}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {parsedAt ?? t('not_available')}
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-xs tabular-nums">
                    {pages}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 cursor-pointer"
                          aria-label={t('action_open_menu')}
                        >
                          <EllipsisVerticalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          disabled={!canRerun}
                          onSelect={(event) => {
                            event.preventDefault();
                            setRerunTarget(doc);
                          }}
                        >
                          <RefreshCcwIcon className="size-4" />
                          {t('action_rerun')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={(event) => {
                            event.preventDefault();
                            setDeleteTarget(doc);
                          }}
                        >
                          <Trash2Icon className="size-4" />
                          {t('action_delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={rerunTarget !== null}
        onOpenChange={(open) => {
          if (!open && !rerunMutation.isPending) setRerunTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rerun_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('rerun_confirm_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rerunMutation.isPending}>
              {t('rerun_confirm_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={rerunMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleRerunConfirm();
              }}
            >
              {rerunMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              {t('rerun_confirm_cta')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_confirm_description', {
                name: deleteTarget?.file_name ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('delete_confirm_cancel')}
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
              {t('delete_confirm_cta')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ProgressSummaryProps {
  summary: { pending: number; processing: number; success: number; failed: number; total: number };
  locale: string;
}

function ProgressSummary({ summary, locale }: ProgressSummaryProps) {
  const { t } = useTranslation('documents');
  const parts: string[] = [];
  if (summary.success > 0) {
    parts.push(
      t('progress_success', {
        count: summary.success,
        total: summary.total.toLocaleString(locale),
      }),
    );
  }
  if (summary.failed > 0) {
    parts.push(t('progress_failed', { count: summary.failed }));
  }
  if (summary.pending + summary.processing > 0) {
    parts.push(
      t('progress_in_flight', {
        count: summary.pending + summary.processing,
      }),
    );
  }
  return (
    <span title={parts.join(' · ')}>
      {parts.length > 0
        ? parts.join(' · ')
        : t('progress_total', { count: summary.total })}
    </span>
  );
}
