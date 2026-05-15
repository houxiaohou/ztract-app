import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  BlocksIcon,
  DatabaseIcon,
  DownloadIcon,
  FileTextIcon,
  type LucideIcon,
} from 'lucide-react';

import logoUrl from '@/assets/logo.svg';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ProjectRead } from '@/features/projects/types';

interface ProjectSidebarProps {
  project: ProjectRead | undefined;
  isLoading: boolean;
}

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: 'documents', labelKey: 'detail_nav_documents', icon: FileTextIcon },
  { to: 'parsed-data', labelKey: 'detail_nav_parsed_data', icon: DatabaseIcon },
  { to: 'exports', labelKey: 'detail_nav_exports', icon: DownloadIcon },
  { to: 'schema', labelKey: 'detail_nav_schema', icon: BlocksIcon },
];

export function ProjectSidebar({ project, isLoading }: ProjectSidebarProps) {
  const { t } = useTranslation('projects');

  return (
    <div className="flex h-full flex-col gap-6 border-b border-border bg-muted/30 p-4 sm:p-5 lg:h-dvh lg:border-b-0 lg:border-r">
      <Link
        to="/"
        className="flex items-center gap-2 self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
      >
        <img
          src={logoUrl}
          alt={t('app_name', { ns: 'common' })}
          className="h-6 w-auto select-none"
          draggable={false}
        />
      </Link>

      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
      >
        <ArrowLeftIcon className="size-3.5" />
        {t('detail_back_home')}
      </Link>

      <div className="flex flex-col gap-1.5">
        {isLoading && !project ? (
          <>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-full max-w-48" />
          </>
        ) : project ? (
          <>
            <h2 className="text-base font-semibold tracking-tight text-foreground break-words">
              {project.name}
            </h2>
            {project.description ? (
              <p className="text-xs text-muted-foreground line-clamp-3">
                {project.description}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <nav className="flex flex-col gap-1" aria-label="Project sections">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={false}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
