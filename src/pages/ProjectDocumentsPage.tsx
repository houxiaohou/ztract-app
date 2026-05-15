import { useMemo, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentDetailDialog } from '@/features/documents/components/DocumentDetailDialog';
import {
  DocumentFilters,
  type FreshnessFilter,
} from '@/features/documents/components/DocumentFilters';
import { DocumentTable } from '@/features/documents/components/DocumentTable';
import { DocumentUploader } from '@/features/documents/components/DocumentUploader';
import { RerunStaleButton } from '@/features/documents/components/RerunStaleButton';
import { useDocuments } from '@/features/documents';
import type {
  DocumentListFilters,
  ExtractionStatus,
} from '@/features/documents/types';
import type { ProjectRead } from '@/features/projects/types';

const PAGE_SIZE = 10;

interface OutletContext {
  project: ProjectRead | undefined;
}

export default function ProjectDocumentsPage() {
  const { t } = useTranslation('documents');
  const { projectId } = useParams<{ projectId: string }>();
  const { project } = useOutletContext<OutletContext>();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [userUploaderOpen, setUserUploaderOpen] = useState<boolean | null>(null);
  const [detailDocumentId, setDetailDocumentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ExtractionStatus[]>([]);
  const [freshness, setFreshness] = useState<FreshnessFilter>('all');

  const filters: DocumentListFilters = useMemo(() => {
    const next: DocumentListFilters = {};
    if (statusFilter.length > 0) next.status = statusFilter;
    if (freshness === 'fresh') next.stale = false;
    if (freshness === 'stale') next.stale = true;
    return next;
  }, [statusFilter, freshness]);

  const [lastFilterKey, setLastFilterKey] = useState('');
  const filterKey = `${statusFilter.slice().sort().join(',')}|${freshness}`;
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    if (page !== 1) setPage(1);
  }

  const documentsQuery = useDocuments(projectId, page, PAGE_SIZE, filters);
  const data = documentsQuery.data;
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const query = searchInput.trim().toLowerCase();
    if (!query) return data.items;
    return data.items.filter((doc) => doc.file_name.toLowerCase().includes(query));
  }, [data, searchInput]);

  const autoOpen = documentsQuery.isSuccess && total === 0;
  const uploaderOpen = userUploaderOpen ?? autoOpen;
  const hasQuery = searchInput.trim().length > 0;
  const hasActiveFilters = statusFilter.length > 0 || freshness !== 'all';

  if (!projectId || !project) {
    return null;
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <DocumentFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            freshness={freshness}
            onFreshnessChange={setFreshness}
            disableFreshness={project.schema_version == null}
            onClear={() => {
              setStatusFilter([]);
              setFreshness('all');
            }}
          />
          {documentsQuery.isSuccess ? (
            <span className="text-xs text-muted-foreground">
              {t('total_documents', { count: total })}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <RerunStaleButton
            projectId={projectId}
            hasSchema={project.schema_version != null}
          />
          <div className="relative w-48 sm:w-64">
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
          <Button
            type="button"
            variant={uploaderOpen ? 'outline' : 'default'}
            onClick={() => setUserUploaderOpen(!uploaderOpen)}
            className="cursor-pointer"
          >
            {uploaderOpen ? (
              <>
                <ChevronUpIcon className="size-4" />
                {t('upload_button_close')}
              </>
            ) : (
              <>
                <PlusIcon className="size-4" />
                {t('upload_button')}
              </>
            )}
          </Button>
        </div>
      </div>

      {uploaderOpen ? (
        <DocumentUploader
          projectId={projectId}
          extractionMode={project.extraction_mode}
        />
      ) : null}

      {documentsQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
        </div>
      ) : documentsQuery.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {documentsQuery.error.message || t('load_failed')}
          </p>
          <Button variant="outline" size="sm" onClick={() => documentsQuery.refetch()}>
            {t('retry')}
          </Button>
        </div>
      ) : filteredItems.length > 0 ? (
        <>
          <DocumentTable
            projectId={projectId}
            items={filteredItems}
            onOpenDetail={setDetailDocumentId}
          />

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
                  disabled={!canPrev || documentsQuery.isFetching}
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
                  disabled={!canNext || documentsQuery.isFetching}
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
      ) : hasQuery ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
          <h2 className="text-base font-medium text-foreground">
            {t('empty_search_title', { query: searchInput.trim() })}
          </h2>
          <p className="text-sm text-muted-foreground">{t('empty_search_subtitle')}</p>
        </div>
      ) : hasActiveFilters ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
          <h2 className="text-base font-medium text-foreground">
            {t('empty_title')}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter([]);
              setFreshness('all');
            }}
          >
            {t('filter_clear')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
          <h2 className="text-base font-medium text-foreground">{t('empty_title')}</h2>
          <p className="text-sm text-muted-foreground">{t('empty_subtitle')}</p>
        </div>
      )}

      <DocumentDetailDialog
        projectId={projectId}
        documentId={detailDocumentId}
        projectSchemaVersion={project.schema_version}
        open={detailDocumentId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailDocumentId(null);
        }}
      />
    </section>
  );
}
