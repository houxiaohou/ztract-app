import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, Loader2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { isPackPaid, quotaQueryKey, useCheckoutStatus } from '@/features/billing';

const REDIRECT_DELAY_MS = 2500;

export default function BillingSuccessPage() {
  const { t } = useTranslation('billing');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sessionId = params.get('session_id');
  const { data, isError, error } = useCheckoutStatus(sessionId);

  const paid = useMemo(() => Boolean(data && isPackPaid(data)), [data]);

  useEffect(() => {
    if (!paid) return;
    void queryClient.invalidateQueries({ queryKey: quotaQueryKey });
    void queryClient.invalidateQueries({ queryKey: ['billing', 'packs'] });
    const timer = window.setTimeout(() => navigate('/', { replace: true }), REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [paid, navigate, queryClient]);

  if (!sessionId) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('success_failed_title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('success_missing_session')}
        </p>
        <Button asChild variant="outline">
          <Link to="/pricing">{t('cancel_back_to_pricing')}</Link>
        </Button>
      </section>
    );
  }

  if (paid) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircleIcon className="size-8 text-primary" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('success_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('success_subtitle')}</p>
        </div>
        <Button asChild>
          <Link to="/" replace>
            {t('success_go_home')}
          </Link>
        </Button>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('success_failed_title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {error?.message || t('success_failed_subtitle')}
        </p>
        <Button asChild variant="outline">
          <Link to="/orders">{t('success_view_orders')}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <Loader2Icon className="size-8 animate-spin text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('success_confirming_title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('success_confirming_subtitle')}
        </p>
      </div>
    </section>
  );
}
