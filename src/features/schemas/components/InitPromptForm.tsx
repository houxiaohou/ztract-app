import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2Icon, SparklesIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ExtractionMode } from '@/features/documents/types';
import { generateSchemaFromPrompt } from '@/features/schemas/api';
import { StepHeader } from '@/features/schemas/components/InitTemplatePicker';
import type { SchemaFieldDef } from '@/features/schemas/types';

interface InitPromptFormProps {
  projectId: string;
  onGenerated: (fields: SchemaFieldDef[], mode: ExtractionMode) => void;
  onBack: () => void;
}

const MIN_PROMPT_LENGTH = 10;

export function InitPromptForm({ projectId, onGenerated, onBack }: InitPromptFormProps) {
  const { t } = useTranslation('schemas');
  const [prompt, setPrompt] = useState('');

  const generate = useMutation({
    mutationFn: (value: string) => generateSchemaFromPrompt(projectId, value),
    onSuccess: (draft) => {
      onGenerated(draft.fields, draft.chosen_extraction_mode ?? 'document');
    },
    onError: (err: Error) => {
      toast.error(err.message || t('init_upload_generate_failed'));
    },
  });

  const trimmed = prompt.trim();
  const canSubmit = trimmed.length >= MIN_PROMPT_LENGTH && !generate.isPending;

  const handleSubmit = () => {
    if (trimmed.length < MIN_PROMPT_LENGTH) {
      toast.error(t('init_prompt_min_length'));
      return;
    }
    generate.mutate(trimmed);
  };

  return (
    <div className="flex flex-col gap-5">
      <StepHeader
        title={t('init_prompt_title')}
        subtitle={t('init_prompt_subtitle')}
        onBack={onBack}
      />

      <Textarea
        rows={6}
        autoFocus
        placeholder={t('init_prompt_placeholder')}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        disabled={generate.isPending}
      />

      <div className="flex items-center justify-end">
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {generate.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              {t('init_prompt_generating')}
            </>
          ) : (
            <>
              <SparklesIcon className="size-4" aria-hidden />
              {t('init_prompt_generate')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
