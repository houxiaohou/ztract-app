import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useProjects } from '@/features/projects';
import { ProjectFormDialog } from '@/features/projects/components/ProjectFormDialog';
import { ProjectListItem } from '@/features/projects/components/ProjectListItem';

const PAGE_SIZE = 10;

export default function HomePage() {
  const { t } = useTranslation('projects');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebouncedValue(searchInput, 300);
  const [lastQuery, setLastQuery] = useState(debouncedQuery);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (debouncedQuery !== lastQuery) {
    setLastQuery(debouncedQuery);
    setPage(1);
  }

  const projectsQuery = useProjects({
    page,
    size: PAGE_SIZE,
    q: debouncedQuery,
    sort: 'created_at_desc',
  });

  const data = projectsQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const hasQuery = debouncedQuery.trim().length > 0;

  return (
    <section className="flex max-w-4xl mx-auto flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('page_title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('page_subtitle')}</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('search_placeholder')}
            className="pl-9"
            aria-label={t('search_placeholder')}
          />
        </div>
        <Button className={'cursor-pointer'} type="button" onClick={() => setDialogOpen(true)}>
          <PlusIcon className="size-4" />
          {t('create_button')}
        </Button>
      </div>

      {projectsQuery.isLoading ? (
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <li
              key={idx}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <Skeleton className="mt-0.5 size-8 rounded-md" />
                  <div className="flex w-full flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </li>
          ))}
        </ul>
      ) : projectsQuery.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {projectsQuery.error.message || t('load_failed')}
          </p>
          <Button variant="outline" size="sm" onClick={() => projectsQuery.refetch()}>
            {t('retry')}
          </Button>
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <ul className="flex flex-col gap-3">
            {data.items.map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}
          </ul>

          {totalPages > 1 ? (
            <nav
              className="flex items-center justify-between gap-4 pt-2"
              aria-label="Pagination"
            >
              <span className="text-xs text-muted-foreground">
                {t('pagination', { page, pages: totalPages })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canPrev || projectsQuery.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeftIcon className="size-4" />
                  {t('prev')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canNext || projectsQuery.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('next')}
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </nav>
          ) : null}

          {projectsQuery.isFetching && !projectsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <h2 className="text-base font-medium text-foreground">
            {hasQuery
              ? t('empty_search_title', { query: debouncedQuery })
              : t('empty_title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasQuery ? t('empty_search_subtitle') : t('empty_subtitle')}
          </p>
          {hasQuery ? null : (
            <Button type="button" onClick={() => setDialogOpen(true)}>
              <PlusIcon className="size-4" />
              {t('create_button')}
            </Button>
          )}
        </div>
      )}

      <ProjectFormDialog
        mode="create"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
}
