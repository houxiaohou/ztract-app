import { useTranslation } from 'react-i18next';
import { Loader2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  intlLocale,
  preferredCurrency,
} from '@/features/billing/utils';
import type { TierRead } from '@/features/billing/types';

interface TierCardProps {
  tier: TierRead;
  onBuy: (input: { tier: TierRead; currency: string }) => void;
  busy?: boolean;
  disabled?: boolean;
}

export function TierCard({ tier, onBuy, busy = false, disabled = false }: TierCardProps) {
  const { t, i18n } = useTranslation('billing');

  const currency = preferredCurrency(tier.prices, i18n.language);
  const minorUnits = tier.prices[currency];
  const priceText =
    minorUnits !== undefined
      ? formatCurrency(minorUnits, currency, intlLocale(i18n.language))
      : '—';

  return (
    <Card className="flex h-full flex-col border-border/70 shadow-none transition-colors hover:border-primary/40">
      <CardHeader className="gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{tier.display_name}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            {priceText}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('pack_pages', { count: tier.pages.toLocaleString() })}
        </p>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('pack_validity')}
        </p>
        <Button
          type="button"
          className={cn('w-full')}
          disabled={disabled || busy}
          onClick={() => onBuy({ tier, currency })}
        >
          {busy ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {t('starting_checkout')}
            </>
          ) : (
            t('buy_now')
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
