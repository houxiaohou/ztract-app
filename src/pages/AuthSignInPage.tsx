import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import logoUrl from '@/assets/logo.svg';
import { SignInCard, Testimonial } from '@/features/auth';
import { useAuthStore } from '@/features/auth/store';

export default function AuthSignInPage() {
  const { t } = useTranslation('common');
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[2fr_3fr]">
      <section className="flex flex-col px-6 py-8 sm:px-10 sm:py-10">
        <header>
          <img
            src={logoUrl}
            alt={t('app_name')}
            className="h-7 w-auto select-none"
            draggable={false}
          />
        </header>
        <div className="flex flex-1 items-center justify-center">
          <SignInCard />
        </div>
      </section>
      <aside className="hidden items-center justify-center border-l border-border bg-muted/30 px-10 py-16 lg:flex">
        <Testimonial />
      </aside>
    </div>
  );
}
