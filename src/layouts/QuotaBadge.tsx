import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ZapIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuota } from '@/features/billing';

export function QuotaBadge() {
  const { t } = useTranslation('common');
  const { data, isLoading } = useQuota();

  if (isLoading && !data) {
    return <Skeleton className="h-9 w-20 rounded-full" />;
  }

  const pages = data?.pages_available ?? 0;
  const label = t('nav_quota_label', { count: pages });

  return (
    <Link
      to="/pricing"
      aria-label={label}
      title={label}
      className={cn(
        'group inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors',
        'hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <ZapIcon
        className="size-4 fill-primary text-primary transition-transform group-hover:scale-110"
        aria-hidden
      />
      <span className="tabular-nums">{pages.toLocaleString()}</span>
    </Link>
  );
}
