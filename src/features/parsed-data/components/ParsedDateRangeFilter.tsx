import { useTranslation } from 'react-i18next';

import { DateRangePicker, type DateRangeValue } from '@/components/DateRangePicker';

export type { DateRangeValue };

interface ParsedDateRangeFilterProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
}

export function ParsedDateRangeFilter({
  value,
  onChange,
}: ParsedDateRangeFilterProps) {
  const { t } = useTranslation('parsed-data');

  const summary = (() => {
    if (value.from && value.to)
      return t('filter_date_range', { from: value.from, to: value.to });
    if (value.from) return t('filter_date_from_only', { from: value.from });
    if (value.to) return t('filter_date_to_only', { to: value.to });
    return t('filter_date_all');
  })();

  return (
    <DateRangePicker
      value={value}
      onChange={onChange}
      applyLabel={t('filter_apply')}
      clearLabel={t('filter_clear')}
      placeholder={t('filter_date_all')}
      summary={summary}
      triggerLabel={t('filter_date_label')}
      disableFuture
    />
  );
}
