import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getSchemaTemplate,
  listSchemaTemplates,
} from '@/features/schemas/api';
import type { ExtractionMode } from '@/features/documents/types';
import type {
  SchemaFieldDef,
  SchemaTemplateSummary,
} from '@/features/schemas/types';
import { cloneField } from '@/features/schemas/utils';

interface InitTemplatePickerProps {
  onSelect: (fields: SchemaFieldDef[], mode: ExtractionMode) => void;
  onBack: () => void;
}

export function InitTemplatePicker({ onSelect, onBack }: InitTemplatePickerProps) {
  const { t } = useTranslation('schemas');
  const templatesQuery = useQuery<SchemaTemplateSummary[]>({
    queryKey: ['schemas', 'templates'],
    queryFn: listSchemaTemplates,
    staleTime: 5 * 60 * 1000,
  });

  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handlePick = async (template: SchemaTemplateSummary) => {
    if (loadingKey) return;
    setLoadingKey(template.key);
    try {
      const full = await getSchemaTemplate(template.key);
      onSelect(full.fields.map(cloneField), 'document');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || t('load_failed'));
      setLoadingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <StepHeader
        title={t('init_template_picker_title')}
        subtitle={t('init_template_picker_subtitle')}
        onBack={onBack}
      />

      {templatesQuery.isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
        </div>
      ) : templatesQuery.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {templatesQuery.error.message || t('load_failed')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => templatesQuery.refetch()}
          >
            {t('retry')}
          </Button>
        </div>
      ) : templatesQuery.data && templatesQuery.data.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templatesQuery.data.map((template) => {
            const busy = loadingKey === template.key;
            const disabled = Boolean(loadingKey) && !busy;
            return (
              <li key={template.key}>
                <button
                  type="button"
                  onClick={() => void handlePick(template)}
                  disabled={busy || disabled}
                  className={cn(
                    'flex h-full w-full flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors',
                    !disabled && !busy && 'hover:border-primary/40 hover:bg-primary/5',
                    disabled && 'opacity-60',
                    busy && 'border-primary/40 bg-primary/5',
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {template.display_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {template.description}
                  </span>
                  {busy ? (
                    <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                      <Loader2Icon className="size-3.5 animate-spin" />
                      {t('init_template_loading')}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t('init_template_empty')}
        </p>
      )}
    </div>
  );
}

interface StepHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
}

export function StepHeader({ title, subtitle, onBack }: StepHeaderProps) {
  const { t } = useTranslation('schemas');
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 h-auto self-start px-2 text-muted-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {t('init_back')}
      </Button>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
