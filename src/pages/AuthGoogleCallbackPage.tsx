import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { googleLogin } from '@/features/auth/api';
import { OAUTH_STATE_KEY } from '@/features/auth/google';
import { useAuthStore } from '@/features/auth/store';

export default function AuthGoogleCallbackPage() {
  const { t } = useTranslation('auth');

  const [idToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('id_token');
    const state = params.get('state');
    const expected = sessionStorage.getItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    return token && state && state === expected ? token : null;
  });

  const [apiError, setApiError] = useState<string | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || !idToken) return;
    firedRef.current = true;

    googleLogin({ id_token: idToken })
      .then((token) => {
        useAuthStore.getState().setSession(token);
        window.location.replace('/');
      })
      .catch((err: Error) => {
        setApiError(err.message || t('google_callback_error_body'));
      });
  }, [idToken, t]);

  const errorMessage = !idToken ? t('google_callback_error_missing') : apiError;

  if (errorMessage) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {t('google_callback_error_title')}
          </h1>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        <Button asChild>
          <Link to="/auth/sign-in">{t('try_again')}</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
      <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {t('google_callback_title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('google_callback_subtitle')}
        </p>
      </div>
    </main>
  );
}
