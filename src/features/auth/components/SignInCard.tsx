import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { EmailStep } from '@/features/auth/components/EmailStep';
import { OtpStep } from '@/features/auth/components/OtpStep';

type Step = 'email' | 'otp';

export function SignInCard() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');

  const goHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      {step === 'email' ? (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('welcome_title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('welcome_subtitle')}</p>
          </div>
          <EmailStep
            defaultEmail={email}
            onOtpSent={(value) => {
              setEmail(value);
              setStep('otp');
            }}
          />
        </>
      ) : (
        <OtpStep
          email={email}
          onBack={() => setStep('email')}
          onVerified={goHome}
        />
      )}
    </div>
  );
}
