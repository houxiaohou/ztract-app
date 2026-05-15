import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  SchemaTypeIcon,
  SchemaTypeLabel,
} from '@/features/schemas/components/SchemaTypeIcon';
import type { SchemaFieldDef } from '@/features/schemas/types';

interface SchemaTableProps {
  fields: SchemaFieldDef[];
  selected: Set<number>;
  onToggle: (index: number) => void;
  onToggleAll: (checked: boolean) => void;
  onEditField: (index: number) => void;
}

export function SchemaTable({
  fields,
  selected,
  onToggle,
  onToggleAll,
  onEditField,
}: SchemaTableProps) {
  const { t } = useTranslation('schemas');
  const allSelected = fields.length > 0 && selected.size === fields.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(value) => onToggleAll(value === true)}
                aria-label="toggle all"
              />
            </TableHead>
            <TableHead>{t('col_name')}</TableHead>
            <TableHead className="w-48">{t('col_type')}</TableHead>
            <TableHead>{t('col_description')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => (
            <FieldRows
              key={index}
              field={field}
              selected={selected.has(index)}
              onToggle={() => onToggle(index)}
              onEdit={() => onEditField(index)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface FieldRowsProps {
  field: SchemaFieldDef;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

function FieldRows({ field, selected, onToggle, onEdit }: FieldRowsProps) {
  return (
    <>
      <TableRow
        data-state={selected ? 'selected' : undefined}
        className="group cursor-pointer"
      >
        <TableCell className="w-10">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle()}
            aria-label={`toggle ${field.name}`}
            onClick={(event) => event.stopPropagation()}
          />
        </TableCell>
        <TableCell onClick={onEdit}>
          <FieldNameCell field={field} />
        </TableCell>
        <TableCell onClick={onEdit} className="text-sm text-muted-foreground">
          <SchemaTypeLabel
            type={field.type}
            innerType={field.type === 'array' ? field.items?.type : undefined}
          />
        </TableCell>
        <TableCell
          onClick={onEdit}
          className="max-w-md truncate text-sm text-muted-foreground"
          title={field.description ?? ''}
        >
          {field.description || '—'}
        </TableCell>
      </TableRow>
      <NestedRows field={field} depth={1} />
    </>
  );
}

interface NestedRowsProps {
  field: SchemaFieldDef;
  depth: number;
}

function NestedRows({ field, depth }: NestedRowsProps) {
  if (field.type === 'object') {
    const attributes = field.attributes ?? [];
    return (
      <>
        {attributes.map((attr, index) => (
          <NestedRow key={`obj-${depth}-${index}`} field={attr} depth={depth} />
        ))}
      </>
    );
  }
  if (field.type === 'array' && field.items) {
    if (field.items.type === 'object') {
      const attributes = field.items.attributes ?? [];
      return (
        <>
          {attributes.map((attr, index) => (
            <NestedRow key={`arr-${depth}-${index}`} field={attr} depth={depth} />
          ))}
        </>
      );
    }
  }
  return null;
}

interface NestedRowProps {
  field: SchemaFieldDef;
  depth: number;
}

function NestedRow({ field, depth }: NestedRowProps) {
  return (
    <>
      <TableRow className="bg-muted/20 hover:bg-muted/30">
        <TableCell />
        <TableCell>
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            <SchemaTypeIcon type={field.type} className="opacity-70" />
            <span
              className={cn(
                'font-mono text-sm',
                field.name ? 'text-muted-foreground' : 'italic text-muted-foreground/70',
              )}
            >
              {field.name || 'unnamed'}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          <SchemaTypeLabel
            type={field.type}
            innerType={field.type === 'array' ? field.items?.type : undefined}
          />
        </TableCell>
        <TableCell
          className="max-w-md truncate text-xs text-muted-foreground"
          title={field.description ?? ''}
        >
          {field.description || '—'}
        </TableCell>
      </TableRow>
      <NestedRows field={field} depth={depth + 1} />
    </>
  );
}

interface FieldNameCellProps {
  field: SchemaFieldDef;
}

function FieldNameCell({ field }: FieldNameCellProps) {
  return (
    <div className="flex items-center gap-2">
      <SchemaTypeIcon type={field.type} />
      <span className="font-mono text-sm font-semibold text-foreground">
        {field.name || '—'}
      </span>
      {field.required ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-primary">
          *required
        </span>
      ) : null}
    </div>
  );
}
