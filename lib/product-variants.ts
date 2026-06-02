/*
 * Shared types + helpers for the dynamic ("mini-AliExpress") variant system.
 *
 * Storage model
 * -------------
 *   `products.metadata.options` (jsonb)
 *     [
 *       { name: 'Color', kind: 'color', values: [{ value: 'Red', hex: '#EF4444', imageUrl?: string }, ...] },
 *       { name: 'Size',  kind: 'text',  values: [{ value: 'S' }, { value: 'M' }, ...] },
 *       ...
 *     ]
 *   `product_variants` row
 *     - option1 / option2 / option3 mirror the chosen value for axis 0 / 1 / 2 (in axis display order)
 *     - metadata.options_values: ordered array of the selected values (canonical)
 *     - metadata.color_hex: kept in sync when the first matching "color" axis is present (back-compat)
 *     - image_url, sku, price, compare_at_price, quantity, barcode
 *
 * Back-compat
 * -----------
 * If a legacy product has no `metadata.options`, we infer axes from the existing variants:
 *   - if any variant has option2, axes = [{name:'Color', kind:'color', values from option2 + color_hex}, {name:'Size', values from option1}]
 *   - else axes = [{name:'Option', values from option1}]
 *
 * The rest of the app (storefront PDP + admin form) interacts with the variants only
 * through this module so we have a single source of truth.
 */

export type OptionKind = 'color' | 'text';

export interface OptionValue {
  value: string;
  hex?: string;
  imageUrl?: string;
}

export interface OptionAxis {
  name: string;
  kind: OptionKind;
  values: OptionValue[];
}

export interface VariantRow {
  id?: string;
  /** Joined display label, e.g. "Red / Large" */
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  imageUrl: string;
  /** One entry per axis (same order as the axes array on the product) */
  optionsValues: string[];
}

export interface ParsedVariants {
  axes: OptionAxis[];
  rows: VariantRow[];
}

// ─── Colour helpers ─────────────────────────────────────────────────────────

const NAMED_COLOR_HEX: Record<string, string> = {
  black: '#000000', white: '#FFFFFF', red: '#EF4444', blue: '#3B82F6',
  navy: '#1E3A5F', green: '#22C55E', yellow: '#EAB308', orange: '#F97316',
  pink: '#EC4899', purple: '#A855F7', brown: '#92400E', beige: '#D4C5A9',
  grey: '#6B7280', gray: '#6B7280', cream: '#FFFDD0', teal: '#14B8A6',
  maroon: '#800000', coral: '#FF7F50', burgundy: '#800020', olive: '#808000',
  tan: '#D2B48C', khaki: '#C3B091', charcoal: '#36454F', ivory: '#FFFFF0',
  gold: '#FFD700', silver: '#C0C0C0', rose: '#FF007F', lavender: '#E6E6FA',
  mint: '#98FB98', peach: '#FFDAB9', wine: '#722F37', denim: '#1560BD',
  nude: '#E3BC9A', camel: '#C19A6B', sage: '#BCB88A', rust: '#B7410E',
  mustard: '#FFDB58', plum: '#8E4585', lilac: '#C8A2C8', stone: '#928E85',
  sand: '#C2B280', taupe: '#483C32', mauve: '#E0B0FF', sky: '#87CEEB',
  forest: '#228B22', cobalt: '#0047AB', emerald: '#50C878', scarlet: '#FF2400',
  aqua: '#00FFFF', turquoise: '#40E0D0', indigo: '#4B0082', crimson: '#DC143C',
  magenta: '#FF00FF', cyan: '#00FFFF', chocolate: '#7B3F00', coffee: '#6F4E37',
};

export function colorNameToHex(name: string): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  if (NAMED_COLOR_HEX[lower]) return NAMED_COLOR_HEX[lower];
  for (const [key, val] of Object.entries(NAMED_COLOR_HEX)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

// ─── Reading from a Supabase product payload ────────────────────────────────

interface RawProduct {
  metadata?: any;
  product_variants?: any[];
}

/**
 * Parses a Supabase product row (with `product_variants` joined) into the
 * dynamic axes/rows shape the rest of the app uses.
 */
export function parseProduct(product: RawProduct | null | undefined): ParsedVariants {
  if (!product) return { axes: [], rows: [] };

  const variants = product.product_variants || [];

  // Path 1: explicit metadata.options present (new format)
  const storedAxes = Array.isArray(product.metadata?.options) ? product.metadata.options as any[] : null;
  if (storedAxes && storedAxes.length > 0) {
    const axes: OptionAxis[] = storedAxes.map((a: any) => ({
      name: String(a?.name || 'Option').trim() || 'Option',
      kind: (a?.kind === 'color' ? 'color' : 'text') as OptionKind,
      values: Array.isArray(a?.values)
        ? a.values
            .filter((v: any) => v && typeof v.value === 'string' && v.value.trim().length > 0)
            .map((v: any) => ({
              value: String(v.value).trim(),
              hex: typeof v.hex === 'string' ? v.hex : undefined,
              imageUrl: typeof v.imageUrl === 'string' ? v.imageUrl : undefined,
            }))
        : [],
    })).filter((a: OptionAxis) => a.values.length > 0);

    const rows: VariantRow[] = variants.map((v: any) => {
      const valuesFromMeta: string[] | null = Array.isArray(v?.metadata?.options_values)
        ? (v.metadata.options_values as any[]).map((x: any) => String(x ?? ''))
        : null;
      const fallback = [v.option1, v.option2, v.option3].map((x: any) => (x ?? '') as string);
      const optionsValues = (valuesFromMeta && valuesFromMeta.length > 0 ? valuesFromMeta : fallback).slice(0, axes.length);
      while (optionsValues.length < axes.length) optionsValues.push('');
      return rowFromRaw(v, optionsValues);
    });

    return { axes, rows };
  }

  // Path 2: legacy data — infer from variants
  const anyOption2 = variants.some((v: any) => v?.option2);
  if (anyOption2) {
    const colorValuesMap = new Map<string, OptionValue>();
    const sizeValuesSet = new Set<string>();
    variants.forEach((v: any) => {
      if (v?.option2 && !colorValuesMap.has(String(v.option2))) {
        const hex = v?.metadata?.color_hex || colorNameToHex(String(v.option2));
        colorValuesMap.set(String(v.option2), { value: String(v.option2), hex: hex || undefined });
      }
      if (v?.option1) sizeValuesSet.add(String(v.option1));
    });
    const axes: OptionAxis[] = ([
      { name: 'Color', kind: 'color' as OptionKind, values: Array.from(colorValuesMap.values()) },
      { name: 'Size', kind: 'text' as OptionKind, values: Array.from(sizeValuesSet).map((value) => ({ value })) },
    ] as OptionAxis[]).filter((a) => a.values.length > 0);

    const rows: VariantRow[] = variants.map((v: any) => {
      // historic order: option2=color, option1=size
      const colorIdx = axes.findIndex((a) => a.name === 'Color');
      const sizeIdx = axes.findIndex((a) => a.name === 'Size');
      const optionsValues: string[] = axes.map(() => '');
      if (colorIdx !== -1) optionsValues[colorIdx] = String(v?.option2 || '');
      if (sizeIdx !== -1) optionsValues[sizeIdx] = String(v?.option1 || '');
      return rowFromRaw(v, optionsValues);
    });

    return { axes, rows };
  }

  // Path 3: single-axis legacy data (custom packs / single column)
  const distinct = new Set<string>();
  variants.forEach((v: any) => {
    const val = v?.option1 || v?.name;
    if (val) distinct.add(String(val));
  });
  const axes: OptionAxis[] = distinct.size > 0
    ? [{ name: 'Option', kind: 'text', values: Array.from(distinct).map((value) => ({ value })) }]
    : [];

  const rows: VariantRow[] = variants.map((v: any) => {
    const val = String(v?.option1 || v?.name || '');
    return rowFromRaw(v, axes.length > 0 ? [val] : []);
  });

  return { axes, rows };
}

function rowFromRaw(v: any, optionsValues: string[]): VariantRow {
  return {
    id: v?.id,
    name: String(v?.name || optionsValues.filter(Boolean).join(' / ') || 'Default'),
    sku: v?.sku ? String(v.sku) : '',
    price: v?.price !== undefined && v?.price !== null ? String(v.price) : '',
    compareAtPrice: v?.compare_at_price !== undefined && v?.compare_at_price !== null ? String(v.compare_at_price) : '',
    stock: v?.quantity !== undefined && v?.quantity !== null ? String(v.quantity) : '0',
    imageUrl: v?.image_url ? String(v.image_url) : '',
    optionsValues,
  };
}

// ─── Combinations ───────────────────────────────────────────────────────────

export interface Combination {
  /** Length matches axes.length; each entry is the value chosen for that axis. */
  values: string[];
  key: string;
}

export function buildCombinations(axes: OptionAxis[]): Combination[] {
  if (axes.length === 0) return [];
  let acc: Combination[] = [{ values: [], key: '' }];
  for (const axis of axes) {
    if (axis.values.length === 0) return [];
    const next: Combination[] = [];
    for (const c of acc) {
      for (const val of axis.values) {
        const values = [...c.values, val.value];
        next.push({ values, key: values.join('|||') });
      }
    }
    acc = next;
  }
  return acc;
}

/** Find a variant row matching the given selected values (one per axis). */
export function findVariantRow(rows: VariantRow[], values: string[]): VariantRow | undefined {
  return rows.find((r) => r.optionsValues.length === values.length
    && r.optionsValues.every((v, i) => v === values[i]));
}

/**
 * Returns the set of axis-`axisIndex` values that have at least one in-stock
 * variant when combined with the currently-locked selections on the other axes.
 * Used to grey out impossible combinations.
 */
export function availableValuesForAxis(
  axes: OptionAxis[],
  rows: VariantRow[],
  selections: (string | null)[],
  axisIndex: number,
): Set<string> {
  const available = new Set<string>();
  for (const row of rows) {
    let matches = true;
    for (let i = 0; i < axes.length; i++) {
      if (i === axisIndex) continue;
      const sel = selections[i];
      if (sel && row.optionsValues[i] && row.optionsValues[i] !== sel) {
        matches = false;
        break;
      }
    }
    if (matches && row.optionsValues[axisIndex] && (parseInt(row.stock || '0', 10) > 0)) {
      available.add(row.optionsValues[axisIndex]);
    }
  }
  return available;
}

export function stockOf(row: VariantRow | null | undefined): number {
  if (!row) return 0;
  const n = parseInt(row.stock || '0', 10);
  return Number.isFinite(n) ? n : 0;
}

export function priceOf(row: VariantRow | null | undefined, fallback: number): number {
  if (!row) return fallback;
  const n = parseFloat(row.price);
  return Number.isFinite(n) ? n : fallback;
}

export function compareAtOf(row: VariantRow | null | undefined): number | null {
  if (!row) return null;
  if (!row.compareAtPrice) return null;
  const n = parseFloat(row.compareAtPrice);
  return Number.isFinite(n) ? n : null;
}

/** First image URL we have for the given variant row, falling back to the value-level imageUrl, or null. */
export function imageOf(row: VariantRow | undefined | null, axes: OptionAxis[]): string | null {
  if (row?.imageUrl) return row.imageUrl;
  if (!row || !axes.length) return null;
  // Try the first value-level imageUrl, in axis order
  for (let i = 0; i < axes.length; i++) {
    const v = axes[i].values.find((x) => x.value === row.optionsValues[i]);
    if (v?.imageUrl) return v.imageUrl;
  }
  return null;
}

/**
 * Builds the small colour swatches shown on product cards in listings.
 * Prefers the explicit "color" axis from `metadata.options`, then falls back
 * to legacy `option2`-based variants. Returns `[]` when there's no colour axis.
 */
export function colorSwatchesFromProduct(
  product: RawProduct | null | undefined,
): { name: string; hex: string }[] {
  if (!product) return [];
  const { axes } = parseProduct(product);
  const colorAxis = axes.find((a) => a.kind === 'color');
  const out: { name: string; hex: string }[] = [];
  const seen = new Set<string>();
  if (colorAxis) {
    for (const v of colorAxis.values) {
      const key = v.value.toLowerCase().trim();
      if (seen.has(key)) continue;
      const hex = v.hex || colorNameToHex(v.value);
      if (hex) {
        seen.add(key);
        out.push({ name: v.value.trim(), hex });
      }
    }
  }
  return out;
}

// ─── Writing back to Supabase ───────────────────────────────────────────────

/**
 * Serializes the dynamic axes + rows back into payloads that match the
 * existing product_variants schema. Pads optionN with values so legacy code
 * that reads option1/option2/option3 keeps working.
 */
export interface SerializedProductOptions {
  productMetadataOptions: any[];
  variantInserts: any[];
}

export function serializeForSave(
  productId: string,
  axes: OptionAxis[],
  rows: VariantRow[],
  basePrice: number,
): SerializedProductOptions {
  const productMetadataOptions = axes.map((a) => ({
    name: a.name,
    kind: a.kind,
    values: a.values.map((v) => ({
      value: v.value,
      ...(v.hex ? { hex: v.hex } : {}),
      ...(v.imageUrl ? { imageUrl: v.imageUrl } : {}),
    })),
  }));

  const colorAxisIndex = axes.findIndex((a) => a.kind === 'color');

  const variantInserts = rows.map((row) => {
    const cleanValues = row.optionsValues.slice(0, 3);
    while (cleanValues.length < 3) cleanValues.push('');
    const displayName = row.optionsValues.filter(Boolean).join(' / ') || row.name || 'Default';

    // Resolve color_hex from the chosen color value (if any) to keep legacy
    // consumers like ProductCard's colorVariants happy.
    let color_hex: string | undefined;
    if (colorAxisIndex !== -1) {
      const chosen = row.optionsValues[colorAxisIndex];
      const valDef = axes[colorAxisIndex].values.find((v) => v.value === chosen);
      if (valDef?.hex) color_hex = valDef.hex;
    }

    return {
      product_id: productId,
      name: displayName,
      sku: row.sku?.trim() || null,
      price: parseFloat(row.price) || basePrice,
      compare_at_price: row.compareAtPrice ? parseFloat(row.compareAtPrice) : null,
      quantity: parseInt(row.stock, 10) || 0,
      option1: cleanValues[0] || null,
      option2: cleanValues[1] || null,
      option3: cleanValues[2] || null,
      image_url: row.imageUrl?.trim() || null,
      metadata: {
        options_values: row.optionsValues,
        ...(color_hex ? { color_hex } : {}),
      },
    };
  });

  return { productMetadataOptions, variantInserts };
}

// ─── Presets used by the admin builder ──────────────────────────────────────

export const COLOR_PRESETS: OptionValue[] = [
  { value: 'Black', hex: '#000000' },
  { value: 'White', hex: '#FFFFFF' },
  { value: 'Red', hex: '#EF4444' },
  { value: 'Blue', hex: '#3B82F6' },
  { value: 'Navy', hex: '#1E3A5F' },
  { value: 'Green', hex: '#22C55E' },
  { value: 'Yellow', hex: '#EAB308' },
  { value: 'Pink', hex: '#EC4899' },
  { value: 'Purple', hex: '#A855F7' },
  { value: 'Orange', hex: '#F97316' },
  { value: 'Gray', hex: '#6B7280' },
  { value: 'Brown', hex: '#92400E' },
  { value: 'Beige', hex: '#D2B48C' },
  { value: 'Maroon', hex: '#800000' },
  { value: 'Teal', hex: '#14B8A6' },
  { value: 'Cream', hex: '#FFFDD0' },
  { value: 'Gold', hex: '#D4AF37' },
  { value: 'Silver', hex: '#C0C0C0' },
];

export const SIZE_PRESETS: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export const AXIS_TEMPLATES: { name: string; kind: OptionKind; suggested?: string[] }[] = [
  { name: 'Color', kind: 'color' },
  { name: 'Size', kind: 'text', suggested: SIZE_PRESETS },
  { name: 'Capacity', kind: 'text', suggested: ['250ml', '500ml', '750ml', '1L', '1.5L', '2L'] },
  { name: 'Material', kind: 'text', suggested: ['Plastic', 'Glass', 'Ceramic', 'Stainless Steel', 'Bamboo', 'Paper'] },
  { name: 'Scent', kind: 'text', suggested: ['Vanilla', 'Lavender', 'Citrus', 'Rose', 'Ocean'] },
  { name: 'Style', kind: 'text' },
  { name: 'Pack', kind: 'text', suggested: ['Single', 'Pack of 2', 'Pack of 6', 'Pack of 12', 'Pack of 24', 'Pack of 50'] },
  { name: 'Bundle', kind: 'text' },
];
