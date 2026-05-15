import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PackListItem } from '@/features/billing/components/PackListItem';
import { useInvoice, usePacks } from '@/features/billing';
import type { QuotaPackRead } from '@/features/billing/types';

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const { t } = useTranslation('billing');
  const [page, setPage] = useState(1);
  const packsQuery = usePacks(page, PAGE_SIZE);
  const invoice = useInvoice();
  const [invoicePackId, setInvoicePackId] = useState<string | null>(null);

  const totalPages = packsQuery.data
    ? Math.max(1, Math.ceil(packsQuery.data.total / PAGE_SIZE))
    : 1;

  const handleInvoice = (pack: QuotaPackRead) => {
    if (pack.stripe_invoice_url) {
      window.open(pack.stripe_invoice_url, '_blank', 'noopener,noreferrer');
      return;
    }
    setInvoicePackId(pack.id);
    invoice.mutate(pack.id, {
      onSuccess: ({ invoice_url }) => {
        setInvoicePackId(null);
        window.open(invoice_url, '_blank', 'noopener,noreferrer');
      },
      onError: (err) => {
        setInvoicePackId(null);
        toast.error(err.message || t('orders_invoice_failed'));
      },
    });
  };

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <section className="flex max-w-4xl mx-auto flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('orders_title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t('orders_subtitle')}
        </p>
      </header>

      {packsQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
        </div>
      ) : packsQuery.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {packsQuery.error.message || t('orders_load_failed')}
          </p>
          <Button variant="outline" size="sm" onClick={() => packsQuery.refetch()}>
            {t('orders_retry')}
          </Button>
        </div>
      ) : packsQuery.data && packsQuery.data.items.length > 0 ? (
        <>
          <ul className="flex flex-col gap-3">
            {packsQuery.data.items.map((pack) => (
              <PackListItem
                key={pack.id}
                pack={pack}
                onInvoice={handleInvoice}
                busy={invoicePackId === pack.id && invoice.isPending}
              />
            ))}
          </ul>

          <nav
            className="flex items-center justify-between gap-4 pt-2"
            aria-label="Pagination"
          >
            <span className="text-xs text-muted-foreground">
              {t('orders_pagination', { page, pages: totalPages })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrev || packsQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeftIcon className="size-4" />
                {t('orders_prev')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext || packsQuery.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('orders_next')}
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </nav>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-12 text-center">
          <h2 className="text-base font-medium text-foreground">
            {t('orders_empty_title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('orders_empty_subtitle')}</p>
        </div>
      )}
    </section>
  );
}
