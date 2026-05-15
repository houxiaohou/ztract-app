import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { GiftIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/features/auth/store';
import { claimSignupGift } from '@/features/billing/api';
import { quotaQueryKey } from '@/features/billing/hooks/useQuota';
import { intlLocale } from '@/features/billing/utils';
import type { QuotaPackRead } from '@/features/billing/types';

const MARKER_PREFIX = 'ztract.signup_gift.';

function markerKey(token: string): string {
  return `${MARKER_PREFIX}${token.slice(-16)}`;
}

// Module-level dedupe so StrictMode's mount → unmount → remount doesn't fire
// the request twice (and doesn't strand the response in a cancelled closure).
const inFlightTokens = new Set<string>();

export function SignupGiftHandler() {
  const { t, i18n } = useTranslation('billing');
  const locale = intlLocale(i18n.language);
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  const [pack, setPack] = useState<QuotaPackRead | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (typeof window === 'undefined') return;
    const key = markerKey(token);
    if (window.sessionStorage.getItem(key) === '1') return;
    if (inFlightTokens.has(key)) return;
    inFlightTokens.add(key);

    claimSignupGift()
      .then((response) => {
        window.sessionStorage.setItem(key, '1');
        if (response.granted && response.pack) {
          setPack(response.pack);
          setOpen(true);
          void queryClient.invalidateQueries({ queryKey: quotaQueryKey });
        }
      })
      .catch(() => {
        // Network blip — allow retry on next mount/login. Backend is
        // idempotent so a redundant call is harmless.
        inFlightTokens.delete(key);
      });
  }, [token, queryClient]);

  if (!pack) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GiftIcon className="size-5 text-primary" aria-hidden />
            {t('signup_gift_title')}
          </DialogTitle>
          <DialogDescription>
            {t('signup_gift_description', {
              pages: pack.pages_total.toLocaleString(locale),
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            {t('signup_gift_ok')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
