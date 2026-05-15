import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2Icon,
  Loader2Icon,
  RotateCcwIcon,
  UploadCloudIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { quotaQueryKey } from '@/features/billing';
import {
  presignUpload,
  putToR2,
  registerDocument,
} from '@/features/documents/api';
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILE_SIZE_BYTES,
  formatBytes,
  isAcceptedFile,
  isImageFile,
  validateImageDimensions,
} from '@/features/documents/constants';
import { estimatePageCount } from '@/features/documents/pageCount';
import type {
  DocumentRead,
  ExtractionMode,
} from '@/features/documents/types';

type ItemStatus = 'queued' | 'uploading' | 'registering' | 'done' | 'error';

interface UploadItem {
  id: string;
  file: File;
  status: ItemStatus;
  progress: number;
  error?: string;
  document?: DocumentRead;
}

interface DocumentUploaderProps {
  projectId: string;
  extractionMode: ExtractionMode;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function DocumentUploader({
  projectId,
  extractionMode,
}: DocumentUploaderProps) {
  const { t } = useTranslation('documents');
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const dragCounterRef = useRef(0);

  const patch = (id: string, partial: Partial<UploadItem>) => {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  };

  const invalidateLists = () => {
    void queryClient.invalidateQueries({
      queryKey: ['documents', 'list', projectId],
    });
    void queryClient.invalidateQueries({ queryKey: quotaQueryKey });
  };

  const uploadOne = async (item: UploadItem, prefetchedPageCount?: number | null) => {
    try {
      patch(item.id, { status: 'uploading', progress: 0, error: undefined });
      const presign = await presignUpload(projectId, {
        file_name: item.file.name,
        mime_type: item.file.type || 'application/octet-stream',
        size_bytes: item.file.size,
      });

      // If we already estimated the page count during validation (required
      // for per_page mode), reuse it. Otherwise estimate lazily — best effort.
      const pageCountPromise =
        prefetchedPageCount != null
          ? Promise.resolve(prefetchedPageCount)
          : estimatePageCount(item.file).catch(() => null);

      await putToR2(presign.upload_url, item.file, {
        onProgress: (loaded, total) => {
          const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
          patch(item.id, { progress });
        },
      });

      patch(item.id, { status: 'registering', progress: 100 });
      const pageCount = await pageCountPromise;
      const doc = await registerDocument(projectId, {
        r2_key: presign.r2_key,
        file_name: item.file.name,
        mime_type: item.file.type || 'application/octet-stream',
        size_bytes: item.file.size,
        ...(pageCount && pageCount > 0 ? { page_count: pageCount } : {}),
      });

      patch(item.id, { status: 'done', document: doc });
      invalidateLists();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      patch(item.id, { status: 'error', error: message });
    }
  };

  const addFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const accepted: { item: UploadItem; pageCount: number | null }[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(t('upload_error_too_large', { name: file.name }));
        continue;
      }
      if (!isAcceptedFile(file)) {
        toast.error(t('upload_error_wrong_type', { name: file.name }));
        continue;
      }
      if (isImageFile(file)) {
        const { valid } = await validateImageDimensions(file);
        if (!valid) {
          toast.error(t('upload_error_image_dimensions', { name: file.name }));
          continue;
        }
      }

      // per_page mode requires a known page_count — the backend rejects
      // registration without it. Estimate up front and refuse the file if
      // we can't compute a count locally (CSV/TXT/RTF/OFD/etc).
      let pageCount: number | null = null;
      if (extractionMode === 'per_page') {
        pageCount = await estimatePageCount(file).catch(() => null);
        if (pageCount == null || pageCount < 1) {
          toast.error(
            t('upload_error_per_page_unsupported', { name: file.name }),
          );
          continue;
        }
      }

      accepted.push({
        item: {
          id: newId(),
          file,
          status: 'queued',
          progress: 0,
        },
        pageCount,
      });
    }

    if (accepted.length === 0) return;
    setQueue((q) => [...q, ...accepted.map((entry) => entry.item)]);
    accepted.forEach(({ item, pageCount }) => void uploadOne(item, pageCount));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    void addFiles(event.target.files);
    event.target.value = '';
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragActive(false);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current = 0;
    setDragActive(false);
    if (event.dataTransfer.files?.length) {
      void addFiles(event.dataTransfer.files);
    }
  };

  const retry = (item: UploadItem) => {
    void uploadOne(item);
  };

  const remove = (id: string) => {
    setQueue((q) => q.filter((item) => item.id !== id));
  };

  const clearDone = () => {
    setQueue((q) => q.filter((item) => item.status !== 'done'));
  };

  const doneCount = queue.filter((item) => item.status === 'done').length;

  return (
    <div className="flex flex-col gap-3">
      {extractionMode === 'per_page' ? (
        <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          {t('uploader_per_page_hint')}
        </p>
      ) : null}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors',
          dragActive && 'border-primary bg-primary/5',
        )}
      >
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground',
            dragActive && 'text-primary',
          )}
        >
          <UploadCloudIcon className="size-5" aria-hidden />
        </div>
        {dragActive ? (
          <p className="text-sm font-medium text-primary">{t('uploader_drop_here')}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('uploader_drag_or')}{' '}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
              onClick={() => inputRef.current?.click()}
            >
              {t('uploader_browse')}
            </button>
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t('uploader_hint')}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
        />
      </div>

      {queue.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
          {queue.map((item) => (
            <UploadQueueRow
              key={item.id}
              item={item}
              onRetry={() => retry(item)}
              onRemove={() => remove(item.id)}
            />
          ))}
          {doneCount > 0 ? (
            <div className="flex justify-end pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={clearDone}>
                {t('uploader_clear_done')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface UploadQueueRowProps {
  item: UploadItem;
  onRetry: () => void;
  onRemove: () => void;
}

function UploadQueueRow({ item, onRetry, onRemove }: UploadQueueRowProps) {
  const { t } = useTranslation('documents');

  const statusLabel = (() => {
    switch (item.status) {
      case 'queued':
        return t('upload_queued');
      case 'uploading':
        return `${t('upload_uploading')} · ${item.progress}%`;
      case 'registering':
        return t('upload_registering');
      case 'done':
        return t('upload_done');
      case 'error':
        return item.error || t('upload_failed');
    }
  })();

  const statusIcon = (() => {
    switch (item.status) {
      case 'queued':
      case 'uploading':
      case 'registering':
        return <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />;
      case 'done':
        return <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />;
      case 'error':
        return <XCircleIcon className="size-4 shrink-0 text-destructive" />;
    }
  })();

  return (
    <div className="flex flex-col gap-1.5 rounded-md px-2 py-2 text-sm hover:bg-muted/40">
      <div className="flex items-center gap-3">
        {statusIcon}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground" title={item.file.name}>
            {item.file.name}
          </span>
          <span
            className={cn(
              'truncate text-xs',
              item.status === 'error' ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {formatBytes(item.file.size)} · {statusLabel}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {item.status === 'error' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRetry}
              aria-label={t('upload_retry')}
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={t('upload_remove')}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>
      {item.status === 'uploading' ? (
        <div className="ml-7 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
