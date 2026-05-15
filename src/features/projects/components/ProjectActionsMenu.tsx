import { useTranslation } from 'react-i18next';
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectActionsMenu({ onEdit, onDelete }: ProjectActionsMenuProps) {
  const { t } = useTranslation('projects');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('actions_menu_label')}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=open]:bg-muted data-[state=open]:text-foreground"
      >
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onSelect={onEdit}>
          <PencilIcon className="size-4" />
          {t('edit')}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2Icon className="size-4" />
          {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
