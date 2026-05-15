import { useTranslation } from 'react-i18next';
import {
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ExportJobStatus } from '@/features/parsed-data/types';

const STYLES: Record<ExportJobStatus, string> = {
  pending: 'border-border bg-muted/60 text-muted-foreground',
  processing: 'border-primary/20 bg-primary/10 text-primary',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
  failed: 'border-destructive/20 bg-destructive/10 text-destructive',
  expired: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
};

interface ExportStatusBadgeProps {
  status: ExportJobStatus;
  className?: string;
}

export function ExportStatusBadge({ status, className }: ExportStatusBadgeProps) {
  const { t } = useTranslation('parsed-data');

  const icon = (() => {
    switch (status) {
      case 'pending':
        return <CircleDashedIcon className="size-3" aria-hidden />;
      case 'processing':
        return <Loader2Icon className="size-3 animate-spin" aria-hidden />;
      case 'success':
        return <CheckCircle2Icon className="size-3" aria-hidden />;
      case 'failed':
        return <XCircleIcon className="size-3" aria-hidden />;
      case 'expired':
        return <ClockIcon className="size-3" aria-hidden />;
    }
  })();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        STYLES[status],
        className,
      )}
    >
      {icon}
      {t(`exports_status_${status}`)}
    </span>
  );
}
