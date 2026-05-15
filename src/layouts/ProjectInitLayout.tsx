import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon } from 'lucide-react';

import logoUrl from '@/assets/logo.svg';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth/store';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { QuotaBadge } from '@/layouts/QuotaBadge';
import { UserMenu } from '@/layouts/UserMenu';

export function ProjectInitLayout() {
  const { t: tCommon } = useTranslation('common');
  const { t } = useTranslation('schemas');
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  if (!token) {
    return (
      <Navigate to="/auth/sign-in" replace state={{ from: location.pathname }} />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <img
                src={logoUrl}
                alt={tCommon('app_name')}
                className="h-6 w-auto select-none"
                draggable={false}
              />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeftIcon className="size-3.5" aria-hidden />
              {t('init_back_to_projects')}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <QuotaBadge />
            {user ? (
              <UserMenu user={user} />
            ) : userLoading ? (
              <Skeleton className="size-9 rounded-full" />
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
