'use client';

import { useState } from 'react';
import Link from 'next/link';
import LazyImage from './LazyImage';
import { useCart } from '@/context/CartContext';

// Map common color names to hex values for swatches
const COLOR_MAP: Record<string, string> = {
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

export function getColorHex(colorName: string): string | null {
  const lower = colorName.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  // Try partial match (e.g. "Light Blue" -> "blue")
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export interface ColorVariant {
  name: string;
  hex: string;
}

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
  maxStock?: number;
  moq?: number;
  hasVariants?: boolean;
  minVariantPrice?: number;
  colorVariants?: ColorVariant[];
}

export default function ProductCard({
  id,
  slug,
  name,
  price,
  originalPrice,
  image,
  rating = 5,
  reviewCount = 0,
  badge,
  inStock = true,
  maxStock = 50,
  moq = 1,
  hasVariants = false,
  minVariantPrice,
  colorVariants = []
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const displayPrice = hasVariants && minVariantPrice ? minVariantPrice : price;
  const discount = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
  const MAX_SWATCHES = 5;

  const formatPrice = (val: number) => `GH\u20B5${val.toFixed(2)}`;

  return (
    <article className="group h-full w-full max-w-[320px] overflow-hidden rounded-2xl border border-brand-green/15 bg-white shadow-[0_8px_24px_rgba(11,55,40,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(11,55,40,0.14)] mx-auto">
      <Link
        href={`/product/${slug}`}
        className="relative block aspect-[5/6] overflow-hidden bg-brand-greenLight/40"
      >
        <LazyImage
          src={image}
          alt={name}
          className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
        />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          {badge && (
            <span className="rounded-full bg-white/92 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-800 shadow-sm">
              {badge}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-brand-orange px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex h-[calc(100%-0px)] flex-col p-3.5 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
            inStock ? 'bg-brand-greenLight text-brand-greenDark' : 'bg-gray-100 text-gray-500'
          }`}>
            {inStock ? 'In stock' : 'Unavailable'}
          </span>
          <div className="inline-flex items-center gap-1 text-xs text-gray-500">
            <i className="ri-star-fill text-brand-orange" />
            <span>{rating.toFixed(1)}</span>
            {reviewCount > 0 && <span>({reviewCount})</span>}
          </div>
        </div>

        <Link href={`/product/${slug}`} className="mb-2">
          <h3 className="line-clamp-2 text-[0.98rem] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand-greenDark">
            {name}
          </h3>
        </Link>

        {colorVariants.length > 0 && (
          <div className="mb-3 flex items-center gap-1.5">
            {colorVariants.slice(0, MAX_SWATCHES).map((color) => (
              <button
                key={color.name}
                title={color.name}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveColor(activeColor === color.name ? null : color.name);
                }}
                className={`h-4 w-4 flex-shrink-0 rounded-full border transition-all duration-200 ${
                  activeColor === color.name
                    ? 'scale-110 ring-2 ring-brand-green ring-offset-1'
                    : 'hover:scale-110'
                } ${color.hex === '#FFFFFF' ? 'border-gray-300' : 'border-transparent'}`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {colorVariants.length > MAX_SWATCHES && (
              <span className="ml-0.5 text-xs text-gray-400">+{colorVariants.length - MAX_SWATCHES}</span>
            )}
          </div>
        )}

        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            {hasVariants && minVariantPrice ? `From ${formatPrice(minVariantPrice)}` : formatPrice(price)}
          </span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(originalPrice)}</span>
          )}
        </div>

        <div className="mt-auto">
          {hasVariants ? (
            <Link
              href={`/product/${slug}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-green/30 bg-white py-2.5 text-sm font-semibold text-brand-greenDark transition-colors hover:bg-brand-greenLight"
            >
              <i className="ri-list-check text-base" />
              <span>Select Options</span>
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addToCart({ id, name, price, image, quantity: moq, slug, maxStock, moq });
                }}
                disabled={!inStock}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-orange py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-brand-orangeDark disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <i className="ri-shopping-cart-2-line text-sm" />
                <span>Cart</span>
              </button>
              <Link
                href={`/product/${slug}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-green/30 bg-white py-2.5 text-xs font-semibold text-brand-greenDark transition-colors hover:bg-brand-greenLight"
              >
                <i className="ri-flashlight-line text-sm" />
                <span>Buy Now</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
