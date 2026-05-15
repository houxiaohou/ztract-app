import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCreateProject, useUpdateProject } from '@/features/projects';
import {
  projectCreateSchema,
  type ProjectCreateInput,
} from '@/features/projects/schemas';
import type { ProjectRead } from '@/features/projects/types';

type ProjectFormDialogProps =
  | {
      mode: 'create';
      open: boolean;
      onOpenChange: (open: boolean) => void;
      project?: never;
    }
  | {
      mode: 'edit';
      open: boolean;
      onOpenChange: (open: boolean) => void;
      project: ProjectRead;
    };

const EMPTY_VALUES: ProjectCreateInput = { name: '', description: '' };

function valuesFromProject(project: ProjectRead): ProjectCreateInput {
  return {
    name: project.name,
    description: project.description ?? '',
  };
}

export function ProjectFormDialog(props: ProjectFormDialogProps) {
  const { mode, open, onOpenChange } = props;
  const { t } = useTranslation('projects');
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const defaultValues =
    mode === 'edit' ? valuesFromProject(props.project) : EMPTY_VALUES;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<ProjectCreateInput>({
    resolver: zodResolver(projectCreateSchema),
    mode: 'onTouched',
    defaultValues,
  });

  useEffect(() => {
    if (open) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, mode === 'edit' ? props.project.id : null]);

  const pending = createProject.isPending || updateProject.isPending;

  const onSubmit = handleSubmit((values) => {
    const payload = {
      name: values.name,
      description: values.description ? values.description : null,
    };

    if (mode === 'create') {
      createProject.mutate(
        { name: payload.name, description: payload.description ?? undefined },
        {
          onSuccess: (project) => {
            toast.success(t('create_success', { name: project.name }));
            onOpenChange(false);
            navigate(`/projects/${project.id}/init`);
          },
          onError: (err) => {
            toast.error(err.message || t('create_failed'));
          },
        },
      );
    } else {
      updateProject.mutate(
        { projectId: props.project.id, payload },
        {
          onSuccess: (project) => {
            toast.success(t('update_success', { name: project.name }));
            onOpenChange(false);
          },
          onError: (err) => {
            toast.error(err.message || t('update_failed'));
          },
        },
      );
    }
  });

  const nameError = errors.name?.message;
  const descriptionError = errors.description?.message;
  const title = mode === 'create' ? t('create_title') : t('update_title');
  const subtitle = mode === 'create' ? t('create_subtitle') : t('update_subtitle');
  const submitLabel = mode === 'create' ? t('submit') : t('update_submit');
  const submittingLabel =
    mode === 'create' ? t('submitting') : t('update_submitting');
  const canSubmit = isValid && (mode === 'create' || isDirty);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">{t('field_name_label')}</Label>
            <Input
              id="project-name"
              autoFocus
              autoComplete="off"
              placeholder={t('field_name_placeholder')}
              aria-invalid={Boolean(nameError)}
              {...register('name')}
            />
            {nameError ? (
              <p className="text-xs text-destructive">{t(nameError)}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="project-description">
                {t('field_description_label')}
              </Label>
              <span className="text-xs text-muted-foreground">
                {t('field_description_optional')}
              </span>
            </div>
            <Textarea
              id="project-description"
              rows={4}
              placeholder={t('field_description_placeholder')}
              aria-invalid={Boolean(descriptionError)}
              {...register('description')}
            />
            {descriptionError ? (
              <p className="text-xs text-destructive">{t(descriptionError)}</p>
            ) : null}
          </div>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                {t('cancel')}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className={cn('min-w-32')}
              disabled={pending || !canSubmit}
            >
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {submittingLabel}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
