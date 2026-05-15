import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ExportJobsTable } from '@/features/parsed-data/components/ExportJobsTable';
import { useExportJobs } from '@/features/parsed-data';
import type { ProjectRead } from '@/features/projects/types';

const PAGE_SIZE = 10;

interface OutletContext {
  project: ProjectRead | undefined;
}

export default function ProjectExportsPage() {
  const { t } = useTranslation('parsed-data');
  const { projectId } = useParams<{ projectId: string }>();
  const { project } = useOutletContext<OutletContext>();

  const [page, setPage] = useState(1);

  const query = useExportJobs(projectId, page, PAGE_SIZE);
  const data = query.data;
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const items = data?.items ?? [];

  if (!projectId || !project) return null;

  return (
    <section className="flex flex-col gap-4">
      {query.isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {query.error.message || t('exports_load_failed')}
          </p>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            {t('retry')}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
          <h2 className="text-base font-medium text-foreground">
            {t('exports_empty_title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('exports_empty_subtitle')}
          </p>
        </div>
      ) : (
        <>
          <ExportJobsTable projectId={projectId} items={items} />

          {totalPages > 1 ? (
            <nav
              className="flex items-center justify-between gap-4 pt-1"
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
                  disabled={!canPrev || query.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer"
                >
                  <ChevronLeftIcon className="size-4" />
                  {t('prev')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canNext || query.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="cursor-pointer"
                >
                  {t('next')}
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
