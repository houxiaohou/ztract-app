import { api } from '@/lib/api';
import type {
  SchemaDraftFromSampleRequest,
  SchemaDraftResponse,
  SchemaRead,
  SchemaReplaceRequest,
  SchemaSampleUploadRequest,
  SchemaSampleUploadResponse,
  SchemaTemplateRead,
  SchemaTemplateSummary,
} from '@/features/schemas/types';

export async function getSchema(projectId: string): Promise<SchemaRead | null> {
  try {
    const { data } = await api.get<SchemaRead>(
      `/projects/${encodeURIComponent(projectId)}/schema`,
    );
    return data;
  } catch (err) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      (err as { status: number }).status === 404
    ) {
      return null;
    }
    throw err;
  }
}

export async function replaceSchema(
  projectId: string,
  payload: SchemaReplaceRequest,
): Promise<SchemaRead> {
  const { data } = await api.put<SchemaRead>(
    `/projects/${encodeURIComponent(projectId)}/schema`,
    payload,
  );
  return data;
}

export async function listSchemaTemplates(): Promise<SchemaTemplateSummary[]> {
  const { data } = await api.get<SchemaTemplateSummary[]>('/schema-templates');
  return data;
}

export async function getSchemaTemplate(key: string): Promise<SchemaTemplateRead> {
  const { data } = await api.get<SchemaTemplateRead>(
    `/schema-templates/${encodeURIComponent(key)}`,
  );
  return data;
}

export async function generateSchemaFromPrompt(
  projectId: string,
  prompt: string,
): Promise<SchemaDraftResponse> {
  const { data } = await api.post<SchemaDraftResponse>(
    `/projects/${encodeURIComponent(projectId)}/schema/draft-from-prompt`,
    { prompt },
  );
  return data;
}

export async function presignSampleUpload(
  projectId: string,
  payload: SchemaSampleUploadRequest,
): Promise<SchemaSampleUploadResponse> {
  const { data } = await api.post<SchemaSampleUploadResponse>(
    `/projects/${encodeURIComponent(projectId)}/schema/sample-upload-presign`,
    payload,
  );
  return data;
}

export async function generateSchemaFromSample(
  projectId: string,
  payload: SchemaDraftFromSampleRequest,
): Promise<SchemaDraftResponse> {
  const { data } = await api.post<SchemaDraftResponse>(
    `/projects/${encodeURIComponent(projectId)}/schema/draft-from-sample`,
    payload,
  );
  return data;
}
