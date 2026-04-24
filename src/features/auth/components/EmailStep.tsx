import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { useSendOtp } from '@/features/auth/hooks/useSendOtp';
import { emailSchema, type EmailFormValues } from '@/features/auth/schemas';

interface EmailStepProps {
  defaultEmail: string;
  onOtpSent: (email: string) => void;
}

export function EmailStep({ defaultEmail, onOtpSent }: EmailStepProps) {
  const { t } = useTranslation('auth');
  const sendOtp = useSendOtp();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = handleSubmit((values) => {
    sendOtp.mutate(
      { email: values.email },
      {
        onSuccess: () => {
          toast.success(t('otp_sent_toast', { email: values.email }));
          onOtpSent(values.email);
        },
        onError: (error) => {
          toast.error(error.message || t('error_generic'));
        },
      },
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t('email_label')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder={t('email_placeholder')}
            aria-invalid={errors.email ? true : undefined}
            {...register('email')}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!isValid || sendOtp.isPending}
        >
          {sendOtp.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {t('sending')}
            </>
          ) : (
            t('sign_in')
          )}
        </Button>
      </form>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('or_continue_with')}
        </span>
      </div>

      <GoogleSignInButton />

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        <Trans
          ns="auth"
          i18nKey="terms_line"
          components={{
            terms: (
              <a
                href="/terms"
                className="underline underline-offset-2 hover:text-foreground"
              />
            ),
            privacy: (
              <a
                href="/privacy"
                className="underline underline-offset-2 hover:text-foreground"
              />
            ),
          }}
        />
      </p>
    </div>
  );
}
