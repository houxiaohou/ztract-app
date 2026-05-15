import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import {
  countGroupLeaves,
  humanizeKey,
  type CitationGroup,
  type CitationLeaf,
} from '@/features/documents/citations';
import type { ConfidenceLevel } from '@/features/documents/types';

interface ExtractionResultPanelProps {
  root: CitationGroup;
  activeLeafId: string | null;
  onSelectLeaf: (leafId: string) => void;
}

export function ExtractionResultPanel({
  root,
  activeLeafId,
  onSelectLeaf,
}: ExtractionResultPanelProps) {
  const { t } = useTranslation('documents');
  const totalLeaves = useMemo(() => countGroupLeaves(root), [root]);

  if (totalLeaves === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {t('detail_no_extraction')}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{t('detail_extracted_data')}</h2>
        <p className="text-xs text-muted-foreground">
          {t('detail_fields_count', { count: totalLeaves })}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-3">
          {root.leaves.length > 0 ? (
            <li>
              <ul className="flex flex-col">
                {root.leaves.map((leaf) => (
                  <LeafRow
                    key={leaf.id}
                    leaf={leaf}
                    active={leaf.id === activeLeafId}
                    onSelect={() => onSelectLeaf(leaf.id)}
                  />
                ))}
              </ul>
            </li>
          ) : null}
          {root.children.map((group) => (
            <GroupBlock
              key={group.id}
              group={group}
              depth={0}
              activeLeafId={activeLeafId}
              onSelectLeaf={onSelectLeaf}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

interface GroupBlockProps {
  group: CitationGroup;
  depth: number;
  activeLeafId: string | null;
  onSelectLeaf: (leafId: string) => void;
}

function GroupBlock({
  group,
  depth,
  activeLeafId,
  onSelectLeaf,
}: GroupBlockProps) {
  const isArray = group.isArrayItems === true;
  const showHeading = group.label !== '';
  const childCount = isArray ? group.children.length : undefined;

  return (
    <li className="flex flex-col gap-2">
      {showHeading ? (
        <GroupHeading depth={depth} label={group.label} count={childCount} />
      ) : null}
      {group.leaves.length > 0 ? (
        <ul className="flex flex-col">
          {group.leaves.map((leaf) => (
            <LeafRow
              key={leaf.id}
              leaf={leaf}
              active={leaf.id === activeLeafId}
              onSelect={() => onSelectLeaf(leaf.id)}
            />
          ))}
        </ul>
      ) : null}
      {group.children.length > 0 ? (
        isArray ? (
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-muted/10">
            {group.children.map((child) => (
              <li key={child.id} className="px-2 py-2">
                <GroupBody
                  group={child}
                  depth={depth + 1}
                  activeLeafId={activeLeafId}
                  onSelectLeaf={onSelectLeaf}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-2 pl-3">
            {group.children.map((child) => (
              <GroupBlock
                key={child.id}
                group={child}
                depth={depth + 1}
                activeLeafId={activeLeafId}
                onSelectLeaf={onSelectLeaf}
              />
            ))}
          </ul>
        )
      ) : null}
    </li>
  );
}

interface GroupBodyProps {
  group: CitationGroup;
  depth: number;
  activeLeafId: string | null;
  onSelectLeaf: (leafId: string) => void;
}

function GroupBody({ group, depth, activeLeafId, onSelectLeaf }: GroupBodyProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {group.leaves.length > 0 ? (
        <ul className="flex flex-col">
          {group.leaves.map((leaf) => (
            <LeafRow
              key={leaf.id}
              leaf={leaf}
              active={leaf.id === activeLeafId}
              onSelect={() => onSelectLeaf(leaf.id)}
            />
          ))}
        </ul>
      ) : null}
      {group.children.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {group.children.map((child) => (
            <GroupBlock
              key={child.id}
              group={child}
              depth={depth + 1}
              activeLeafId={activeLeafId}
              onSelectLeaf={onSelectLeaf}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

interface GroupHeadingProps {
  depth: number;
  label: string;
  count?: number;
}

function GroupHeading({ depth, label, count }: GroupHeadingProps) {
  const common = 'flex items-center gap-1.5 px-2';
  const content = (
    <>
      <span>{humanizeKey(label)}</span>
      {typeof count === 'number' ? (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-normal text-muted-foreground">
          {count}
        </span>
      ) : null}
    </>
  );
  if (depth === 0) {
    return (
      <h3 className={cn(common, 'text-xs font-semibold uppercase tracking-wide text-muted-foreground')}>
        {content}
      </h3>
    );
  }
  return (
    <h4 className={cn(common, 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground')}>
      {content}
    </h4>
  );
}

interface LeafRowProps {
  leaf: CitationLeaf;
  active: boolean;
  onSelect: () => void;
}

function LeafRow({ leaf, active, onSelect }: LeafRowProps) {
  const rowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active && rowRef.current) {
      rowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [active]);

  const hasLabel = Boolean(leaf.label);

  return (
    <li>
      <button
        ref={rowRef}
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-left transition-colors',
          active ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/60',
          leaf.regions.length === 0 && 'opacity-75',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {hasLabel ? (
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {humanizeKey(leaf.label)}
            </span>
          ) : null}
          <span
            className={cn(
              'break-words text-sm',
              active ? 'font-semibold text-foreground' : 'text-foreground',
              !leaf.value && 'italic text-muted-foreground',
            )}
          >
            {leaf.value || '—'}
          </span>
        </div>
        {leaf.confidenceLevel ? (
          <ConfidenceBadge level={leaf.confidenceLevel} />
        ) : null}
      </button>
    </li>
  );
}

const LEVEL_STYLES: Record<ConfidenceLevel, string> = {
  high: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  low: 'border-destructive/30 bg-destructive/10 text-destructive',
};

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const { t } = useTranslation('documents');
  return (
    <span
      className={cn(
        'mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase',
        LEVEL_STYLES[level],
      )}
    >
      {t(`detail_confidence_${level}`)}
    </span>
  );
}
