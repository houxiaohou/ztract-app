import type { ExtractionMode } from '@/features/documents/types';

export type SchemaFieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'enum'
  | 'object'
  | 'array';

export interface SchemaFieldDef {
  name: string;
  type: SchemaFieldType;
  description?: string | null;
  required?: boolean;
  enum?: string[] | null;
  attributes?: SchemaFieldDef[] | null;
  items?: SchemaFieldDef | null;
}

export interface SchemaRead {
  id: string;
  version: number;
  fields: SchemaFieldDef[];
  created_at: string;
}

export interface SchemaReplaceRequest {
  fields: SchemaFieldDef[];
  extraction_mode?: ExtractionMode | null;
}

export const SCHEMA_FIELD_TYPES: SchemaFieldType[] = [
  'string',
  'number',
  'integer',
  'enum',
  'object',
  'array',
];

export const SCHEMA_ARRAY_ITEM_TYPES: SchemaFieldType[] = [
  'string',
  'number',
  'integer',
  'enum',
  'object',
];

export const SCHEMA_NESTING_LIMIT = 3;

export const ARRAY_ITEM_DEFAULT_NAME = 'item';

export interface SchemaTemplateSummary {
  key: string;
  display_name: string;
  description: string;
}

export interface SchemaTemplateRead extends SchemaTemplateSummary {
  fields: SchemaFieldDef[];
}

export interface SchemaDraftResponse {
  fields: SchemaFieldDef[];
  chosen_extraction_mode?: ExtractionMode;
}

export interface SchemaDraftFromPromptRequest {
  prompt: string;
}

export interface SchemaSampleUploadRequest {
  file_name: string;
  mime_type: string;
  size_bytes: number;
}

export interface SchemaSampleUploadResponse {
  upload_url: string;
  r2_key: string;
  expires_in: number;
}

export interface SchemaDraftFromSampleRequest {
  r2_key: string;
  mime_type: string;
  extraction_mode: ExtractionMode;
  page_number?: number | null;
  prompt?: string | null;
}
