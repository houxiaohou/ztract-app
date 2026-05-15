import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { TierCard } from '@/features/billing/components/TierCard';
import { useCheckout, useTiers } from '@/features/billing';
import type { TierRead } from '@/features/billing/types';

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
    <section className="flex max-w-6xl mx-auto flex-col gap-8">
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiersQuery.data.map((tier) => (
            <TierCard
              key={tier.key}
              tier={tier}
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
    </section>
  );
}
