import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type {
  DocumentExtractionRead,
  ExtractionStatus,
} from '@/features/documents/types';

interface ExtractionPageListProps {
  items: DocumentExtractionRead[];
  activeId: string | null;
  staleProjectSchemaVersion: number | null | undefined;
  onSelect: (id: string) => void;
}

const STATUS_ICONS: Record<ExtractionStatus, ReactNode> = {
  pending: <CircleDashedIcon className="size-3.5" aria-hidden />,
  processing: <Loader2Icon className="size-3.5 animate-spin" aria-hidden />,
  success: <CheckCircle2Icon className="size-3.5 text-emerald-600" aria-hidden />,
  failed: <XCircleIcon className="size-3.5 text-destructive" aria-hidden />,
};

function isStale(
  schemaVersion: number | null,
  projectVersion: number | null | undefined,
): boolean {
  if (schemaVersion == null) return true;
  if (projectVersion == null) return false;
  return schemaVersion < projectVersion;
}

export function ExtractionPageList({
  items,
  activeId,
  staleProjectSchemaVersion,
  onSelect,
}: ExtractionPageListProps) {
  const { t } = useTranslation('documents');
  const sorted = [...items].sort((a, b) => {
    const an = a.page_number ?? 0;
    const bn = b.page_number ?? 0;
    return an - bn;
  });

  return (
    <ul className="flex flex-col gap-1 p-2">
      {sorted.map((item) => {
        const active = item.id === activeId;
        const stale =
          (item.status === 'success' || item.status === 'failed') &&
          isStale(item.schema_version, staleProjectSchemaVersion);
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors',
                active
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <span className="inline-flex size-5 shrink-0 items-center justify-center">
                {STATUS_ICONS[item.status]}
              </span>
              <span className="flex-1 truncate tabular-nums">
                {t('extraction_page_label', {
                  page: item.page_number ?? 1,
                })}
              </span>
              {stale ? (
                <AlertTriangleIcon
                  className="size-3 shrink-0 text-amber-600"
                  aria-hidden
                />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
