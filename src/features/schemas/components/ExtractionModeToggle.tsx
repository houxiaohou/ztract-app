import { useTranslation } from 'react-i18next';
import { FileTextIcon, LayersIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ExtractionMode } from '@/features/documents/types';

interface ExtractionModeToggleProps {
  value: ExtractionMode;
  onChange: (mode: ExtractionMode) => void;
  disabled?: boolean;
  helperText?: string;
}

export function ExtractionModeToggle({
  value,
  onChange,
  disabled,
  helperText,
}: ExtractionModeToggleProps) {
  const { t } = useTranslation('schemas');

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('extraction_mode_label')}
        </span>
        {helperText ? (
          <span className="text-xs text-muted-foreground">{helperText}</span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Tile
          active={value === 'document'}
          disabled={disabled}
          onClick={() => onChange('document')}
          icon={<FileTextIcon className="size-4" aria-hidden />}
          title={t('extraction_mode_document_title')}
          body={t('extraction_mode_document_body')}
        />
        <Tile
          active={value === 'per_page'}
          disabled={disabled}
          onClick={() => onChange('per_page')}
          icon={<LayersIcon className="size-4" aria-hidden />}
          title={t('extraction_mode_per_page_title')}
          body={t('extraction_mode_per_page_body')}
        />
      </div>
    </div>
  );
}

interface TileProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
}

function Tile({ active, disabled, onClick, icon, title, body }: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left transition-colors',
        active
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40',
        disabled && 'cursor-not-allowed opacity-60',
        !disabled && 'cursor-pointer',
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        {icon}
        {title}
      </span>
      <span className="text-xs text-muted-foreground">{body}</span>
    </button>
  );
}
