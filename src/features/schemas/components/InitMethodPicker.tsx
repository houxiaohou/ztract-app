import { useTranslation } from 'react-i18next';
import {
  BlocksIcon,
  FileTextIcon,
  SparklesIcon,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

export type InitMethod = 'template' | 'prompt' | 'upload';

interface InitMethodPickerProps {
  onPick: (method: InitMethod) => void;
}

interface MethodTile {
  method: InitMethod;
  titleKey: string;
  bodyKey: string;
  icon: LucideIcon;
  accent: string;
}

const METHODS: MethodTile[] = [
  {
    method: 'template',
    titleKey: 'init_method_template_title',
    bodyKey: 'init_method_template_body',
    icon: BlocksIcon,
    accent: 'bg-sky-50 text-sky-600',
  },
  {
    method: 'prompt',
    titleKey: 'init_method_prompt_title',
    bodyKey: 'init_method_prompt_body',
    icon: SparklesIcon,
    accent: 'bg-amber-50 text-amber-600',
  },
  {
    method: 'upload',
    titleKey: 'init_method_upload_title',
    bodyKey: 'init_method_upload_body',
    icon: FileTextIcon,
    accent: 'bg-emerald-50 text-emerald-600',
  },
];

export function InitMethodPicker({ onPick }: InitMethodPickerProps) {
  const { t } = useTranslation('schemas');
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {METHODS.map(({ method, titleKey, bodyKey, icon: Icon, accent }) => (
        <button
          key={method}
          type="button"
          onClick={() => onPick(method)}
          className={cn(
            'group flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-5 text-left transition-all',
            'hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <span
            className={cn(
              'inline-flex size-10 items-center justify-center rounded-md',
              accent,
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-base font-semibold text-foreground">
              {t(titleKey)}
            </span>
            <span className="text-sm text-muted-foreground">{t(bodyKey)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
