import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/store';
import { useProject } from '@/features/projects';
import { useSchema } from '@/features/schemas';
import { ProjectDetailHeader } from '@/layouts/ProjectDetailHeader';
import { ProjectSidebar } from '@/layouts/ProjectSidebar';

export function ProjectDetailLayout() {
  const { t } = useTranslation('projects');
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();

  const projectQuery = useProject(projectId);
  const schemaQuery = useSchema(projectId);

  if (!token) {
    return (
      <Navigate to="/auth/sign-in" replace state={{ from: location.pathname }} />
    );
  }

  const notFound = projectQuery.isError && projectQuery.error.status === 404;
  const needsInit =
    projectQuery.isSuccess &&
    schemaQuery.isSuccess &&
    (!schemaQuery.data || schemaQuery.data.fields.length === 0);

  if (needsInit && projectId) {
    return <Navigate to={`/projects/${projectId}/init`} replace />;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
        <ProjectSidebar project={projectQuery.data} isLoading={projectQuery.isLoading} />
      </aside>
      <div className="flex min-w-0 flex-col">
        <ProjectDetailHeader />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-8">
          {notFound ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
              <h2 className="text-xl font-semibold tracking-tight">
                {t('detail_not_found_title')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('detail_not_found_subtitle')}
              </p>
              <Button asChild variant="outline">
                <Link to="/">{t('detail_back_home')}</Link>
              </Button>
            </div>
          ) : projectQuery.isError ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {projectQuery.error.message || t('detail_load_failed')}
              </p>
              <Button variant="outline" size="sm" onClick={() => projectQuery.refetch()}>
                {t('detail_retry')}
              </Button>
            </div>
          ) : (
            <Outlet context={{ project: projectQuery.data }} />
          )}
        </main>
      </div>
    </div>
  );
}
