import { useTranslation } from 'react-i18next';
import {
  CalendarClockIcon,
  CalendarCheckIcon,
  DownloadIcon,
  Loader2Icon,
  PackageIcon,
  ZapIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { parseServerDate } from '@/lib/date';
import {
  formatCurrency,
  intlLocale,
} from '@/features/billing/utils';
import type { QuotaPackRead } from '@/features/billing/types';

interface PackListItemProps {
  pack: QuotaPackRead;
  onInvoice: (pack: QuotaPackRead) => void;
  busy?: boolean;
}

function formatDate(iso: string | null, locale?: string): string {
  if (!iso) return '—';
  const date = parseServerDate(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function packLabel(
  pack: QuotaPackRead,
  t: (key: string) => string,
): string {
  if (pack.display_name) return pack.display_name;
  if (pack.source === 'gift') return t('orders_source_signup_gift');
  return pack.source;
}

export function PackListItem({ pack, onInvoice, busy = false }: PackListItemProps) {
  const { t, i18n } = useTranslation('billing');
  const locale = intlLocale(i18n.language);

  const isGift = pack.source === 'gift';
  const paidAt = pack.paid_at ?? pack.created_at;

  return (
    <li className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-border sm:flex-row sm:items-center sm:gap-6 sm:p-5">
      <div className="flex flex-1 flex-col gap-1 sm:gap-1.5">
        <div className="flex items-center gap-2">
          <PackageIcon className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium capitalize text-foreground">
            {packLabel(pack, t)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-0.5">
          <span className="inline-flex items-center gap-1">
            <CalendarCheckIcon className="size-3.5" aria-hidden />
            <span>
              {t('orders_paid_at')}: {formatDate(paidAt, locale)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarClockIcon className="size-3.5" aria-hidden />
            <span>
              {t('orders_expires_at')}: {formatDate(pack.expires_at, locale)}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-foreground sm:w-28">
        <ZapIcon className="size-4 fill-primary text-primary" aria-hidden />
        <span className="tabular-nums">
          {pack.pages_total.toLocaleString(locale)}
        </span>
        <span className="sr-only">{t('orders_col_pages')}</span>
      </div>

      <div className="text-sm font-medium tabular-nums text-foreground sm:w-24 sm:text-right">
        {isGift
          ? t('orders_gift_price')
          : formatCurrency(pack.price_minor_units, pack.currency, locale)}
      </div>

      <div className="flex sm:w-40 sm:justify-end">
        {isGift ? null : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => onInvoice(pack)}
            className="cursor-pointer"
          >
            {busy ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {t('orders_invoice_generating')}
              </>
            ) : (
              <>
                <DownloadIcon className="size-4" />
                {t('orders_invoice_download')}
              </>
            )}
          </Button>
        )}
      </div>
    </li>
  );
}
