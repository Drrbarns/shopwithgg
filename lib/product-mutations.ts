import { supabaseAdmin } from '@/lib/supabase-admin';

export function slugify(input: string): string {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Returns a slug guaranteed not to collide with an existing product.
 * When two products share a name, the second gets `name-2`, the third `name-3`, etc.
 * Pass `excludeId` to ignore the product being updated.
 */
export async function uniqueProductSlug(
  desiredSlug: string | undefined | null,
  name: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(desiredSlug || name) || `product-${Date.now().toString(36)}`;
  let candidate = base;
  let attempt = 1;
  // Cap attempts so a pathological data state can't loop forever.
  while (attempt < 1000) {
    let query = supabaseAdmin.from('products').select('id').eq('slug', candidate);
    if (excludeId) query = query.neq('id', excludeId);
    const { data: existing } = await query.maybeSingle();
    if (!existing) return candidate;
    attempt++;
    candidate = `${base}-${attempt}`;
  }
  // Extremely unlikely fallback: guarantee uniqueness with a random suffix.
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Maps a serialized variant payload (from product-variants.serializeForSave)
 * into a product_variants insert row. Also tolerates the legacy
 * { color, stock, colorHex } shape just in case. Note: there is no
 * `sort_order` column in the schema — ordering is derived from metadata.options_values.
 */
export function mapVariantInsert(v: any, productId: string) {
  const quantity = v.quantity ?? v.stock ?? 0;
  const imageUrl = typeof v.image_url === 'string' ? v.image_url.trim() : '';
  const metadata = (v.metadata && typeof v.metadata === 'object')
    ? v.metadata
    : (v.colorHex ? { color_hex: v.colorHex } : {});
  return {
    product_id: productId,
    name: v.name || v.color || 'Default',
    sku: v.sku || null,
    price: parseFloat(v.price) || 0,
    compare_at_price: (v.compare_at_price !== undefined && v.compare_at_price !== null && v.compare_at_price !== '')
      ? parseFloat(v.compare_at_price)
      : null,
    quantity: parseInt(quantity, 10) || 0,
    option1: (v.option1 ?? v.name) || null,
    option2: (v.option2 ?? (typeof v.color === 'string' ? v.color.trim() : '')) || null,
    option3: v.option3 || null,
    image_url: imageUrl || null,
    metadata,
  };
}
