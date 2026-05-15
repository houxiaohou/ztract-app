import { useTranslation } from 'react-i18next';
import { ChevronRightIcon } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { SchemaFieldDef } from '@/features/schemas/types';

interface ParsedDataCellProps {
  field: SchemaFieldDef;
  value: unknown;
  pathLabel: string;
}

export function ParsedDataCell({ field, value, pathLabel }: ParsedDataCellProps) {
  const { t } = useTranslation('parsed-data');

  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">{t('cell_empty')}</span>;
  }

  if (field.type === 'array') {
    if (!Array.isArray(value)) {
      return <span className="text-muted-foreground">{t('cell_empty')}</span>;
    }
    if (value.length === 0) {
      return (
        <span className="italic text-muted-foreground">
          {t('cell_array_empty')}
        </span>
      );
    }
    return (
      <PreviewPopover
        label={
          value.length === 1
            ? t('cell_array_badge_one')
            : t('cell_array_badge', { count: value.length })
        }
        title={field.name}
        pathLabel={pathLabel}
        value={value}
      />
    );
  }

  if (field.type === 'object') {
    if (!value || typeof value !== 'object') {
      return <span className="text-muted-foreground">{t('cell_empty')}</span>;
    }
    const keys = Object.keys(value as Record<string, unknown>);
    return (
      <PreviewPopover
        label={
          keys.length === 1
            ? t('cell_object_badge_one')
            : t('cell_object_badge', { count: keys.length })
        }
        title={field.name}
        pathLabel={pathLabel}
        value={value}
      />
    );
  }

  return (
    <span className="block max-w-[20rem] truncate text-foreground" title={formatPrimitive(value)}>
      {formatPrimitive(value)}
    </span>
  );
}

interface PreviewPopoverProps {
  label: string;
  title: string;
  pathLabel: string;
  value: unknown;
}

function PreviewPopover({ label, title, pathLabel, value }: PreviewPopoverProps) {
  const { t } = useTranslation('parsed-data');
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary transition-colors',
            'hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          {label}
          <ChevronRightIcon className="size-3" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[420px] w-96 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
          <span className="font-medium text-foreground">{title}</span>
          <span className="text-muted-foreground">
            {t('cell_popover_path')}: <code>{pathLabel}</code>
          </span>
        </div>
        <pre className="max-h-[360px] overflow-auto bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-foreground">
          {safeStringify(value)}
        </pre>
      </PopoverContent>
    </Popover>
  );
}

function formatPrimitive(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toLocaleString();
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
