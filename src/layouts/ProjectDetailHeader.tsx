import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { QuotaBadge } from '@/layouts/QuotaBadge';
import { UserMenu } from '@/layouts/UserMenu';

const SUB_ROUTE_TITLE_KEYS: Record<string, string> = {
  documents: 'detail_nav_documents',
  'parsed-data': 'detail_nav_parsed_data',
  exports: 'detail_nav_exports',
  schema: 'detail_nav_schema',
};

function useSubRouteTitleKey(): string | null {
  const { pathname } = useLocation();
  const segment = pathname.split('/').filter(Boolean).at(-1) ?? '';
  return SUB_ROUTE_TITLE_KEYS[segment] ?? null;
}

export function ProjectDetailHeader() {
  const { t } = useTranslation('projects');
  const titleKey = useSubRouteTitleKey();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          {titleKey ? (
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
              {t(titleKey)}
            </h1>
          ) : null}
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
  );
}
