import type {
  CitationLeafRaw,
  CitationNode,
  CitationRegion,
  ConfidenceLevel,
  ExtractionPage,
} from '@/features/documents/types';

export interface CitationLeaf {
  id: string;
  path: string[];
  label: string;
  value: string;
  rawValue: unknown;
  confidence: number | null;
  confidenceLevel: ConfidenceLevel | null;
  regions: CitationRegion[];
}

export interface CitationGroup {
  id: string;
  label: string;
  path: string[];
  leaves: CitationLeaf[];
  children: CitationGroup[];
  isArrayItems?: boolean;
}

export interface FlattenedCitations {
  leaves: CitationLeaf[];
  root: CitationGroup;
}

function isLeaf(node: CitationNode | unknown): node is CitationLeafRaw {
  if (node === null || typeof node !== 'object') return false;
  return (
    'bounding_regions' in (node as Record<string, unknown>) ||
    ('value' in (node as Record<string, unknown>) &&
      typeof (node as { value: unknown }).value !== 'object')
  );
}

function formatValue(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') {
    return Number.isInteger(raw) ? raw.toString() : raw.toLocaleString();
  }
  if (typeof raw === 'boolean') return raw ? 'true' : 'false';
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

function coerceConfidenceLevel(value: unknown): ConfidenceLevel | null {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return null;
}

function toLeaf(raw: CitationLeafRaw, path: string[]): CitationLeaf {
  return {
    id: path.join('.'),
    path,
    label: path.at(-1) ?? '',
    rawValue: raw.value,
    value: formatValue(raw.value),
    confidence: typeof raw.llm_confidence === 'number' ? raw.llm_confidence : null,
    confidenceLevel: coerceConfidenceLevel(raw.llm_confidence_level),
    regions: Array.isArray(raw.bounding_regions) ? raw.bounding_regions : [],
  };
}

function isArrayLike(
  node: unknown,
): node is unknown[] | Record<string, CitationNode> {
  if (Array.isArray(node)) return true;
  if (node === null || typeof node !== 'object') return false;
  const keys = Object.keys(node as Record<string, unknown>);
  if (keys.length === 0) return false;
  return keys.every((key, index) => key === String(index));
}

function walkNode(
  node: unknown,
  path: string[],
  leaves: CitationLeaf[],
): CitationGroup {
  const group: CitationGroup = {
    id: path.length === 0 ? '__root__' : path.join('.'),
    label: path.at(-1) ?? '',
    path: [...path],
    leaves: [],
    children: [],
  };

  if (isArrayLike(node)) {
    group.isArrayItems = true;
    const items = Array.isArray(node)
      ? node
      : Object.keys(node as Record<string, unknown>)
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => (node as Record<string, unknown>)[key]);
    items.forEach((item, index) => {
      const itemPath = [...path, String(index)];
      if (isLeaf(item)) {
        const leaf = toLeaf(item, itemPath);
        leaf.label = '';
        leaves.push(leaf);
        group.children.push({
          id: itemPath.join('.'),
          label: '',
          path: itemPath,
          leaves: [leaf],
          children: [],
        });
      } else if (item && typeof item === 'object') {
        const sub = walkNode(item, itemPath, leaves);
        if (sub.leaves.length > 0 || sub.children.length > 0) {
          sub.label = '';
          group.children.push(sub);
        }
      }
    });
    return group;
  }

  for (const [key, child] of Object.entries(node as Record<string, CitationNode>)) {
    const nextPath = [...path, key];
    if (isLeaf(child)) {
      const leaf = toLeaf(child, nextPath);
      leaves.push(leaf);
      group.leaves.push(leaf);
    } else if (child && typeof child === 'object') {
      const subGroup = walkNode(child, nextPath, leaves);
      if (subGroup.leaves.length > 0 || subGroup.children.length > 0) {
        group.children.push(subGroup);
      }
    }
  }

  return group;
}

export function flattenCitations(
  citations: Record<string, CitationNode> | undefined,
): FlattenedCitations {
  const leaves: CitationLeaf[] = [];
  const root = walkNode(citations ?? {}, [], leaves);
  return { leaves, root };
}

export function countGroupLeaves(group: CitationGroup): number {
  let total = group.leaves.length;
  for (const child of group.children) {
    total += countGroupLeaves(child);
  }
  return total;
}

export function buildPageIndex(
  pages: ExtractionPage[] | undefined,
): Map<number, ExtractionPage> {
  const map = new Map<number, ExtractionPage>();
  if (!pages) return map;
  for (const page of pages) {
    map.set(page.page_number, page);
  }
  return map;
}

export function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
