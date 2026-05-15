import {
  ARRAY_ITEM_DEFAULT_NAME,
  type SchemaFieldDef,
  type SchemaFieldType,
} from '@/features/schemas/types';

export function createEmptyField(): SchemaFieldDef {
  return {
    name: '',
    type: 'string',
    description: '',
    required: false,
  };
}

export function createEmptyArrayItem(): SchemaFieldDef {
  return {
    name: ARRAY_ITEM_DEFAULT_NAME,
    type: 'string',
    description: '',
    required: false,
  };
}

export function cloneField(field: SchemaFieldDef): SchemaFieldDef {
  return {
    name: field.name,
    type: field.type,
    description: field.description ?? '',
    required: field.required ?? false,
    enum: field.enum ? [...field.enum] : undefined,
    attributes: field.attributes ? field.attributes.map(cloneField) : undefined,
    items: field.items ? cloneField(field.items) : undefined,
  };
}

export function sanitizeFieldForSave(field: SchemaFieldDef): SchemaFieldDef {
  const base: SchemaFieldDef = {
    name: field.name.trim() || ARRAY_ITEM_DEFAULT_NAME,
    type: field.type,
    required: Boolean(field.required),
  };
  const description = field.description?.trim();
  if (description) base.description = description;

  if (field.type === 'enum' && field.enum) {
    base.enum = field.enum.map((option) => option.trim()).filter(Boolean);
  }
  if (field.type === 'object' && field.attributes) {
    base.attributes = field.attributes.map(sanitizeFieldForSave);
  }
  if (field.type === 'array' && field.items) {
    base.items = sanitizeFieldForSave(field.items);
  }
  return base;
}

export function fieldsEqual(
  a: SchemaFieldDef[],
  b: SchemaFieldDef[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, index) => {
    try {
      return (
        JSON.stringify(sanitizeFieldForSave(x)) ===
        JSON.stringify(sanitizeFieldForSave(b[index]))
      );
    } catch {
      return false;
    }
  });
}

export function isContainerType(type: SchemaFieldType): boolean {
  return type === 'object' || type === 'array';
}
