import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileTextIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ExtractionMode } from '@/features/documents/types';

interface SampleModeDialogProps {
  open: boolean;
  fileName: string;
  pageCount: number;
  onCancel: () => void;
  onConfirm: (mode: ExtractionMode, pageNumber: number | null) => void;
}

export function SampleModeDialog({
  open,
  fileName,
  pageCount,
  onCancel,
  onConfirm,
}: SampleModeDialogProps) {
  const { t } = useTranslation('schemas');
  const [mode, setMode] = useState<ExtractionMode>('document');
  const [pageNumber, setPageNumber] = useState(1);
  const [lastOpen, setLastOpen] = useState(open);

  if (open && !lastOpen) {
    setLastOpen(true);
    setMode('document');
    setPageNumber(1);
  } else if (!open && lastOpen) {
    setLastOpen(false);
  }

  const handleConfirm = () => {
    if (mode === 'per_page') {
      const clamped = Math.min(Math.max(1, pageNumber), pageCount);
      onConfirm('per_page', clamped);
    } else {
      onConfirm('document', null);
    }
  };

  const handlePageNumberChange = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setPageNumber(1);
      return;
    }
    setPageNumber(Math.min(Math.max(1, parsed), pageCount));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('sample_mode_title')}</DialogTitle>
          <DialogDescription>{t('sample_mode_description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            <FileTextIcon className="size-4 text-muted-foreground" aria-hidden />
            <span className="truncate" title={fileName}>
              {fileName}
            </span>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
              {t('sample_mode_pages', { count: pageCount })}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('sample_mode_label')}
            </Label>
            <ModeTile
              active={mode === 'document'}
              title={t('sample_mode_document_title')}
              body={t('sample_mode_document_body')}
              onClick={() => setMode('document')}
            />
            <ModeTile
              active={mode === 'per_page'}
              title={t('sample_mode_per_page_title')}
              body={t('sample_mode_per_page_body')}
              onClick={() => setMode('per_page')}
            />
          </div>

          {mode === 'per_page' ? (
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="sample-page-number"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {t('sample_mode_page_label')}
              </Label>
              <Input
                id="sample-page-number"
                type="number"
                min={1}
                max={pageCount}
                value={pageNumber}
                onChange={(event) => handlePageNumberChange(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t('sample_mode_page_help', { total: pageCount })}
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="cursor-pointer"
          >
            {t('dialog_cancel')}
          </Button>
          <Button type="button" onClick={handleConfirm} className="cursor-pointer">
            {t('sample_mode_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ModeTileProps {
  active: boolean;
  title: string;
  body: string;
  onClick: () => void;
}

function ModeTile({ active, title, body, onClick }: ModeTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left transition-colors',
        active
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40',
      )}
    >
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{body}</span>
    </button>
  );
}
