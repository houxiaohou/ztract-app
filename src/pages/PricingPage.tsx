import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircleIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TierCard } from '@/features/billing/components/TierCard';
import { useCheckout, useTiers } from '@/features/billing';
import type { TierRead } from '@/features/billing/types';

const FAQ_KEYS = [
  'no_subscription',
  'validity',
  'unit',
  'file_types',
  'expire',
  'invoice',
] as const;

export default function PricingPage() {
  const { t } = useTranslation('billing');
  const tiersQuery = useTiers();
  const checkout = useCheckout();

  const [buyingKey, setBuyingKey] = useState<string | null>(null);

  const handleBuy = ({ tier, currency }: { tier: TierRead; currency: string }) => {
    setBuyingKey(tier.key);
    toast.loading(t('starting_checkout'), { id: `checkout-${tier.key}` });
    checkout.mutate(
      { tier_key: tier.key, currency },
      {
        onSuccess: ({ checkout_url }) => {
          toast.dismiss(`checkout-${tier.key}`);
          window.location.assign(checkout_url);
        },
        onError: (err) => {
          setBuyingKey(null);
          toast.error(err.message || t('checkout_failed'), {
            id: `checkout-${tier.key}`,
          });
        },
      },
    );
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('pricing_title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t('pricing_subtitle')}
        </p>
      </header>

      {tiersQuery.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
        </div>
      ) : tiersQuery.data && tiersQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiersQuery.data.map((tier, index) => (
            <TierCard
              key={tier.key}
              tier={tier}
              index={index}
              onBuy={handleBuy}
              busy={buyingKey === tier.key && checkout.isPending}
              disabled={buyingKey !== null && buyingKey !== tier.key}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t('pricing_empty')}
        </p>
      )}

      <section className="flex flex-col gap-6 rounded-xl border border-border/70 bg-card p-6 sm:p-8">
        <header className="flex items-start gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-sky-50 ring-1 ring-sky-100">
            <HelpCircleIcon className="size-5 text-sky-500" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight">{t('faq_title')}</h2>
            <p className="text-sm text-muted-foreground">{t('faq_subtitle')}</p>
          </div>
        </header>

        <Accordion type="single" collapsible className="w-full">
          {FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="text-base font-medium">
                {t(`faq_${key}_q`)}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {t(`faq_${key}_a`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </section>
  );
}
