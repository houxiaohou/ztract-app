import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FolderIcon, FileIcon } from 'lucide-react';

import { formatDateTime } from '@/lib/date';
import { intlLocale } from '@/features/billing/utils';
import { DeleteProjectDialog } from '@/features/projects/components/DeleteProjectDialog';
import { ProjectActionsMenu } from '@/features/projects/components/ProjectActionsMenu';
import { ProjectFormDialog } from '@/features/projects/components/ProjectFormDialog';
import type { ProjectRead } from '@/features/projects/types';

interface ProjectListItemProps {
  project: ProjectRead;
}

export function ProjectListItem({ project }: ProjectListItemProps) {
  const { t, i18n } = useTranslation('projects');
  const locale = intlLocale(i18n.language);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const detailPath = `/projects/${project.id}/documents`;

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <Link
          to={detailPath}
          className="group flex min-w-0 flex-1 items-start gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FolderIcon className="size-4" aria-hidden />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
              {project.name}
            </h3>
            {project.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {project.description}
              </p>
            ) : null}
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-nums"
            aria-label={t('col_files_count', { count: project.file_count })}
          >
            <FileIcon className="size-3.5" aria-hidden />
            {t('col_files_count', { count: project.file_count.toLocaleString(locale) })}
          </div>
          <ProjectActionsMenu
            onEdit={() => setEditOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {t('col_created', { date: formatDateTime(project.created_at, locale) })}
      </div>

      <ProjectFormDialog
        mode="edit"
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteProjectDialog
        project={project}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </li>
  );
}
