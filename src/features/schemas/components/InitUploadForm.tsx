import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FileTextIcon, Loader2Icon, UploadCloudIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { putToR2 } from '@/features/documents/api';
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILE_SIZE_BYTES,
  formatBytes,
  isAcceptedFile,
  isImageFile,
  validateImageDimensions,
} from '@/features/documents/constants';
import { estimatePageCount } from '@/features/documents/pageCount';
import type { ExtractionMode } from '@/features/documents/types';
import {
  generateSchemaFromSample,
  presignSampleUpload,
} from '@/features/schemas/api';
import { SampleModeDialog } from '@/features/schemas/components/SampleModeDialog';
import { StepHeader } from '@/features/schemas/components/InitTemplatePicker';
import type { SchemaFieldDef } from '@/features/schemas/types';

interface InitUploadFormProps {
  projectId: string;
  onGenerated: (fields: SchemaFieldDef[], mode: ExtractionMode) => void;
  onBack: () => void;
}

type Phase = 'idle' | 'uploading' | 'analysing';

interface PendingPick {
  file: File;
  pageCount: number;
}

function isPdf(file: File): boolean {
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
}

export function InitUploadForm({ projectId, onGenerated, onBack }: InitUploadFormProps) {
  const { t } = useTranslation('schemas');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [pendingPick, setPendingPick] = useState<PendingPick | null>(null);

  const runSample = async (
    file: File,
    mode: ExtractionMode,
    pageNumber: number | null,
  ) => {
    setCurrentFile(file);
    try {
      setPhase('uploading');
      setProgress(0);
      const presign = await presignSampleUpload(projectId, {
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
      });
      await putToR2(presign.upload_url, file, {
        onProgress: (loaded, total) => {
          const value = total > 0 ? Math.round((loaded / total) * 100) : 0;
          setProgress(value);
        },
      });

      setPhase('analysing');
      const draft = await generateSchemaFromSample(projectId, {
        r2_key: presign.r2_key,
        mime_type: file.type || 'application/octet-stream',
        extraction_mode: mode,
        page_number: mode === 'per_page' ? pageNumber : null,
      });
      onGenerated(draft.fields, draft.chosen_extraction_mode ?? mode);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || t('init_upload_generate_failed'));
      setPhase('idle');
      setProgress(0);
      setCurrentFile(null);
    }
  };

  const run = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(t('upload_error_too_large', { name: file.name, ns: 'documents' }));
      return;
    }
    if (!isAcceptedFile(file)) {
      toast.error(t('upload_error_wrong_type', { name: file.name, ns: 'documents' }));
      return;
    }
    if (isImageFile(file)) {
      const { valid } = await validateImageDimensions(file);
      if (!valid) {
        toast.error(
          t('upload_error_image_dimensions', { name: file.name, ns: 'documents' }),
        );
        return;
      }
    }

    // For multi-page PDFs, ask the user whether to OCR the whole document or
    // a specific page before kicking off the upload. Single-page files
    // (or non-PDFs) default to whole-document mode.
    if (isPdf(file)) {
      const pages = await estimatePageCount(file).catch(() => null);
      if (pages && pages > 1) {
        setPendingPick({ file, pageCount: pages });
        return;
      }
    }
    void runSample(file, 'document', null);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void run(file);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void run(file);
  };

  const busy = phase !== 'idle';
  const phaseLabel = (() => {
    switch (phase) {
      case 'uploading':
        return `${t('init_upload_step_uploading')} ${progress}%`;
      case 'analysing':
        return t('init_upload_step_analysing');
      default:
        return '';
    }
  })();

  return (
    <div className="flex flex-col gap-5">
      <StepHeader
        title={t('init_upload_title')}
        subtitle={t('init_upload_subtitle')}
        onBack={onBack}
      />

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!busy) setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) event.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors',
          dragActive && !busy && 'border-primary bg-primary/5',
          busy && 'opacity-80',
        )}
      >
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground',
            dragActive && !busy && 'text-primary',
          )}
        >
          {busy ? (
            <Loader2Icon className="size-5 animate-spin" aria-hidden />
          ) : (
            <UploadCloudIcon className="size-5" aria-hidden />
          )}
        </div>
        {busy && currentFile ? (
          <div className="flex flex-col items-center gap-1">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <FileTextIcon className="size-4" aria-hidden />
              <span className="max-w-[20rem] truncate" title={currentFile.name}>
                {currentFile.name}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatBytes(currentFile.size)} · {phaseLabel}
            </div>
            {phase === 'uploading' ? (
              <div className="mt-1 h-1 w-48 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t('uploader_drag_or', { ns: 'documents' })}{' '}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
                onClick={() => inputRef.current?.click()}
              >
                {t('uploader_browse', { ns: 'documents' })}
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              {t('uploader_hint', { ns: 'documents' })}
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
          disabled={busy}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onBack} disabled={busy}>
          {t('init_back')}
        </Button>
      </div>

      <SampleModeDialog
        open={pendingPick !== null}
        fileName={pendingPick?.file.name ?? ''}
        pageCount={pendingPick?.pageCount ?? 1}
        onCancel={() => setPendingPick(null)}
        onConfirm={(mode, pageNumber) => {
          const pick = pendingPick;
          setPendingPick(null);
          if (pick) void runSample(pick.file, mode, pageNumber);
        }}
      />
    </div>
  );
}
