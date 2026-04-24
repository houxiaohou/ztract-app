import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/features/auth/components/GoogleIcon';
import { redirectToGoogle } from '@/features/auth/google';

export function GoogleSignInButton() {
  const { t } = useTranslation('auth');
  const [redirecting, setRedirecting] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleClick = () => {
    if (!clientId) {
      toast.warning(t('google_not_configured'));
      return;
    }
    setRedirecting(true);
    redirectToGoogle(clientId);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      onClick={handleClick}
      disabled={redirecting}
    >
      {redirecting ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          {t('google_signing_in')}
        </>
      ) : (
        <>
          <GoogleIcon className="size-4" />
          {t('continue_with_google')}
        </>
      )}
    </Button>
  );
}
