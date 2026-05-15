import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import logoUrl from '@/assets/logo.svg';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { QuotaBadge } from '@/layouts/QuotaBadge';
import { UserMenu } from '@/layouts/UserMenu';

export function TopNav() {
  const { t } = useTranslation('common');
  const { data: user, isLoading: userLoading } = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
        >
          <img
            src={logoUrl}
            alt={t('app_name')}
            className="h-6 w-auto select-none"
            draggable={false}
          />
        </Link>

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
