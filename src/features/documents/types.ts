export type ExtractionStatus = 'pending' | 'processing' | 'success' | 'failed';
export type DocumentStatus = ExtractionStatus | 'partial';
export type ExtractionMode = 'document' | 'per_page';

export interface ExtractionsSummary {
  pending: number;
  processing: number;
  success: number;
  failed: number;
  total: number;
}

export interface DocumentRead {
  id: string;
  project_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  status: DocumentStatus;
  page_count: number | null;
  extraction_mode: ExtractionMode;
  extractions_summary: ExtractionsSummary;
  created_at: string;
  updated_at: string;
  download_url: string | null;
}

export interface DocumentCreate {
  r2_key: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  page_count?: number | null;
}

export interface PaginatedDocuments {
  items: DocumentRead[];
  page: number;
  size: number;
  total: number;
}

export interface StaleDocumentsCount {
  stale_documents: number;
  estimated_pages: number;
}

export interface RerunStaleResponse {
  queued: number;
  skipped_in_flight: number;
}

export interface DocumentListFilters {
  status?: ExtractionStatus[];
  stale?: boolean;
}

// A document is stale if any of its extractions is stale: schema_version
// is null or older than the project's. Since extraction-level versions
// aren't on the list payload, derive from `success`/`failed`/`partial`
// rolls and the document's own schema_version is no longer present — we
// keep the helper but it now reads from extractions_summary heuristics
// only via the dedicated stale filter on the API.
export function hasStaleSignal(
  summary: ExtractionsSummary | undefined,
): boolean {
  if (!summary) return false;
  return summary.success > 0 || summary.failed > 0;
}

export interface PresignUploadRequest {
  file_name: string;
  mime_type: string;
  size_bytes: number;
}

export interface PresignUploadResponse {
  upload_url: string;
  r2_key: string;
  expires_in: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CitationRegion {
  text: string;
  position: number[];
  page_number: number;
}

export interface CitationLeafRaw {
  value: unknown;
  llm_confidence?: number;
  llm_confidence_level?: ConfidenceLevel;
  bounding_regions?: CitationRegion[];
}

export type CitationNode = CitationLeafRaw | { [key: string]: CitationNode };

export interface ExtractionPage {
  page_number: number;
  width: number;
  height: number;
  angle: number;
  image_id: string;
  status: string;
  durations?: number;
}

export interface ExtractionResultBody {
  pages: ExtractionPage[];
  citations?: Record<string, CitationNode>;
  extracted_schema?: unknown;
  usage?: Record<string, number>;
  stamps?: unknown[];
  [key: string]: unknown;
}

export interface DocumentExtractionRead {
  id: string;
  document_id: string;
  page_number: number | null;
  status: ExtractionStatus;
  schema_version: number | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  result: {
    result?: ExtractionResultBody;
    [key: string]: unknown;
  } | null;
}

export interface PaginatedDocumentExtractions {
  items: DocumentExtractionRead[];
  page: number;
  size: number;
  total: number;
}
