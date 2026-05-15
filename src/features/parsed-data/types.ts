import type { ExtractionMode } from '@/features/documents/types';
import type { SchemaFieldDef } from '@/features/schemas/types';

export interface ParsedDataItem {
  extraction_id: string;
  document_id: string;
  document_name: string;
  page_number: number | null;
  parsed_time: string;
  page_count: number | null;
  schema_version: number | null;
  is_stale: boolean;
  data: Record<string, unknown> | null;
}

export interface PaginatedParsedData {
  items: ParsedDataItem[];
  page: number;
  size: number;
  total: number;
  current_schema_version: number | null;
  current_schema_fields: SchemaFieldDef[];
  extraction_mode?: ExtractionMode;
}

export interface ParsedDataListParams {
  page: number;
  size: number;
  parsed_from?: string | null;
  parsed_to?: string | null;
}

export type ExportFormat = 'xlsx' | 'csv' | 'json';

export type ExportJobStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'expired';

export interface ExportFilter {
  parsed_from?: string | null;
  parsed_to?: string | null;
}

export interface ExportJobCreate {
  format: ExportFormat;
  filter?: ExportFilter | null;
}

export interface ExportJobRead {
  id: string;
  project_id: string | null;
  project_name: string;
  format: ExportFormat;
  status: ExportJobStatus;
  filter_snapshot: Record<string, unknown> | null;
  row_count: number | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  expires_at: string | null;
  created_at: string;
  download_url?: string | null;
}

export interface PaginatedExportJobs {
  items: ExportJobRead[];
  page: number;
  size: number;
  total: number;
}

export interface ExportDownloadResponse {
  download_url: string;
}
