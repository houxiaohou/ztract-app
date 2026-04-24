import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon } from 'lucide-react';

import logoUrl from '@/assets/logo.svg';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export default function HomePage() {
  const { t } = useTranslation('common');
  const { data: user } = useCurrentUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-6 py-24">
      <img
        src={logoUrl}
        alt={t('app_name')}
        className="h-8 w-auto select-none"
        draggable={false}
      />
      <Card className="border-border/70 shadow-none">
        <CardHeader className="gap-3">
          <CardTitle className="text-3xl font-semibold tracking-tight">
            {user ? t('signed_in_as', { email: user.email }) : t('welcome_title')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('welcome_subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" asChild>
            <Link to={user ? '/' : '/auth/sign-in'}>
              {t('get_started')}
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
