import type { ExtractionMode } from '@/features/documents/types';

export interface ProjectRead {
  id: string;
  name: string;
  description: string | null;
  file_count: number;
  schema_version: number | null;
  extraction_mode: ExtractionMode;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
}

export interface ProjectUpdate {
  name?: string | null;
  description?: string | null;
  extraction_mode?: ExtractionMode | null;
}

export type ProjectSort =
  | 'created_at_desc'
  | 'created_at_asc'
  | 'updated_at_desc'
  | 'updated_at_asc'
  | 'name_asc'
  | 'name_desc';

export interface PaginatedProjects {
  items: ProjectRead[];
  page: number;
  size: number;
  total: number;
}

export interface ListProjectsParams {
  page: number;
  size: number;
  q?: string;
  sort?: ProjectSort;
}
