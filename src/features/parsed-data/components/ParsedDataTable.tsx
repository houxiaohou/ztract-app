import { useMemo } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ParsedDataCell } from '@/features/parsed-data/components/ParsedDataCell';
import type { ParsedDataItem } from '@/features/parsed-data/types';
import type { SchemaFieldDef } from '@/features/schemas/types';

interface ParsedDataTableProps {
  items: ParsedDataItem[];
  fields: SchemaFieldDef[];
}

export function ParsedDataTable({ items, fields }: ParsedDataTableProps) {
  const columns = useMemo(() => fields, [fields]);

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card font-mono text-[10px]">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((field) => (
              <TableHead
                key={field.name}
                className="min-w-[10rem] text-[11px]"
                title={field.description ?? undefined}
              >
                {field.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.extraction_id} className="align-top">
              {columns.map((field) => {
                const value = item.data
                  ? (item.data as Record<string, unknown>)[field.name]
                  : undefined;
                return (
                  <TableCell key={field.name} className="py-2 align-top text-xs">
                    <ParsedDataCell
                      field={field}
                      value={value}
                      pathLabel={field.name}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
