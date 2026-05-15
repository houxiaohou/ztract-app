import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadIcon, Loader2Icon } from 'lucide-react';

import { DateRangePicker } from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useCreateExportJob } from '@/features/parsed-data/hooks/useExportActions';
import type {
  ExportFormat,
  ExportJobCreate,
} from '@/features/parsed-data/types';

interface ExportDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFrom?: string | null;
  initialTo?: string | null;
}

const FORMATS: { value: ExportFormat; labelKey: string }[] = [
  { value: 'xlsx', labelKey: 'export_format_xlsx' },
  { value: 'csv', labelKey: 'export_format_csv' },
  { value: 'json', labelKey: 'export_format_json' },
];

export function ExportDialog({
  projectId,
  open,
  onOpenChange,
  initialFrom,
  initialTo,
}: ExportDialogProps) {
  const { t } = useTranslation('parsed-data');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateExportJob(projectId);
  const [lastOpen, setLastOpen] = useState(open);

  if (open && !lastOpen) {
    setLastOpen(true);
    setFormat('xlsx');
    setFrom(initialFrom ?? '');
    setTo(initialTo ?? '');
    setError(null);
  } else if (!open && lastOpen) {
    setLastOpen(false);
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (from && to && from > to) {
      setError(t('filter_date_invalid'));
      return;
    }
    const payload: ExportJobCreate = { format };
    if (from || to) {
      payload.filter = {
        parsed_from: from || null,
        parsed_to: to || null,
      };
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && createMutation.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('export_dialog_title')}</DialogTitle>
          <DialogDescription>
            {t('export_dialog_description')}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('export_format_label')}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                    format === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-muted/50',
                  )}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('export_filter_label')}
            </Label>
            <DateRangePicker
              value={{ from: from || null, to: to || null }}
              onChange={(next) => {
                setFrom(next.from ?? '');
                setTo(next.to ?? '');
                setError(null);
              }}
              applyLabel={t('filter_apply')}
              clearLabel={t('filter_clear')}
              placeholder={t('filter_date_all')}
              summary={
                from && to
                  ? t('filter_date_range', { from, to })
                  : from
                    ? t('filter_date_from_only', { from })
                    : to
                      ? t('filter_date_to_only', { to })
                      : t('filter_date_all')
              }
              fullWidth
              disableFuture
            />
            <p className="text-xs text-muted-foreground">
              {t('export_filter_help')}
            </p>
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className="cursor-pointer"
            >
              {t('export_cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="cursor-pointer gap-1.5"
            >
              {createMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <DownloadIcon className="size-4" />
              )}
              {t('export_confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
