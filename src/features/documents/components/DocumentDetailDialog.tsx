import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangleIcon,
  Loader2Icon,
  RefreshCcwIcon,
  RotateCwIcon,
  Trash2Icon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { DocumentStatusBadge } from '@/features/documents/components/DocumentStatusBadge';
import { DocumentThumbnails } from '@/features/documents/components/DocumentThumbnails';
import {
  DocumentVisualizer,
  type VisualizerHandle,
} from '@/features/documents/components/DocumentVisualizer';
import { ExtractionResultPanel } from '@/features/documents/components/ExtractionResultPanel';
import { ExtractionPageList } from '@/features/documents/components/ExtractionPageList';
import {
  flattenCitations,
  type CitationLeaf,
} from '@/features/documents/citations';
import {
  getDocument,
  pageImageUrl,
  useDocumentExtraction,
  useDocumentExtractions,
} from '@/features/documents';
import {
  useDeleteDocument,
  useRerunDocument,
} from '@/features/documents/hooks/useDocumentActions';
import { useAuthStore } from '@/features/auth/store';
import type {
  DocumentExtractionRead,
  ExtractionPage,
  ExtractionResultBody,
  ExtractionStatus,
} from '@/features/documents/types';

interface BlockItem {
  id: string;
  page: number;
  angle: number;
  blockStyle: {
    fill: string;
    stroke: string;
    'stroke-width': number;
  };
  text: string;
  position: number[];
  type?: string;
  meta: unknown;
  attrs: Record<string, unknown>;
}

interface PageItem {
  url: string;
  width: number;
  height: number;
  angle: number;
  blockList: BlockItem[];
}

const BLOCK_STYLE = {
  fill: 'rgba(59, 130, 246, 0.15)',
  stroke: '#6597ec',
  'stroke-width': 2.5,
} as const;

const ACTIVE_BLOCK_STYLE = {
  fill: 'rgba(59, 130, 246, 0.6)',
  stroke: '#3b82f6',
  'stroke-width': 5,
} as const;

function sanitizeForId(raw: string): string {
  return raw.replace(/[^\w.-]/g, '_');
}

function blockIdFor(leafId: string, regionIndex: number): string {
  return `leaf--${sanitizeForId(leafId)}__${regionIndex}`;
}

function leafIdFromBlockId(
  blockId: string,
  leafLookup: Map<string, CitationLeaf>,
): string | null {
  const match = blockId.match(/^leaf--(.+)__(\d+)$/);
  if (!match) return null;
  const sanitized = match[1];
  for (const id of leafLookup.keys()) {
    if (sanitizeForId(id) === sanitized) return id;
  }
  return null;
}

function toRelativePosition(
  position: number[],
  width: number,
  height: number,
): number[] {
  if (width <= 0 || height <= 0 || position.length !== 8) {
    return position;
  }
  return [
    position[0] / width,
    position[1] / height,
    position[2] / width,
    position[3] / height,
    position[4] / width,
    position[5] / height,
    position[6] / width,
    position[7] / height,
  ];
}

function isExtractionStale(
  extraction: DocumentExtractionRead,
  projectSchemaVersion: number | null | undefined,
): boolean {
  if (extraction.schema_version == null) return true;
  if (projectSchemaVersion == null) return false;
  return extraction.schema_version < projectSchemaVersion;
}

interface DocumentDetailDialogProps {
  projectId: string;
  documentId: string | null;
  projectSchemaVersion: number | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentDetailDialog({
  projectId,
  documentId,
  projectSchemaVersion,
  open,
  onOpenChange,
}: DocumentDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onEscapeKeyDown={(e)=>e.preventDefault()}
        showCloseButton
        className="grid h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">Document detail</DialogTitle>
        <DialogDescription className="sr-only">
          Visualise the extracted data on the document pages.
        </DialogDescription>
        {open && documentId ? (
          <DocumentDetailView
            projectId={projectId}
            documentId={documentId}
            projectSchemaVersion={projectSchemaVersion}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface DocumentDetailViewProps {
  projectId: string;
  documentId: string;
  projectSchemaVersion: number | null | undefined;
  onClose: () => void;
}

function pickDefaultExtraction(
  items: DocumentExtractionRead[],
): DocumentExtractionRead | null {
  if (items.length === 0) return null;
  const firstSuccess = items.find((item) => item.status === 'success');
  return firstSuccess ?? items[0];
}

function DocumentDetailView({
  projectId,
  documentId,
  projectSchemaVersion,
  onClose,
}: DocumentDetailViewProps) {
  const { t } = useTranslation('documents');
  const token = useAuthStore((state) => state.token);

  const documentQuery = useQuery({
    queryKey: ['documents', 'detail', projectId, documentId],
    queryFn: () => getDocument(projectId, documentId),
    enabled: Boolean(projectId && documentId && token),
    staleTime: 30 * 1000,
  });

  const extractionsQuery = useDocumentExtractions(projectId, documentId);

  const visualizerHandle = useRef<VisualizerHandle | null>(null);
  const [activeLeafId, setActiveLeafId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeExtractionId, setActiveExtractionId] = useState<string | null>(
    null,
  );
  const [lastListVersion, setLastListVersion] = useState(0);

  const doc = documentQuery.data;
  const isPerPage = doc?.extraction_mode === 'per_page';

  const extractionItems = useMemo(
    () => extractionsQuery.data?.items ?? [],
    [extractionsQuery.data?.items],
  );

  // Pick a default active extraction the first time the list arrives, or
  // when the previously-selected one disappears (e.g. after a re-extract
  // that re-creates the rows).
  if (
    extractionsQuery.dataUpdatedAt > 0 &&
    extractionsQuery.dataUpdatedAt !== lastListVersion
  ) {
    setLastListVersion(extractionsQuery.dataUpdatedAt);
    const exists = extractionItems.some(
      (item) => item.id === activeExtractionId,
    );
    if (!exists) {
      const fallback = pickDefaultExtraction(extractionItems);
      setActiveExtractionId(fallback?.id ?? null);
    }
  }

  const activeExtractionMeta = useMemo(
    () =>
      activeExtractionId
        ? extractionItems.find((item) => item.id === activeExtractionId) ?? null
        : null,
    [activeExtractionId, extractionItems],
  );

  // Only fetch the full extraction (with `result`) once it's actually done —
  // pending/processing rows have no payload to render.
  const shouldFetchActive = activeExtractionMeta?.status === 'success';
  const activeExtractionQuery = useDocumentExtraction(
    projectId,
    documentId,
    shouldFetchActive ? activeExtractionId : null,
  );

  const activeExtraction = activeExtractionQuery.data;
  const body: ExtractionResultBody | undefined = activeExtraction?.result
    ?.result as ExtractionResultBody | undefined;

  const { leaves, root } = useMemo(
    () => flattenCitations(body?.citations),
    [body?.citations],
  );

  const leafMap = useMemo(() => {
    const map = new Map<string, CitationLeaf>();
    leaves.forEach((leaf) => map.set(leaf.id, leaf));
    return map;
  }, [leaves]);

  const pages: ExtractionPage[] = useMemo(() => {
    const list = body?.pages ?? [];
    return [...list].sort((a, b) => a.page_number - b.page_number);
  }, [body?.pages]);

  const pageIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    pages.forEach((page, index) => map.set(page.page_number, index + 1));
    return map;
  }, [pages]);

  const resolvedCurrentPage = useMemo(() => {
    if (pages.length === 0) return currentPage;
    if (pages.some((p) => p.page_number === currentPage)) return currentPage;
    return pages[0].page_number;
  }, [pages, currentPage]);

  const activeBlockIds = useMemo(() => {
    if (!activeLeafId) return [];
    const leaf = leafMap.get(activeLeafId);
    if (!leaf) return [];
    return leaf.regions.map((_, index) => blockIdFor(leaf.id, index));
  }, [activeLeafId, leafMap]);

  const pageList: PageItem[] = useMemo(() => {
    if (!projectId || !documentId) return [];
    return pages.map((page) => {
      const libraryPage = pageIndexMap.get(page.page_number) ?? 1;
      const blockList: BlockItem[] = [];
      for (const leaf of leaves) {
        leaf.regions.forEach((region, regionIndex) => {
          if (region.page_number !== page.page_number) return;
          const id = blockIdFor(leaf.id, regionIndex);
          blockList.push({
            id,
            page: libraryPage,
            angle: 0,
            blockStyle: activeBlockIds.includes(id) ? ACTIVE_BLOCK_STYLE : BLOCK_STYLE,
            text: leaf.value,
            position: toRelativePosition(region.position, page.width, page.height),
            type: leaf.label,
            meta: { leafId: leaf.id },
            attrs: {},
          });
        });
      }

      return {
        url: pageImageUrl(projectId, documentId, page.page_number),
        width: page.width,
        height: page.height,
        angle: page.angle ?? 0,
        blockList,
      };
    });
  }, [pages, pageIndexMap, leaves, activeBlockIds, projectId, documentId]);

  const handleSelectLeaf = (leafId: string) => {
    const leaf = leafMap.get(leafId);
    setActiveLeafId(leafId);
    const firstRegion = leaf?.regions[0];
    if (!firstRegion) return;
    const pageIndex = pageIndexMap.get(firstRegion.page_number);
    if (!pageIndex) return;
    visualizerHandle.current?.scrollToBlock(blockIdFor(leafId, 0));
    setCurrentPage(firstRegion.page_number);
  };

  const handleBlockClick = (blockId: string) => {
    const leafId = leafIdFromBlockId(blockId, leafMap);
    if (!leafId) return;
    setActiveLeafId(leafId);
  };

  const handleJumpToPage = (pageNumber: number) => {
    const pageIndex = pageIndexMap.get(pageNumber);
    if (!pageIndex) return;
    visualizerHandle.current?.scrollToPage(pageIndex);
    setCurrentPage(pageNumber);
  };

  const handleVisualizerPageChange = (libraryPage: number) => {
    const page = pages[libraryPage - 1];
    if (page) setCurrentPage(page.page_number);
  };

  const stale = useMemo(() => {
    if (extractionItems.length === 0) return false;
    return extractionItems.some(
      (item) =>
        (item.status === 'success' || item.status === 'failed') &&
        isExtractionStale(item, projectSchemaVersion),
    );
  }, [extractionItems, projectSchemaVersion]);

  const canRerun = useMemo(() => {
    if (!doc) return false;
    return (
      doc.status === 'success' ||
      doc.status === 'failed' ||
      doc.status === 'partial'
    );
  }, [doc]);

  const [rerunOpen, setRerunOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const rerunMutation = useRerunDocument(projectId);
  const deleteMutation = useDeleteDocument(projectId);

  const handleRerunConfirm = () => {
    rerunMutation.mutate(documentId, {
      onSettled: () => setRerunOpen(false),
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(documentId, {
      onSuccess: () => {
        setDeleteOpen(false);
        onClose();
      },
      onError: () => setDeleteOpen(false),
    });
  };

  const showLeftSidebar = pages.length > 0 || isPerPage;
  const detailGridCols = showLeftSidebar
    ? 'grid-cols-[200px_minmax(0,1fr)_360px]'
    : 'grid-cols-[minmax(0,1fr)_360px]';

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background py-2 pl-4 pr-16 sm:pl-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="truncate text-sm font-medium text-foreground"
            title={doc?.file_name}
          >
            {doc?.file_name ?? t('detail_document')}
          </span>
          {doc ? <DocumentStatusBadge status={doc.status} /> : null}
          {stale ? (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700"
              title={t('stale_tooltip')}
            >
              <AlertTriangleIcon className="size-3" aria-hidden />
              {t('stale_badge')}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canRerun || rerunMutation.isPending}
            onClick={() => setRerunOpen(true)}
            className="cursor-pointer gap-1.5"
          >
            {rerunMutation.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <RefreshCcwIcon className="size-4" />
            )}
            {t('action_rerun')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => setDeleteOpen(true)}
            className="cursor-pointer gap-1.5 text-destructive hover:text-destructive"
          >
            {deleteMutation.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <Trash2Icon className="size-4" />
            )}
            {t('action_delete')}
          </Button>
        </div>
      </div>

      {stale ? (
        <div className="flex shrink-0 items-start gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 sm:px-6">
          <AlertTriangleIcon
            className="mt-0.5 size-4 shrink-0 text-amber-700"
            aria-hidden
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-sm font-medium text-amber-900">
              {t('stale_banner_title')}
            </p>
            <p className="text-xs text-amber-800">
              {t('stale_banner_subtitle')}
            </p>
          </div>
        </div>
      ) : null}

      {extractionsQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
        </div>
      ) : extractionsQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            {extractionsQuery.error.message || t('detail_load_failed')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => extractionsQuery.refetch()}
          >
            {t('retry')}
          </Button>
        </div>
      ) : extractionItems.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <p className="text-sm">{t('detail_no_pages')}</p>
        </div>
      ) : (
        <div className={cn('grid min-h-0 flex-1', detailGridCols)}>
          {showLeftSidebar ? (
            <aside className="min-h-0 overflow-y-auto border-r border-border bg-muted/30">
              {isPerPage ? (
                <ExtractionPageList
                  items={extractionItems}
                  activeId={activeExtractionId}
                  staleProjectSchemaVersion={projectSchemaVersion}
                  onSelect={(id) => {
                    setActiveExtractionId(id);
                    setActiveLeafId(null);
                  }}
                />
              ) : (
                <DocumentThumbnails
                  projectId={projectId}
                  documentId={documentId}
                  pages={pages}
                  currentPage={resolvedCurrentPage}
                  onJumpTo={handleJumpToPage}
                />
              )}
            </aside>
          ) : null}
          <section className="flex min-h-0 flex-col bg-muted/10">
            {pages.length > 0 ? (
              <PreviewToolbar
                currentPage={resolvedCurrentPage}
                totalPages={pages.length}
                onZoomIn={() => visualizerHandle.current?.zoomIn()}
                onZoomOut={() => visualizerHandle.current?.zoomOut()}
                onRotate={() => visualizerHandle.current?.rotateCw()}
                onReset={() => visualizerHandle.current?.reset()}
              />
            ) : null}
            <div className="min-h-0 flex-1">
              {activeExtractionMeta &&
              activeExtractionMeta.status !== 'success' ? (
                <ExtractionNotReady
                  status={activeExtractionMeta.status}
                  errorMessage={activeExtractionMeta.error_message}
                />
              ) : activeExtractionQuery.isLoading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2Icon className="size-5 animate-spin" />
                </div>
              ) : pages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <p className="text-sm">{t('detail_no_pages')}</p>
                </div>
              ) : (
                <DocumentVisualizer
                  projectId={projectId}
                  documentId={documentId}
                  pageList={pageList}
                  activeBlockIds={activeBlockIds}
                  onBlockClick={handleBlockClick}
                  onPageChange={handleVisualizerPageChange}
                  handleRef={visualizerHandle}
                />
              )}
            </div>
          </section>
          <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-border bg-background">
            <ExtractionResultPanel
              root={root}
              activeLeafId={activeLeafId}
              onSelectLeaf={handleSelectLeaf}
            />
          </aside>
        </div>
      )}

      <AlertDialog
        open={rerunOpen}
        onOpenChange={(open) => {
          if (!open && rerunMutation.isPending) return;
          setRerunOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rerun_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('rerun_confirm_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rerunMutation.isPending}>
              {t('rerun_confirm_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={rerunMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleRerunConfirm();
              }}
            >
              {rerunMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              {t('rerun_confirm_cta')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && deleteMutation.isPending) return;
          setDeleteOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_confirm_description', {
                name: doc?.file_name ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('delete_confirm_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDeleteConfirm();
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              {t('delete_confirm_cta')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface PreviewToolbarProps {
  currentPage: number;
  totalPages: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onReset: () => void;
}

function PreviewToolbar({
  currentPage,
  totalPages,
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset,
}: PreviewToolbarProps) {
  const { t } = useTranslation('documents');
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background/80 px-3 py-1.5 backdrop-blur">
      <span className="text-xs tabular-nums text-muted-foreground">
        {t('detail_page_indicator', { current: currentPage, total: totalPages })}
      </span>
      <div className="flex items-center gap-1">
        <IconButton label={t('detail_zoom_out')} onClick={onZoomOut}>
          <ZoomOutIcon className="size-4" />
        </IconButton>
        <IconButton label={t('detail_zoom_in')} onClick={onZoomIn}>
          <ZoomInIcon className="size-4" />
        </IconButton>
        <IconButton label={t('detail_rotate')} onClick={onRotate}>
          <RotateCwIcon className="size-4" />
        </IconButton>
        <IconButton label={t('detail_reset_view')} onClick={onReset}>
          <RefreshCcwIcon className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

function IconButton({ label, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors',
        'hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      {children}
    </button>
  );
}

interface ExtractionNotReadyProps {
  status: ExtractionStatus;
  errorMessage: string | null;
}

function ExtractionNotReady({ status, errorMessage }: ExtractionNotReadyProps) {
  const { t } = useTranslation('documents');
  if (status === 'failed') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">
          {t('detail_failed_title')}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {errorMessage || t('detail_failed_subtitle')}
        </p>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      <h2 className="text-base font-semibold">{t('detail_processing_title')}</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {t('detail_processing_subtitle')}
      </p>
    </div>
  );
}
