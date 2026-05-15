import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { fetchDocumentPageImage } from '@/features/documents/api';
import type { ExtractionPage } from '@/features/documents/types';

interface DocumentThumbnailsProps {
  projectId: string;
  documentId: string;
  pages: ExtractionPage[];
  currentPage: number;
  onJumpTo: (page: number) => void;
}

export function DocumentThumbnails({
  projectId,
  documentId,
  pages,
  currentPage,
  onJumpTo,
}: DocumentThumbnailsProps) {
  return (
    <ul className="flex flex-col gap-2 p-2">
      {pages.map((page) => (
        <li key={page.page_number}>
          <ThumbnailItem
            projectId={projectId}
            documentId={documentId}
            page={page}
            active={page.page_number === currentPage}
            onClick={() => onJumpTo(page.page_number)}
          />
        </li>
      ))}
    </ul>
  );
}

interface ThumbnailItemProps {
  projectId: string;
  documentId: string;
  page: ExtractionPage;
  active: boolean;
  onClick: () => void;
}

function ThumbnailItem({
  projectId,
  documentId,
  page,
  active,
  onClick,
}: ThumbnailItemProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;
    let cancelled = false;

    fetchDocumentPageImage(projectId, documentId, page.page_number, controller.signal)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        /* ignore — thumbnail just stays empty */
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [projectId, documentId, page.page_number]);

  const ratio = page.height > 0 ? page.width / page.height : 1;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Go to page ${page.page_number}`}
      className={cn(
        'group flex w-full flex-col items-center gap-1 rounded-md p-1.5 text-xs text-muted-foreground transition-colors',
        active ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
      )}
    >
      <div
        className={cn(
          'w-full overflow-hidden rounded border border-border bg-muted',
          active && 'border-primary ring-1 ring-primary',
        )}
        style={{ aspectRatio: ratio || 0.7 }}
      >
        {blobUrl ? (
          <img
            src={blobUrl}
            alt=""
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : null}
      </div>
      <span className={cn('tabular-nums', active && 'font-semibold')}>
        {page.page_number}
      </span>
    </button>
  );
}
