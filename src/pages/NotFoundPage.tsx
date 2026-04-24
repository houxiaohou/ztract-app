import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const { t } = useTranslation('common');

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('not_found_title')}
        </h1>
        <p className="text-muted-foreground">{t('not_found_subtitle')}</p>
      </div>
      <Button asChild variant="outline">
        <Link to="/">{t('back_home')}</Link>
      </Button>
    </main>
  );
}
