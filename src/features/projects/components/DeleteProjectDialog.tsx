import { useTranslation } from 'react-i18next';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteProject } from '@/features/projects';
import type { ProjectRead } from '@/features/projects/types';

interface DeleteProjectDialogProps {
  project: ProjectRead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
}: DeleteProjectDialogProps) {
  const { t } = useTranslation('projects');
  const deleteProject = useDeleteProject();
  const pending = deleteProject.isPending;

  const handleConfirm = () => {
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        toast.success(t('delete_success', { name: project.name }));
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || t('delete_failed'));
      },
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_description', { name: project.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {t('delete_cancel')}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
            className="min-w-32"
          >
            {pending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {t('delete_confirming')}
              </>
            ) : (
              t('delete_confirm')
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
