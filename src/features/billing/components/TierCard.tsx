import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CrownIcon,
  GemIcon,
  Loader2Icon,
  RocketIcon,
  SparklesIcon,
  TrophyIcon,
  ZapIcon,
} from 'lucide-react';

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
  index: number;
  onBuy: (input: { tier: TierRead; currency: string }) => void;
  busy?: boolean;
  disabled?: boolean;
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface TierStyle {
  icon: IconType;
  iconClass: string;
  badgeClass: string;
}

const TIER_STYLES: TierStyle[] = [
  {
    icon: SparklesIcon,
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-50 ring-1 ring-amber-100',
  },
  {
    icon: ZapIcon,
    iconClass: 'text-sky-500',
    badgeClass: 'bg-sky-50 ring-1 ring-sky-100',
  },
  {
    icon: RocketIcon,
    iconClass: 'text-emerald-500',
    badgeClass: 'bg-emerald-50 ring-1 ring-emerald-100',
  },
  {
    icon: GemIcon,
    iconClass: 'text-violet-500',
    badgeClass: 'bg-violet-50 ring-1 ring-violet-100',
  },
  {
    icon: CrownIcon,
    iconClass: 'text-rose-500',
    badgeClass: 'bg-rose-50 ring-1 ring-rose-100',
  },
  {
    icon: TrophyIcon,
    iconClass: 'text-indigo-500',
    badgeClass: 'bg-indigo-50 ring-1 ring-indigo-100',
  },
];

function tierStyle(index: number): TierStyle {
  return TIER_STYLES[index % TIER_STYLES.length];
}

export function TierCard({
  tier,
  index,
  onBuy,
  busy = false,
  disabled = false,
}: TierCardProps) {
  const { t, i18n } = useTranslation('billing');

  const currency = preferredCurrency(tier.prices, i18n.language);
  const minorUnits = tier.prices[currency];
  const priceText =
    minorUnits !== undefined
      ? formatCurrency(minorUnits, currency, intlLocale(i18n.language))
      : '—';

  const style = tierStyle(index);
  const Icon = style.icon;
  const isRecommended = tier.recommend;

  return (
    <Card
      className={cn(
        'relative flex h-full flex-col transition-all duration-200',
        'border-border/70 shadow-none hover:border-foreground/20 hover:shadow-sm',
        isRecommended &&
          'border-primary/60 shadow-md ring-1 ring-primary/20 lg:scale-[1.02]',
      )}
    >
      {isRecommended ? (
        <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
          <SparklesIcon className="size-3" aria-hidden />
          {t('pricing_recommended_badge')}
        </span>
      ) : null}

      <CardHeader className="gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-lg',
              style.badgeClass,
            )}
          >
            <Icon className={cn('size-5', style.iconClass)} aria-hidden />
          </span>
          <h3 className="text-lg font-medium tracking-tight">
            {tier.display_name}
          </h3>
        </div>
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
          variant={isRecommended ? 'default' : 'outline'}
          className={cn(
            'w-full cursor-pointer',
            isRecommended && 'shadow-sm',
          )}
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
