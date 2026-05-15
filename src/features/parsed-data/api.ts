import { api } from '@/lib/api';
import type {
  ExportDownloadResponse,
  ExportJobCreate,
  ExportJobRead,
  PaginatedExportJobs,
  PaginatedParsedData,
  ParsedDataListParams,
} from '@/features/parsed-data/types';

export async function listParsedData(
  projectId: string,
  params: ParsedDataListParams,
): Promise<PaginatedParsedData> {
  const query: Record<string, unknown> = {
    page: params.page,
    size: params.size,
  };
  if (params.parsed_from) query.parsed_from = params.parsed_from;
  if (params.parsed_to) query.parsed_to = params.parsed_to;
  const { data } = await api.get<PaginatedParsedData>(
    `/projects/${encodeURIComponent(projectId)}/parsed-data`,
    { params: query },
  );
  return data;
}

export async function createExportJob(
  projectId: string,
  payload: ExportJobCreate,
): Promise<ExportJobRead> {
  const { data } = await api.post<ExportJobRead>(
    `/projects/${encodeURIComponent(projectId)}/parsed-data/exports`,
    payload,
  );
  return data;
}

export async function listExportJobs(
  projectId: string,
  params: { page: number; size: number },
): Promise<PaginatedExportJobs> {
  const { data } = await api.get<PaginatedExportJobs>(
    `/projects/${encodeURIComponent(projectId)}/parsed-data/exports`,
    { params },
  );
  return data;
}

export async function getExportJob(
  projectId: string,
  jobId: string,
): Promise<ExportJobRead> {
  const { data } = await api.get<ExportJobRead>(
    `/projects/${encodeURIComponent(projectId)}/parsed-data/exports/${encodeURIComponent(jobId)}`,
  );
  return data;
}

export async function deleteExportJob(
  projectId: string,
  jobId: string,
): Promise<void> {
  await api.delete(
    `/projects/${encodeURIComponent(projectId)}/parsed-data/exports/${encodeURIComponent(jobId)}`,
  );
}

export async function getExportDownloadUrl(
  projectId: string,
  jobId: string,
): Promise<string> {
  const { data } = await api.get<ExportDownloadResponse>(
    `/projects/${encodeURIComponent(projectId)}/parsed-data/exports/${encodeURIComponent(jobId)}/download`,
  );
  return data.download_url;
}
