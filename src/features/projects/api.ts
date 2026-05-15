import { api } from '@/lib/api';
import type {
  ListProjectsParams,
  PaginatedProjects,
  ProjectCreate,
  ProjectRead,
  ProjectUpdate,
} from '@/features/projects/types';

export async function listProjects(
  params: ListProjectsParams,
): Promise<PaginatedProjects> {
  const { data } = await api.get<PaginatedProjects>('/projects', {
    params: {
      page: params.page,
      size: params.size,
      q: params.q?.trim() || undefined,
      sort: params.sort,
    },
  });
  return data;
}

export async function getProject(projectId: string): Promise<ProjectRead> {
  const { data } = await api.get<ProjectRead>(
    `/projects/${encodeURIComponent(projectId)}`,
  );
  return data;
}

export async function createProject(payload: ProjectCreate): Promise<ProjectRead> {
  const { data } = await api.post<ProjectRead>('/projects', payload);
  return data;
}

export async function updateProject(
  projectId: string,
  payload: ProjectUpdate,
): Promise<ProjectRead> {
  const { data } = await api.patch<ProjectRead>(
    `/projects/${encodeURIComponent(projectId)}`,
    payload,
  );
  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${encodeURIComponent(projectId)}`);
}
