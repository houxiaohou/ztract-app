import { useTranslation } from 'react-i18next';
import {
  BracesIcon,
  BracketsIcon,
  HashIcon,
  ListIcon,
  TagIcon,
  TypeIcon,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SchemaFieldType } from '@/features/schemas/types';

const ICON_MAP: Record<SchemaFieldType, LucideIcon> = {
  string: TypeIcon,
  number: HashIcon,
  integer: HashIcon,
  enum: TagIcon,
  object: BracesIcon,
  array: BracketsIcon,
};

const COLOR_MAP: Record<SchemaFieldType, string> = {
  string: 'text-rose-600',
  number: 'text-indigo-600',
  integer: 'text-indigo-600',
  enum: 'text-amber-600',
  object: 'text-sky-600',
  array: 'text-emerald-600',
};

interface SchemaTypeIconProps {
  type: SchemaFieldType;
  className?: string;
}

export function SchemaTypeIcon({ type, className }: SchemaTypeIconProps) {
  const Icon = ICON_MAP[type] ?? ListIcon;
  return (
    <span
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold uppercase',
        COLOR_MAP[type],
        className,
      )}
      aria-hidden
    >
      <Icon className="size-3.5" />
    </span>
  );
}

interface SchemaTypeLabelProps {
  type: SchemaFieldType;
  innerType?: SchemaFieldType;
}

export function SchemaTypeLabel({ type, innerType }: SchemaTypeLabelProps) {
  const { t } = useTranslation('schemas');
  const base = t(`type_${type}`);
  if (type === 'array' && innerType) {
    return <>{t('type_of', { type: base, inner: t(`type_${innerType}`) })}</>;
  }
  return <>{base}</>;
}
