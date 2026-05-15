import { useMemo, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangleIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ExtractionModeToggle } from '@/features/schemas/components/ExtractionModeToggle';
import { SchemaFieldDialog } from '@/features/schemas/components/SchemaFieldDialog';
import { SchemaTable } from '@/features/schemas/components/SchemaTable';
import {
  useReplaceSchema,
  useSchema,
} from '@/features/schemas';
import type { ExtractionMode } from '@/features/documents/types';
import type { ProjectRead } from '@/features/projects/types';
import type { SchemaFieldDef } from '@/features/schemas/types';
import {
  cloneField,
  createEmptyField,
  fieldsEqual,
  sanitizeFieldForSave,
} from '@/features/schemas/utils';

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

interface OutletContext {
  project: ProjectRead | undefined;
}

export default function ProjectSchemaPage() {
  const { t } = useTranslation('schemas');
  const { projectId } = useParams<{ projectId: string }>();
  const { project } = useOutletContext<OutletContext>();

  const schemaQuery = useSchema(projectId);
  const replaceMutation = useReplaceSchema();

  const [serverSnapshot, setServerSnapshot] = useState<SchemaFieldDef[]>([]);
  const [workingFields, setWorkingFields] = useState<SchemaFieldDef[]>([]);
  const [serverMode, setServerMode] = useState<ExtractionMode>('document');
  const [workingMode, setWorkingMode] = useState<ExtractionMode>('document');
  const [lastSyncedAt, setLastSyncedAt] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [dialog, setDialog] = useState<DialogState>(CLOSED_DIALOG);
  const [modeChangeConfirm, setModeChangeConfirm] = useState(false);

  // Sync server state into working copies whenever the schema or project
  // payload arrives. We bucket on `dataUpdatedAt` so that re-renders without
  // new data don't clobber unsaved edits.
  const projectMode: ExtractionMode = project?.extraction_mode ?? 'document';
  if (
    schemaQuery.dataUpdatedAt > 0 &&
    schemaQuery.dataUpdatedAt !== lastSyncedAt
  ) {
    const incoming =
      schemaQuery.data?.fields.map(cloneField) ?? ([] as SchemaFieldDef[]);
    setLastSyncedAt(schemaQuery.dataUpdatedAt);
    setServerSnapshot(incoming);
    setWorkingFields(incoming.map(cloneField));
    setServerMode(projectMode);
    setWorkingMode(projectMode);
    setSelected(new Set());
  }

  const dirty = useMemo(
    () =>
      !fieldsEqual(workingFields, serverSnapshot) || workingMode !== serverMode,
    [workingFields, serverSnapshot, workingMode, serverMode],
  );

  const modeChanged = workingMode !== serverMode;

  const topLevelNames = useMemo(
    () => workingFields.map((f) => f.name.trim()),
    [workingFields],
  );

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
      initialField: cloneField(workingFields[index]),
    });
  };

  const closeDialog = () => {
    setDialog(CLOSED_DIALOG);
  };

  const handleDialogSave = (field: SchemaFieldDef) => {
    setWorkingFields((current) => {
      if (dialog.mode === 'create') {
        return [...current, field];
      }
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
    setSelected(new Set(workingFields.map((_, index) => index)));
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    setWorkingFields((current) =>
      current.filter((_, index) => !selected.has(index)),
    );
    setSelected(new Set());
  };

  const submitSave = () => {
    if (!projectId) return;
    if (workingFields.length === 0) {
      toast.error(t('empty_subtitle'));
      return;
    }
    const payload = {
      fields: workingFields.map(sanitizeFieldForSave),
      extraction_mode: workingMode,
    };
    replaceMutation.mutate(
      { projectId, payload },
      {
        onSuccess: () => {
          toast.success(t('save_success'));
        },
        onError: (err) => {
          toast.error(err.message || t('save_failed'));
        },
      },
    );
  };

  const handleSaveClick = () => {
    if (modeChanged) {
      setModeChangeConfirm(true);
      return;
    }
    submitSave();
  };

  const handleModeConfirm = () => {
    setModeChangeConfirm(false);
    submitSave();
  };

  const isLoading = schemaQuery.isLoading;
  const isError = schemaQuery.isError;
  const isSaving = replaceMutation.isPending;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{t('page_subtitle')}</p>
      </header>

      <ExtractionModeToggle
        value={workingMode}
        onChange={setWorkingMode}
        disabled={isSaving}
        helperText={
          modeChanged ? t('extraction_mode_change_warning') : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={openAddDialog}>
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
              <Trash2Icon className="size-4" />
              {t('delete_selected', { count: selected.size })}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {dirty ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
              <AlertTriangleIcon className="size-3.5" aria-hidden />
              {t('unsaved_changes')}
            </span>
          ) : null}
          <Button
            type="button"
            onClick={handleSaveClick}
            disabled={!dirty || isSaving || workingFields.length === 0}
          >
            {isSaving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <SaveIcon className="size-4" />
                {t('save_schema')}
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {schemaQuery.error.message || t('load_failed')}
          </p>
          <Button variant="outline" size="sm" onClick={() => schemaQuery.refetch()}>
            {t('retry')}
          </Button>
        </div>
      ) : workingFields.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-12 text-center">
          <h2 className="text-base font-medium text-foreground">
            {t('empty_title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('empty_subtitle')}</p>
          <Button type="button" onClick={openAddDialog}>
            <PlusIcon className="size-4" />
            {t('add_field')}
          </Button>
        </div>
      ) : (
        <SchemaTable
          fields={workingFields}
          selected={selected}
          onToggle={toggleSelection}
          onToggleAll={toggleAll}
          onEditField={openEditDialog}
        />
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

      <AlertDialog
        open={modeChangeConfirm}
        onOpenChange={(open) => {
          if (!open && !isSaving) setModeChangeConfirm(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('extraction_mode_change_confirm_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('extraction_mode_change_confirm_description', {
                from: t(`extraction_mode_${serverMode}_title`),
                to: t(`extraction_mode_${workingMode}_title`),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>
              {t('extraction_mode_change_confirm_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              onClick={(event) => {
                event.preventDefault();
                handleModeConfirm();
              }}
            >
              {isSaving ? <Loader2Icon className="size-4 animate-spin" /> : null}
              {t('extraction_mode_change_confirm_cta')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
