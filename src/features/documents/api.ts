import { api } from '@/lib/api';
import type {
  DocumentCreate,
  DocumentExtractionRead,
  DocumentListFilters,
  DocumentRead,
  PaginatedDocumentExtractions,
  PaginatedDocuments,
  PresignUploadRequest,
  PresignUploadResponse,
  RerunStaleResponse,
  StaleDocumentsCount,
} from '@/features/documents/types';

export async function presignUpload(
  projectId: string,
  payload: PresignUploadRequest,
): Promise<PresignUploadResponse> {
  const { data } = await api.post<PresignUploadResponse>(
    `/projects/${encodeURIComponent(projectId)}/documents/presign`,
    payload,
  );
  return data;
}

export async function registerDocument(
  projectId: string,
  payload: DocumentCreate,
): Promise<DocumentRead> {
  const { data } = await api.post<DocumentRead>(
    `/projects/${encodeURIComponent(projectId)}/documents`,
    payload,
  );
  return data;
}

export async function listDocuments(
  projectId: string,
  params: { page: number; size: number } & DocumentListFilters,
): Promise<PaginatedDocuments> {
  const query: Record<string, unknown> = {
    page: params.page,
    size: params.size,
  };
  if (params.status && params.status.length > 0) {
    query.status = params.status;
  }
  if (typeof params.stale === 'boolean') {
    query.stale = params.stale;
  }
  const { data } = await api.get<PaginatedDocuments>(
    `/projects/${encodeURIComponent(projectId)}/documents`,
    {
      params: query,
      paramsSerializer: (entries) => {
        const usp = new URLSearchParams();
        for (const [key, value] of Object.entries(entries)) {
          if (value === undefined || value === null) continue;
          if (Array.isArray(value)) {
            for (const item of value) {
              usp.append(key, String(item));
            }
          } else {
            usp.append(key, String(value));
          }
        }
        return usp.toString();
      },
    },
  );
  return data;
}

export async function rerunDocument(
  projectId: string,
  documentId: string,
): Promise<DocumentRead> {
  const { data } = await api.post<DocumentRead>(
    `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}/rerun`,
  );
  return data;
}

export async function rerunStaleDocuments(
  projectId: string,
): Promise<RerunStaleResponse> {
  const { data } = await api.post<RerunStaleResponse>(
    `/projects/${encodeURIComponent(projectId)}/documents/rerun-stale`,
  );
  return data;
}

export async function countStaleDocuments(
  projectId: string,
): Promise<StaleDocumentsCount> {
  const { data } = await api.get<StaleDocumentsCount>(
    `/projects/${encodeURIComponent(projectId)}/documents/stale-count`,
  );
  return data;
}

export async function deleteDocument(
  projectId: string,
  documentId: string,
): Promise<void> {
  await api.delete(
    `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`,
  );
}

export async function getDocument(
  projectId: string,
  documentId: string,
): Promise<DocumentRead> {
  const { data } = await api.get<DocumentRead>(
    `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`,
  );
  return data;
}

export async function listDocumentExtractions(
  projectId: string,
  documentId: string,
  params: { page?: number; size?: number } = {},
): Promise<PaginatedDocumentExtractions> {
  const { data } = await api.get<PaginatedDocumentExtractions>(
    `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}/extractions`,
    {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 200,
      },
    },
  );
  return data;
}

export async function getDocumentExtractionById(
  projectId: string,
  documentId: string,
  extractionId: string,
): Promise<DocumentExtractionRead> {
  const { data } = await api.get<DocumentExtractionRead>(
    `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}/extractions/${encodeURIComponent(extractionId)}`,
  );
  return data;
}

export function pageImageUrl(
  projectId: string,
  documentId: string,
  pageNumber: number,
): string {
  return `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}/pages/${pageNumber}/image`;
}

export async function fetchDocumentPageImage(
  projectId: string,
  documentId: string,
  pageNumber: number,
  signal?: AbortSignal,
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    pageImageUrl(projectId, documentId, pageNumber),
    { responseType: 'blob', signal },
  );
  return data;
}

export interface R2PutOptions {
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}

export function putToR2(
  uploadUrl: string,
  file: File,
  options: R2PutOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during R2 upload'));
    xhr.onabort = () => reject(new DOMException('Upload aborted', 'AbortError'));

    if (options.signal) {
      if (options.signal.aborted) {
        xhr.abort();
        return;
      }
      options.signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.send(file);
  });
}
