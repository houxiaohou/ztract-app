import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2Icon, RefreshCcwIcon } from 'lucide-react';

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
import { intlLocale } from '@/features/billing/utils';
import {
  useRerunStaleDocuments,
  useStaleDocumentsCount,
} from '@/features/documents/hooks/useDocumentActions';

interface RerunStaleButtonProps {
  projectId: string;
  hasSchema: boolean;
}

export function RerunStaleButton({ projectId, hasSchema }: RerunStaleButtonProps) {
  const { t, i18n } = useTranslation('documents');
  const locale = intlLocale(i18n.language);

  const countQuery = useStaleDocumentsCount(projectId, hasSchema);
  const rerunMutation = useRerunStaleDocuments(projectId);
  const [open, setOpen] = useState(false);

  if (!hasSchema) return null;
  const count = countQuery.data?.stale_documents ?? 0;
  if (count === 0) return null;

  const estimated = countQuery.data?.estimated_pages ?? 0;
  const formattedCount = count.toLocaleString(locale);
  const formattedPages = estimated.toLocaleString(locale);

  const handleConfirm = () => {
    rerunMutation.mutate(undefined, {
      onSettled: () => setOpen(false),
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="cursor-pointer gap-1.5 border-amber-500/40 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 hover:text-amber-700"
        onClick={() => setOpen(true)}
      >
        <RefreshCcwIcon className="size-3.5" />
        {t('rerun_stale_button', { count })}
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!next && rerunMutation.isPending) return;
          setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rerun_stale_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {estimated > 0
                ? t('rerun_stale_confirm_description', {
                    count,
                    countLabel: formattedCount,
                    pages: formattedPages,
                  })
                : t('rerun_stale_confirm_description_no_estimate', {
                    count,
                    countLabel: formattedCount,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rerunMutation.isPending}>
              {t('rerun_stale_confirm_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={rerunMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
            >
              {rerunMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              {t('rerun_stale_confirm_cta')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
