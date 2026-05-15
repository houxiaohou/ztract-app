import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EnumOptionsEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
}

export function EnumOptionsEditor({ options, onChange }: EnumOptionsEditorProps) {
  const { t } = useTranslation('schemas');
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');

  const addOption = () => {
    const value = draft.trim();
    if (!value) return;
    if (options.includes(value)) {
      setDraft('');
      return;
    }
    onChange([...options, value]);
    setDraft('');
    inputRef.current?.focus();
  };

  const removeOption = (value: string) => {
    onChange(options.filter((option) => option !== value));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addOption();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {options.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => (
            <span
              key={option}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs"
            >
              {option}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                aria-label={t('enum_options_remove', { value: option })}
                onClick={() => removeOption(option)}
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('enum_options_placeholder')}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          {t('enum_options_add')}
        </Button>
      </div>
    </div>
  );
}
