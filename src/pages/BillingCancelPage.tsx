import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { XCircleIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

const REDIRECT_DELAY_MS = 2500;

export default function BillingCancelPage() {
  const { t } = useTranslation('billing');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(
      () => navigate('/pricing', { replace: true }),
      REDIRECT_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <XCircleIcon className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('cancel_title')}</h1>
        <p className="text-sm text-muted-foreground">{t('cancel_subtitle')}</p>
      </div>
      <Button asChild variant="outline">
        <Link to="/pricing" replace>
          {t('cancel_back_to_pricing')}
        </Link>
      </Button>
    </section>
  );
}
