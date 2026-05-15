import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, FilterXIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ExtractionStatus } from '@/features/documents/types';

export type FreshnessFilter = 'all' | 'fresh' | 'stale';

interface DocumentFiltersProps {
  statusFilter: ExtractionStatus[];
  onStatusFilterChange: (next: ExtractionStatus[]) => void;
  freshness: FreshnessFilter;
  onFreshnessChange: (next: FreshnessFilter) => void;
  disableFreshness?: boolean;
  onClear: () => void;
}

const STATUS_VALUES: ExtractionStatus[] = [
  'pending',
  'processing',
  'success',
  'failed',
];

export function DocumentFilters({
  statusFilter,
  onStatusFilterChange,
  freshness,
  onFreshnessChange,
  disableFreshness,
  onClear,
}: DocumentFiltersProps) {
  const { t } = useTranslation('documents');

  const toggleStatus = (value: ExtractionStatus) => {
    if (statusFilter.includes(value)) {
      onStatusFilterChange(statusFilter.filter((s) => s !== value));
    } else {
      onStatusFilterChange([...statusFilter, value]);
    }
  };

  const statusSummary =
    statusFilter.length === 0
      ? t('filter_status_all')
      : statusFilter.map((s) => t(`status_${s}`)).join(', ');

  const freshnessSummary =
    freshness === 'all'
      ? t('filter_freshness_all')
      : freshness === 'fresh'
        ? t('filter_freshness_fresh')
        : t('filter_freshness_stale');

  const hasActiveFilters =
    statusFilter.length > 0 || freshness !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'cursor-pointer gap-1.5',
              statusFilter.length > 0 && 'border-primary/40 bg-primary/5',
            )}
          >
            <span className="text-muted-foreground">
              {t('filter_status_label')}:
            </span>
            <span className="max-w-[160px] truncate text-foreground">
              {statusSummary}
            </span>
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel>{t('filter_status_label')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_VALUES.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={statusFilter.includes(status)}
              onCheckedChange={() => toggleStatus(status)}
              onSelect={(event) => event.preventDefault()}
            >
              {t(`status_${status}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disableFreshness}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disableFreshness}
            className={cn(
              'cursor-pointer gap-1.5',
              freshness !== 'all' && 'border-primary/40 bg-primary/5',
            )}
          >
            <span className="text-muted-foreground">
              {t('filter_freshness_label')}:
            </span>
            <span className="max-w-[200px] truncate text-foreground">
              {freshnessSummary}
            </span>
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>
            {t('filter_freshness_label')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={freshness}
            onValueChange={(value) =>
              onFreshnessChange(value as FreshnessFilter)
            }
          >
            <DropdownMenuRadioItem value="all">
              {t('filter_freshness_all')}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="fresh">
              {t('filter_freshness_fresh')}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="stale">
              {t('filter_freshness_stale')}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="cursor-pointer gap-1.5 text-muted-foreground"
          onClick={onClear}
        >
          <FilterXIcon className="size-3.5" />
          {t('filter_clear')}
        </Button>
      ) : null}
    </div>
  );
}
