import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2Icon, PlusIcon, SaveIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SchemaFieldDialog } from '@/features/schemas/components/SchemaFieldDialog';
import { SchemaTable } from '@/features/schemas/components/SchemaTable';
import { ExtractionModeToggle } from '@/features/schemas/components/ExtractionModeToggle';
import { InitMethodPicker, type InitMethod } from '@/features/schemas/components/InitMethodPicker';
import { InitPromptForm } from '@/features/schemas/components/InitPromptForm';
import { InitTemplatePicker, StepHeader } from '@/features/schemas/components/InitTemplatePicker';
import { InitUploadForm } from '@/features/schemas/components/InitUploadForm';
import { useProject } from '@/features/projects';
import { useReplaceSchema, useSchema } from '@/features/schemas';
import type { ExtractionMode } from '@/features/documents/types';
import type { SchemaFieldDef } from '@/features/schemas/types';
import {
  cloneField,
  createEmptyField,
  sanitizeFieldForSave,
} from '@/features/schemas/utils';

type Stage = 'method' | InitMethod | 'review';

interface DialogState {
  open: boolean;
  mode: 'create' | 'edit';
  index: number | null;
  initialField: SchemaFieldDef;
}

const CLOSED_DIALOG: DialogState = {
  open: false,
  mode: 'create',
  index: null,
  initialField: createEmptyField(),
};

export default function ProjectInitPage() {
  const { t } = useTranslation('schemas');
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const projectQuery = useProject(projectId);
  const schemaQuery = useSchema(projectId);
  const replaceMutation = useReplaceSchema();

  const [stage, setStage] = useState<Stage>('method');
  const [draft, setDraft] = useState<SchemaFieldDef[]>([]);
  const [draftMode, setDraftMode] = useState<ExtractionMode>('document');
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [dialog, setDialog] = useState<DialogState>(CLOSED_DIALOG);

  const hasSchema = Boolean(
    schemaQuery.isSuccess &&
      schemaQuery.data &&
      schemaQuery.data.fields.length > 0,
  );

  const topLevelNames = useMemo(
    () => draft.map((field) => field.name.trim()),
    [draft],
  );

  if (!projectId) {
    return <Navigate to="/" replace />;
  }

  if (projectQuery.isError && projectQuery.error.status === 404) {
    return <Navigate to="/" replace />;
  }

  if (schemaQuery.isLoading || projectQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
      </div>
    );
  }

  if (hasSchema) {
    return <Navigate to={`/projects/${projectId}/documents`} replace />;
  }

  const handleDraftReady = (fields: SchemaFieldDef[], mode: ExtractionMode) => {
    setDraft(fields.map(cloneField));
    setDraftMode(mode);
    setSelected(new Set());
    setStage('review');
  };

  const resetWizard = () => {
    setStage('method');
    setDraft([]);
    setDraftMode('document');
    setSelected(new Set());
  };

  const openAddDialog = () => {
    setDialog({
      open: true,
      mode: 'create',
      index: null,
      initialField: createEmptyField(),
    });
  };

  const openEditDialog = (index: number) => {
    setDialog({
      open: true,
      mode: 'edit',
      index,
      initialField: cloneField(draft[index]),
    });
  };

  const closeDialog = () => setDialog(CLOSED_DIALOG);

  const handleDialogSave = (field: SchemaFieldDef) => {
    setDraft((current) => {
      if (dialog.mode === 'create') return [...current, field];
      if (dialog.index === null) return current;
      const next = [...current];
      next[dialog.index] = field;
      return next;
    });
    closeDialog();
  };

  const toggleSelection = (index: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(draft.map((_, index) => index)));
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    setDraft((current) => current.filter((_, index) => !selected.has(index)));
    setSelected(new Set());
  };

  const saveSchema = () => {
    if (draft.length === 0) {
      toast.error(t('init_empty_draft'));
      return;
    }
    const payload = {
      fields: draft.map(sanitizeFieldForSave),
      extraction_mode: draftMode,
    };
    replaceMutation.mutate(
      { projectId, payload },
      {
        onSuccess: () => {
          toast.success(t('save_success'));
          navigate(`/projects/${projectId}/documents`, { replace: true });
        },
        onError: (err) => {
          toast.error(err.message || t('save_failed'));
        },
      },
    );
  };

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('init_title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t('init_subtitle')}
        </p>
        {projectQuery.data ? (
          <p className="text-xs text-muted-foreground">{projectQuery.data.name}</p>
        ) : null}
      </header>

      {stage === 'method' ? (
        <InitMethodPicker onPick={(method) => setStage(method)} />
      ) : stage === 'template' ? (
        <InitTemplatePicker
          onSelect={handleDraftReady}
          onBack={() => setStage('method')}
        />
      ) : stage === 'prompt' ? (
        <InitPromptForm
          projectId={projectId}
          onGenerated={handleDraftReady}
          onBack={() => setStage('method')}
        />
      ) : stage === 'upload' ? (
        <InitUploadForm
          projectId={projectId}
          onGenerated={handleDraftReady}
          onBack={() => setStage('method')}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <StepHeader
            title={t('init_review_title')}
            subtitle={t('init_review_subtitle')}
            onBack={resetWizard}
          />

          <ExtractionModeToggle
            value={draftMode}
            onChange={setDraftMode}
            disabled={replaceMutation.isPending}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={openAddDialog} variant="outline">
                <PlusIcon className="size-4" />
                {t('add_field')}
              </Button>
              {selected.size > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={deleteSelected}
                >
                  {t('delete_selected', { count: selected.size })}
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={resetWizard}
                disabled={replaceMutation.isPending}
              >
                {t('init_review_reset')}
              </Button>
              <Button
                type="button"
                onClick={saveSchema}
                disabled={draft.length === 0 || replaceMutation.isPending}
              >
                {replaceMutation.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    {t('init_review_saving')}
                  </>
                ) : (
                  <>
                    <SaveIcon className="size-4" />
                    {t('init_review_save')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {draft.length > 0 ? (
            <SchemaTable
              fields={draft}
              selected={selected}
              onToggle={toggleSelection}
              onToggleAll={toggleAll}
              onEditField={openEditDialog}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">{t('init_empty_draft')}</p>
              <Button type="button" variant="outline" onClick={resetWizard}>
                {t('init_review_reset')}
              </Button>
            </div>
          )}
        </div>
      )}

      <SchemaFieldDialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        mode={dialog.mode}
        initialField={dialog.initialField}
        existingSiblingNames={
          dialog.mode === 'edit' && dialog.index !== null
            ? topLevelNames.filter((_, i) => i !== dialog.index)
            : topLevelNames
        }
        onSave={handleDialogSave}
      />
    </section>
  );
}
