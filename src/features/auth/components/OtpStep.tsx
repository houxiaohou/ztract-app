import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { useSendOtp } from '@/features/auth/hooks/useSendOtp';
import { useVerifyOtp } from '@/features/auth/hooks/useVerifyOtp';
import { otpSchema, type OtpFormValues } from '@/features/auth/schemas';

const RESEND_COOLDOWN_SECONDS = 30;

interface OtpStepProps {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}

export function OtpStep({ email, onBack, onVerified }: OtpStepProps) {
  const { t } = useTranslation('auth');
  const verifyOtp = useVerifyOtp();
  const resendOtp = useSendOtp();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    mode: 'onChange',
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = handleSubmit((values) => {
    verifyOtp.mutate(
      { email, code: values.code },
      {
        onSuccess: () => {
          toast.success(t('signed_in_toast'));
          onVerified();
        },
        onError: (error) => {
          toast.error(error.message || t('error_generic'));
          reset({ code: '' });
        },
      },
    );
  });

  const handleResend = () => {
    resendOtp.mutate(
      { email },
      {
        onSuccess: () => {
          toast.success(t('otp_sent_toast', { email }));
          setCooldown(RESEND_COOLDOWN_SECONDS);
        },
        onError: (error) => {
          toast.error(error.message || t('error_generic'));
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">{t('otp_title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('otp_subtitle', { email })}
        </p>
      </div>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="otp">{t('otp_label')}</Label>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <InputOTP
                id="otp"
                maxLength={6}
                autoFocus
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                containerClassName="w-full"
              >
                <InputOTPGroup className="w-full">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-12 flex-1 text-lg" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            )}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!isValid || verifyOtp.isPending}
        >
          {verifyOtp.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {t('verifying')}
            </>
          ) : (
            t('verify')
          )}
        </Button>
      </form>

      <div className="flex flex-col gap-3 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resendOtp.isPending}
          className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cooldown > 0 ? t('resend_in', { seconds: cooldown }) : t('resend_otp')}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          {t('use_different_email')}
        </button>
      </div>
    </div>
  );
}
