import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { EnumOptionsEditor } from '@/features/schemas/components/EnumOptionsEditor';
import {
  SchemaTypeIcon,
  SchemaTypeLabel,
} from '@/features/schemas/components/SchemaTypeIcon';
import {
  SCHEMA_ARRAY_ITEM_TYPES,
  SCHEMA_FIELD_TYPES,
  SCHEMA_NESTING_LIMIT,
  type SchemaFieldDef,
  type SchemaFieldType,
} from '@/features/schemas/types';
import {
  cloneField,
  createEmptyArrayItem,
  createEmptyField,
} from '@/features/schemas/utils';

type PathStep = number | 'attributes' | 'items';

interface SchemaFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialField: SchemaFieldDef;
  existingSiblingNames: string[];
  mode: 'create' | 'edit';
  onSave: (field: SchemaFieldDef) => void;
}

interface FrameError {
  name?: string;
  description?: string;
  enum?: string;
  attributes?: string;
  items?: string;
}

function getNodeAtPath(root: SchemaFieldDef, path: PathStep[]): SchemaFieldDef {
  let current: unknown = root;
  for (const step of path) {
    if (step === 'items') {
      current = (current as SchemaFieldDef).items;
    } else if (step === 'attributes') {
      current = (current as { attributes: SchemaFieldDef[] | null }).attributes;
    } else {
      current = (current as SchemaFieldDef[])[step];
    }
  }
  return current as SchemaFieldDef;
}

function updateAtPath(
  root: SchemaFieldDef,
  path: PathStep[],
  updater: (node: unknown) => unknown,
): SchemaFieldDef {
  if (path.length === 0) {
    return updater(root) as SchemaFieldDef;
  }
  const [head, ...rest] = path;
  if (head === 'items') {
    const field = root as SchemaFieldDef;
    const nextItems = updateAtPath(
      (field.items ?? createEmptyArrayItem()) as SchemaFieldDef,
      rest,
      updater,
    );
    return { ...field, items: nextItems };
  }
  if (head === 'attributes') {
    const field = root as SchemaFieldDef;
    const nextAttrs = updateAtPath(
      field.attributes as unknown as SchemaFieldDef,
      rest,
      updater,
    );
    return { ...field, attributes: nextAttrs as unknown as SchemaFieldDef[] };
  }
  const list = root as unknown as SchemaFieldDef[];
  const nextAtIndex = updateAtPath(list[head], rest, updater);
  const clone = [...list];
  clone[head] = nextAtIndex;
  return clone as unknown as SchemaFieldDef;
}

function siblingNamesAtPath(
  root: SchemaFieldDef,
  path: PathStep[],
): string[] {
  if (path.length === 0) return [];
  const last = path.at(-1);
  if (typeof last !== 'number') return [];
  const parentPath = path.slice(0, -1);
  let current: unknown = root;
  for (const step of parentPath) {
    if (step === 'items') current = (current as SchemaFieldDef).items;
    else if (step === 'attributes') {
      current = (current as { attributes: SchemaFieldDef[] | null }).attributes;
    } else current = (current as SchemaFieldDef[])[step];
  }
  const siblings = current as SchemaFieldDef[];
  if (!Array.isArray(siblings)) return [];
  return siblings.filter((_, idx) => idx !== last).map((s) => s.name.trim());
}

function depthOfPath(path: PathStep[]): number {
  let depth = 0;
  for (const step of path) {
    if (step === 'items' || step === 'attributes') depth += 1;
  }
  return depth;
}

function isArrayItemFrame(path: PathStep[]): boolean {
  return path.at(-1) === 'items';
}

export function SchemaFieldDialog({
  open,
  onOpenChange,
  initialField,
  existingSiblingNames,
  mode,
  onSave,
}: SchemaFieldDialogProps) {
  const { t } = useTranslation('schemas');

  const [draft, setDraft] = useState<SchemaFieldDef>(() => cloneField(initialField));
  const [stack, setStack] = useState<PathStep[][]>([[]]);
  const [errors, setErrors] = useState<FrameError>({});
  const [lastInitial, setLastInitial] = useState(initialField);

  if (initialField !== lastInitial) {
    setLastInitial(initialField);
    setDraft(cloneField(initialField));
    setStack([[]]);
    setErrors({});
  }

  const currentPath = useMemo(() => stack.at(-1) ?? [], [stack]);
  const currentNode = getNodeAtPath(draft, currentPath);
  const depth = depthOfPath(currentPath);
  const isItemFrame = isArrayItemFrame(currentPath);

  const siblingNames = useMemo(() => {
    if (currentPath.length === 0) {
      return existingSiblingNames.map((name) => name.trim());
    }
    return siblingNamesAtPath(draft, currentPath);
  }, [draft, currentPath, existingSiblingNames]);

  const updateCurrent = (patch: {
    name?: string;
    description?: string | null;
    required?: boolean;
    enum?: string[] | null;
  }) => {
    setDraft((d) =>
      updateAtPath(d, currentPath, (node) => ({
        ...(node as Record<string, unknown>),
        ...patch,
      })),
    );
  };

  const changeType = (type: SchemaFieldType) => {
    setDraft((d) =>
      updateAtPath(d, currentPath, (node) => {
        const base = { ...(node as Record<string, unknown>) };
        base.type = type;
        if (type !== 'enum') delete base.enum;
        else if (!Array.isArray(base.enum) || base.enum === null) base.enum = [];
        if (type !== 'object') delete base.attributes;
        else if (!Array.isArray(base.attributes)) base.attributes = [];
        if (type !== 'array') delete base.items;
        else if (!base.items) base.items = createEmptyArrayItem();
        return base;
      }),
    );
    setErrors({});
  };

  const addAttribute = () => {
    setDraft((d) =>
      updateAtPath(d, currentPath, (node) => {
        const n = node as Record<string, unknown>;
        const attributes = (Array.isArray(n.attributes)
          ? [...(n.attributes as SchemaFieldDef[])]
          : []) as SchemaFieldDef[];
        attributes.push(createEmptyField());
        return { ...n, attributes };
      }),
    );
    const newIndex = (currentNode.attributes ?? []).length;
    setStack((s) => [...s, [...currentPath, 'attributes', newIndex]]);
    setErrors({});
  };

  const editAttribute = (index: number) => {
    setStack((s) => [...s, [...currentPath, 'attributes', index]]);
    setErrors({});
  };

  const removeAttribute = (index: number) => {
    setDraft((d) =>
      updateAtPath(d, currentPath, (node) => {
        const n = node as Record<string, unknown>;
        const attributes = Array.isArray(n.attributes)
          ? (n.attributes as SchemaFieldDef[]).filter((_, i) => i !== index)
          : [];
        return { ...n, attributes };
      }),
    );
  };

  const drillIntoArrayItem = () => {
    setDraft((d) =>
      updateAtPath(d, currentPath, (node) => {
        const n = node as Record<string, unknown>;
        if (!n.items) n.items = createEmptyArrayItem();
        return n;
      }),
    );
    setStack((s) => [...s, [...currentPath, 'items']]);
    setErrors({});
  };

  const validateNode = (
    node: SchemaFieldDef,
    siblings: string[],
    requireName: boolean,
  ): FrameError | null => {
    const err: FrameError = {};
    if (requireName) {
      const name = node.name.trim();
      if (!name) err.name = t('field_name_required');
      else if (name.length > 64) err.name = t('field_name_too_long');
      else if (siblings.includes(name)) err.name = t('field_name_duplicate');
    }
    if ((node.description ?? '').length > 500) {
      err.description = t('description_too_long');
    }
    if (node.type === 'enum') {
      const opts = (node.enum ?? []).map((o) => o.trim()).filter(Boolean);
      if (opts.length === 0) err.enum = t('enum_options_empty');
    }
    if (node.type === 'object') {
      const attrs = node.attributes ?? [];
      if (attrs.length === 0) err.attributes = t('object_attributes_empty');
    }
    if (node.type === 'array' && !node.items) {
      err.items = t('object_attributes_empty');
    }
    return Object.keys(err).length > 0 ? err : null;
  };

  const validateCurrent = (): FrameError | null => {
    return validateNode(currentNode, siblingNames, !isItemFrame);
  };

  const validateTreeRecursive = (
    node: SchemaFieldDef,
    siblings: string[],
    isItem: boolean,
  ): FrameError | null => {
    const local = validateNode(node, siblings, !isItem);
    if (local) return local;
    if (node.type === 'object') {
      const seen: string[] = [];
      for (const attr of node.attributes ?? []) {
        const e = validateTreeRecursive(attr, seen, false);
        if (e) return e;
        seen.push(attr.name.trim());
      }
    }
    if (node.type === 'array' && node.items) {
      const e = validateTreeRecursive(node.items, [], true);
      if (e) return e;
    }
    return null;
  };

  const handleDone = () => {
    const err = validateCurrent();
    if (err) {
      setErrors(err);
      return;
    }
    if (stack.length > 1) {
      setStack((s) => s.slice(0, -1));
      setErrors({});
      return;
    }
    const full = validateTreeRecursive(
      draft,
      existingSiblingNames.map((n) => n.trim()),
      false,
    );
    if (full) {
      setErrors(full);
      return;
    }
    onSave(cloneField(draft));
    onOpenChange(false);
  };

  const handleBack = () => {
    setStack((s) => s.slice(0, -1));
    setErrors({});
  };

  const title = (() => {
    if (isItemFrame) return t('dialog_title_array_item');
    if (stack.length > 1) {
      return mode === 'create'
        ? t('dialog_title_new_attribute')
        : t('dialog_title_edit_attribute');
    }
    return mode === 'create' ? t('dialog_title_new') : t('dialog_title_edit');
  })();

  const availableFieldTypes = (): SchemaFieldType[] => {
    if (isItemFrame) return SCHEMA_ARRAY_ITEM_TYPES;
    if (depth >= SCHEMA_NESTING_LIMIT - 1) {
      return SCHEMA_FIELD_TYPES.filter(
        (type) => type !== 'object' && type !== 'array',
      );
    }
    return SCHEMA_FIELD_TYPES;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            {stack.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="-ml-2 h-auto px-2 text-muted-foreground"
              >
                <ArrowLeftIcon className="size-4" />
                {t('dialog_back')}
              </Button>
            ) : (
              <span />
            )}
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('field_type_label')}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {availableFieldTypes().map((type) => {
                const selected = currentNode.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => changeType(type)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                      selected
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-foreground hover:bg-muted',
                    )}
                  >
                    <SchemaTypeIcon
                      type={type}
                      className={selected ? 'text-background' : undefined}
                    />
                    <SchemaTypeLabel type={type} />
                  </button>
                );
              })}
            </div>
            {depth >= SCHEMA_NESTING_LIMIT - 1 && !isItemFrame ? (
              <p className="text-xs text-muted-foreground">
                {t('nesting_limit_hint', { limit: SCHEMA_NESTING_LIMIT })}
              </p>
            ) : null}
          </div>

          {currentNode.type === 'object' ? (
            <HelpCallout
              title={t('object_help_title')}
              body={t('object_help_body')}
            />
          ) : currentNode.type === 'array' ? (
            <HelpCallout
              title={t('array_help_title')}
              body={t('array_help_body')}
            />
          ) : null}

          {!isItemFrame ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="schema-field-name">{t('field_name_label')}</Label>
              <Input
                id="schema-field-name"
                autoFocus
                autoComplete="off"
                placeholder={t('field_name_placeholder')}
                value={currentNode.name}
                onChange={(event) => updateCurrent({ name: event.target.value })}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? (
                <p className="text-xs text-destructive">{errors.name}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="schema-field-desc">{t('description_label')}</Label>
            <Textarea
              id="schema-field-desc"
              rows={3}
              placeholder={t('description_placeholder')}
              value={currentNode.description ?? ''}
              onChange={(event) =>
                updateCurrent({ description: event.target.value })
              }
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description}</p>
            ) : null}
          </div>

          {!isItemFrame ? (
            <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{t('required_label')}</span>
                <span className="text-xs text-muted-foreground">
                  {t('required_hint')}
                </span>
              </div>
              <Switch
                checked={currentNode.required ?? false}
                onCheckedChange={(value) => updateCurrent({ required: value })}
              />
            </div>
          ) : null}

          {currentNode.type === 'enum' ? (
            <div className="flex flex-col gap-2">
              <Label>{t('enum_options_label')}</Label>
              <EnumOptionsEditor
                options={currentNode.enum ?? []}
                onChange={(options) => updateCurrent({ enum: options })}
              />
              {errors.enum ? (
                <p className="text-xs text-destructive">{errors.enum}</p>
              ) : null}
            </div>
          ) : null}

          {currentNode.type === 'object' ? (
            <AttributesSection
              attributes={currentNode.attributes ?? []}
              onAdd={addAttribute}
              onEdit={editAttribute}
              onRemove={removeAttribute}
              error={errors.attributes}
            />
          ) : null}

          {currentNode.type === 'array' ? (
            <ArrayItemSection
              item={currentNode.items ?? null}
              onEdit={drillIntoArrayItem}
            />
          ) : null}
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('dialog_cancel')}
          </Button>
          <Button type="button" onClick={handleDone}>
            {t('dialog_done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface HelpCalloutProps {
  title: string;
  body: string;
}

function HelpCallout({ title, body }: HelpCalloutProps) {
  return (
    <div className="flex gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs">
      <InfoIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-muted-foreground">{body}</span>
      </div>
    </div>
  );
}

interface AttributesSectionProps {
  attributes: SchemaFieldDef[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  error?: string;
}

function AttributesSection({
  attributes,
  onAdd,
  onEdit,
  onRemove,
  error,
}: AttributesSectionProps) {
  const { t } = useTranslation('schemas');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>
          {t('object_attributes_label')}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            ({attributes.length})
          </span>
        </Label>
      </div>
      {attributes.length > 0 ? (
        <ul className="flex flex-col gap-1 rounded-md border border-border">
          {attributes.map((attr, index) => (
            <li
              key={index}
              className="flex items-center gap-2 border-b border-border px-3 py-2 last:border-b-0"
            >
              <SchemaTypeIcon type={attr.type} />
              <span
                className={cn(
                  'flex-1 truncate font-mono text-sm',
                  attr.name ? 'text-foreground' : 'italic text-muted-foreground',
                )}
              >
                {attr.name || 'unnamed'}
              </span>
              <span className="text-xs text-muted-foreground">
                <SchemaTypeLabel type={attr.type} />
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(index)}
                aria-label={t('edit_attribute')}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                aria-label={t('remove_attribute')}
              >
                <Trash2Icon className="size-4 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="self-start"
      >
        <PlusIcon className="size-4" />
        {t('add_attribute')}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

interface ArrayItemSectionProps {
  item: SchemaFieldDef | null;
  onEdit: () => void;
}

function ArrayItemSection({ item, onEdit }: ArrayItemSectionProps) {
  const { t } = useTranslation('schemas');
  return (
    <div className="flex flex-col gap-2">
      <Label>{t('array_item_type_label')}</Label>
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
      >
        {item ? (
          <>
            <SchemaTypeIcon type={item.type} />
            <span className="flex-1 text-foreground">
              <SchemaTypeLabel type={item.type} />
            </span>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </button>
    </div>
  );
}
