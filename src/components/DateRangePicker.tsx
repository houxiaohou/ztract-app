import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon, FilterXIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  from: string | null;
  to: string | null;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  applyLabel: string;
  clearLabel: string;
  placeholder: string;
  summary?: string;
  triggerLabel?: string;
  align?: 'start' | 'end' | 'center';
  className?: string;
  buttonSize?: 'sm' | 'default';
  disableFuture?: boolean;
  fullWidth?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  applyLabel,
  clearLabel,
  placeholder,
  summary,
  triggerLabel,
  align = 'start',
  className,
  buttonSize = 'sm',
  disableFuture = false,
  fullWidth = false,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(() =>
    isoRangeToDateRange(value),
  );
  const [lastOpen, setLastOpen] = useState(false);

  if (open && !lastOpen) {
    setLastOpen(true);
    setDraft(isoRangeToDateRange(value));
  } else if (!open && lastOpen) {
    setLastOpen(false);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const disabledMatcher = disableFuture ? { after: today } : undefined;

  const active = Boolean(value.from || value.to);
  const hasDraft = Boolean(draft?.from || draft?.to);

  const apply = () => {
    onChange({ from: toIso(draft?.from), to: toIso(draft?.to) });
    setOpen(false);
  };

  const clear = () => {
    setDraft(undefined);
    onChange({ from: null, to: null });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={buttonSize}
          className={cn(
            'cursor-pointer gap-1.5 font-normal',
            fullWidth && 'w-full justify-start',
            active && 'border-primary/40 bg-primary/5',
            className,
          )}
        >
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          {triggerLabel ? (
            <span className="text-muted-foreground">{triggerLabel}:</span>
          ) : null}
          <span
            className={cn(
              'truncate',
              active ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {summary ?? placeholder}
          </span>
          <ChevronDownIcon
            className={cn(
              'size-3.5 text-muted-foreground',
              fullWidth && 'ml-auto',
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={draft}
          onSelect={setDraft}
          disabled={disabledMatcher}
          captionLayout="dropdown"
          autoFocus
        />
        <div className="flex items-center justify-between gap-2 border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={!active && !hasDraft}
            className="cursor-pointer gap-1.5 text-muted-foreground"
          >
            <FilterXIcon className="size-3.5" />
            {clearLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={apply}
            className="cursor-pointer"
          >
            {applyLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function isoRangeToDateRange(value: DateRangeValue): DateRange | undefined {
  if (!value.from && !value.to) return undefined;
  return {
    from: fromIso(value.from),
    to: fromIso(value.to),
  };
}

function toIso(date: Date | undefined): string | null {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIso(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}
