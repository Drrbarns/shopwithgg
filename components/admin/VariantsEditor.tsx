'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AXIS_TEMPLATES,
  COLOR_PRESETS,
  OptionAxis,
  OptionValue,
  VariantRow,
  buildCombinations,
  colorNameToHex,
} from '@/lib/product-variants';

interface VariantsEditorProps {
  axes: OptionAxis[];
  rows: VariantRow[];
  basePrice: string;
  /** Already-uploaded product gallery images to reuse as variant images. */
  galleryImages?: string[];
  onChange: (next: { axes: OptionAxis[]; rows: VariantRow[] }) => void;
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function rowKey(values: string[]) {
  return values.join('|||');
}

// Upload a single image through the existing admin upload endpoint.
async function uploadImage(file: File): Promise<string | null> {
  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('bucket', 'product-images');
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.url) {
      alert(data?.error || 'Upload failed');
      return null;
    }
    return data.url as string;
  } catch (e: any) {
    alert('Upload failed: ' + (e?.message || String(e)));
    return null;
  }
}

export default function VariantsEditor({ axes, rows, basePrice, galleryImages = [], onChange }: VariantsEditorProps) {
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [uploadingForRow, setUploadingForRow] = useState<string | null>(null);
  const [uploadingForAxisValue, setUploadingForAxisValue] = useState<string | null>(null);
  const fileInputRowRef = useRef<HTMLInputElement | null>(null);
  const fileInputAxisRef = useRef<HTMLInputElement | null>(null);
  const pendingRowKeyRef = useRef<string | null>(null);
  const pendingAxisRef = useRef<{ axisIdx: number; valueIdx: number } | null>(null);

  // ─── Combinations + reconciliation with existing rows ─────────────────────
  const combos = useMemo(() => buildCombinations(axes), [axes]);

  /**
   * Merge the existing rows into the latest combinations from the axes config.
   * Anything that no longer maps to a combination gets dropped; new combos get
   * an empty row.
   */
  const matrixRows: VariantRow[] = useMemo(() => {
    if (combos.length === 0) return [];
    const byKey = new Map<string, VariantRow>();
    rows.forEach((r) => byKey.set(rowKey(r.optionsValues), r));
    return combos.map((combo) => {
      const existing = byKey.get(combo.key);
      if (existing) return { ...existing, optionsValues: combo.values };
      return {
        id: newId(),
        name: combo.values.join(' / '),
        sku: '',
        price: basePrice || '',
        compareAtPrice: '',
        stock: '0',
        imageUrl: '',
        optionsValues: combo.values,
      };
    });
  }, [combos, rows, basePrice]);

  // Keep parent in sync any time the matrix gets reconciled.
  // We push changes only when the materialized rows differ from `rows`.
  if (
    matrixRows.length !== rows.length ||
    matrixRows.some((r, i) => rowKey(r.optionsValues) !== rowKey(rows[i]?.optionsValues || []))
  ) {
    queueMicrotask(() => onChange({ axes, rows: matrixRows }));
  }

  const totalStock = matrixRows.reduce((sum, r) => sum + (parseInt(r.stock || '0', 10) || 0), 0);

  // ─── Axis manipulation helpers ────────────────────────────────────────────
  const addAxis = (template?: { name: string; kind: 'color' | 'text'; suggested?: string[] }) => {
    if (axes.length >= 3) return;
    const name = template?.name || 'Option';
    const kind = template?.kind || 'text';
    const usedNames = new Set(axes.map((a) => a.name.toLowerCase()));
    if (usedNames.has(name.toLowerCase())) return;
    const newAxis: OptionAxis = { name, kind, values: [] };
    onChange({ axes: [...axes, newAxis], rows: matrixRows });
  };

  const removeAxis = (axisIdx: number) => {
    const nextAxes = axes.filter((_, i) => i !== axisIdx);
    // Drop the removed axis from each row's optionsValues
    const nextRows = matrixRows.map((r) => ({
      ...r,
      optionsValues: r.optionsValues.filter((_, i) => i !== axisIdx),
    }));
    onChange({ axes: nextAxes, rows: nextRows });
  };

  const renameAxis = (axisIdx: number, name: string) => {
    const next = axes.map((a, i) => (i === axisIdx ? { ...a, name } : a));
    onChange({ axes: next, rows: matrixRows });
  };

  const setAxisKind = (axisIdx: number, kind: 'color' | 'text') => {
    const next = axes.map((a, i) => (i === axisIdx ? { ...a, kind } : a));
    onChange({ axes: next, rows: matrixRows });
  };

  const addAxisValue = (axisIdx: number, value: OptionValue) => {
    if (!value.value.trim()) return;
    const axis = axes[axisIdx];
    if (axis.values.some((v) => v.value.toLowerCase() === value.value.toLowerCase())) return;
    const nextAxis: OptionAxis = { ...axis, values: [...axis.values, value] };
    const nextAxes = axes.map((a, i) => (i === axisIdx ? nextAxis : a));
    onChange({ axes: nextAxes, rows: matrixRows });
  };

  const removeAxisValue = (axisIdx: number, valueValue: string) => {
    const axis = axes[axisIdx];
    const nextAxis: OptionAxis = { ...axis, values: axis.values.filter((v) => v.value !== valueValue) };
    const nextAxes = axes.map((a, i) => (i === axisIdx ? nextAxis : a));
    onChange({ axes: nextAxes, rows: matrixRows });
  };

  const updateAxisValueField = (axisIdx: number, valueIdx: number, patch: Partial<OptionValue>) => {
    const axis = axes[axisIdx];
    const nextValues = axis.values.map((v, i) => (i === valueIdx ? { ...v, ...patch } : v));
    const nextAxes = axes.map((a, i) => (i === axisIdx ? { ...a, values: nextValues } : a));
    onChange({ axes: nextAxes, rows: matrixRows });
  };

  // ─── Row manipulation helpers ─────────────────────────────────────────────
  const updateRow = (key: string, patch: Partial<VariantRow>) => {
    const next = matrixRows.map((r) => (rowKey(r.optionsValues) === key ? { ...r, ...patch } : r));
    onChange({ axes, rows: next });
  };

  const bulkSet = (field: 'price' | 'stock' | 'compareAtPrice' | 'sku', value: string) => {
    const next = matrixRows.map((r) => ({ ...r, [field]: value }));
    onChange({ axes, rows: next });
  };

  // ─── Image upload ─────────────────────────────────────────────────────────
  const onPickRowImage = (key: string) => {
    pendingRowKeyRef.current = key;
    fileInputRowRef.current?.click();
  };

  const onRowImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !pendingRowKeyRef.current) return;
    const key = pendingRowKeyRef.current;
    pendingRowKeyRef.current = null;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image too large (max 10MB).');
      return;
    }
    setUploadingForRow(key);
    const url = await uploadImage(file);
    setUploadingForRow(null);
    if (url) updateRow(key, { imageUrl: url });
  };

  const onPickAxisValueImage = (axisIdx: number, valueIdx: number) => {
    pendingAxisRef.current = { axisIdx, valueIdx };
    fileInputAxisRef.current?.click();
  };

  const onAxisImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !pendingAxisRef.current) return;
    const { axisIdx, valueIdx } = pendingAxisRef.current;
    pendingAxisRef.current = null;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image too large (max 10MB).');
      return;
    }
    const key = `${axisIdx}-${valueIdx}`;
    setUploadingForAxisValue(key);
    const url = await uploadImage(file);
    setUploadingForAxisValue(null);
    if (url) updateAxisValueField(axisIdx, valueIdx, { imageUrl: url });
  };

  // ─── Filtering ───────────────────────────────────────────────────────────
  const filteredRows = matrixRows.filter((r) => {
    const haystack = `${r.optionsValues.join(' ')} ${r.sku} ${r.name}`.toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    const stock = parseInt(r.stock || '0', 10);
    if (stockFilter === 'in_stock' && stock <= 0) return false;
    if (stockFilter === 'out_of_stock' && stock > 0) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <input ref={fileInputRowRef} type="file" accept="image/*" className="hidden" onChange={onRowImageSelected} />
      <input ref={fileInputAxisRef} type="file" accept="image/*" className="hidden" onChange={onAxisImageSelected} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Product Variants</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            Add up to 3 option attributes (Color, Size, Capacity, Scent, etc.).
            Each combination becomes a sellable SKU with its own image, price and stock.
          </p>
        </div>
        {axes.length > 0 && (
          <div className="text-sm text-gray-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            <strong className="text-emerald-700">{combos.length}</strong> combinations &middot;{' '}
            <strong className="text-emerald-700">{totalStock}</strong> total stock
          </div>
        )}
      </div>

      {/* Empty state */}
      {axes.length === 0 && (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
          <i className="ri-layout-grid-line text-5xl text-gray-300 mb-3 inline-block" />
          <h4 className="text-lg font-bold text-gray-900 mb-1">No variants yet</h4>
          <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
            This product has a single price/stock. Add an option attribute to sell it in
            multiple variations. Pick a common template or create your own.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {AXIS_TEMPLATES.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => addAxis(t)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <i className={t.kind === 'color' ? 'ri-palette-line' : 'ri-text'} />
                {t.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => addAxis({ name: `Option ${axes.length + 1}`, kind: 'text' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <i className="ri-add-line" />
              Custom attribute
            </button>
          </div>
        </div>
      )}

      {/* Axis editors */}
      {axes.map((axis, axisIdx) => {
        const isColor = axis.kind === 'color';
        return (
          <AxisEditor
            key={axisIdx}
            axisIdx={axisIdx}
            axis={axis}
            onRename={(name) => renameAxis(axisIdx, name)}
            onChangeKind={(kind) => setAxisKind(axisIdx, kind)}
            onAddValue={(val) => addAxisValue(axisIdx, val)}
            onRemoveValue={(val) => removeAxisValue(axisIdx, val)}
            onUpdateValue={(valueIdx, patch) => updateAxisValueField(axisIdx, valueIdx, patch)}
            onRemoveAxis={() => removeAxis(axisIdx)}
            onPickValueImage={(valueIdx) => onPickAxisValueImage(axisIdx, valueIdx)}
            uploadingForAxisValue={uploadingForAxisValue}
            isColorAxis={isColor}
          />
        );
      })}

      {axes.length > 0 && axes.length < 3 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold mr-1">Add another attribute:</span>
          {AXIS_TEMPLATES
            .filter((t) => !axes.some((a) => a.name.toLowerCase() === t.name.toLowerCase()))
            .map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => addAxis(t)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-gray-200 hover:border-emerald-400 text-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                <i className={t.kind === 'color' ? 'ri-palette-line' : 'ri-add-line'} />
                {t.name}
              </button>
            ))}
          <button
            type="button"
            onClick={() => addAxis({ name: `Option ${axes.length + 1}`, kind: 'text' })}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 rounded-lg text-xs font-medium transition-colors"
          >
            <i className="ri-add-line" /> Custom
          </button>
        </div>
      )}

      {/* Matrix */}
      {matrixRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-gray-900 inline-flex items-center">
                <i className="ri-grid-line mr-2 text-base text-purple-600" />
                SKU Matrix
              </h4>
              <span className="text-xs text-gray-500">
                Showing {filteredRows.length} of {matrixRows.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search variants..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs w-44"
                />
              </div>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
              >
                <option value="all">All stock</option>
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const val = prompt('Set price for ALL variants:', basePrice || '');
                  if (val !== null) bulkSet('price', val);
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Bulk Price
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = prompt('Set stock for ALL variants:', '0');
                  if (val !== null) bulkSet('stock', val);
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Bulk Stock
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-700 w-20">Image</th>
                  {axes.map((a, i) => (
                    <th key={i} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-700">{a.name}</th>
                  ))}
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-700">SKU</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-700">Price (₦)</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-700">Compare at</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-700">Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const key = rowKey(row.optionsValues);
                  const uploading = uploadingForRow === key;
                  return (
                    <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPickRowImage(key)}
                            className="relative w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 hover:border-emerald-500 overflow-hidden bg-gray-50 flex items-center justify-center transition-colors"
                            title="Upload an image for this variant"
                          >
                            {row.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <i className="ri-image-add-line text-2xl text-gray-400" />
                            )}
                            {uploading && (
                              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                <i className="ri-loader-4-line animate-spin text-emerald-700" />
                              </div>
                            )}
                          </button>
                          {row.imageUrl && (
                            <button
                              type="button"
                              onClick={() => updateRow(key, { imageUrl: '' })}
                              className="text-gray-400 hover:text-red-500"
                              title="Remove image"
                            >
                              <i className="ri-close-line" />
                            </button>
                          )}
                        </div>
                        {galleryImages.length > 0 && (
                          <select
                            className="mt-1 w-16 text-[10px] border border-gray-200 rounded px-1 py-0.5 text-gray-600"
                            value=""
                            onChange={(e) => { const u = e.target.value; if (u) updateRow(key, { imageUrl: u }); e.target.value = ''; }}
                          >
                            <option value="">Gallery</option>
                            {galleryImages.map((u, i) => (
                              <option key={i} value={u}>Image {i + 1}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      {axes.map((axis, axisIdx) => {
                        const val = row.optionsValues[axisIdx] || '';
                        const def = axis.values.find((v) => v.value === val);
                        return (
                          <td key={axisIdx} className="py-2 px-3 whitespace-nowrap">
                            {axis.kind === 'color' ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: def?.hex || colorNameToHex(val) || '#888' }}
                                />
                                <span className="text-gray-900">{val}</span>
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-900 px-2 py-1 rounded text-xs font-medium">
                                {val}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.sku}
                          onChange={(e) => updateRow(key, { sku: e.target.value })}
                          placeholder="Auto"
                          className="w-32 px-2 py-1.5 border border-gray-300 rounded-md text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={row.price}
                          onChange={(e) => updateRow(key, { price: e.target.value })}
                          step="0.01"
                          placeholder={basePrice || '0'}
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={row.compareAtPrice}
                          onChange={(e) => updateRow(key, { compareAtPrice: e.target.value })}
                          step="0.01"
                          placeholder="—"
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={row.stock}
                          onChange={(e) => updateRow(key, { stock: e.target.value })}
                          placeholder="0"
                          className={`w-20 px-2 py-1.5 border rounded-md text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${
                            (parseInt(row.stock || '0', 10) || 0) <= 0
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : 'border-gray-300'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-emerald-50 border-t border-emerald-100 text-xs text-emerald-800 flex items-center">
            <i className="ri-information-line mr-1.5" />
            Total stock across all variants: <strong className="ml-1">{totalStock}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Axis editor sub-component ────────────────────────────────────────────────

interface AxisEditorProps {
  axisIdx: number;
  axis: OptionAxis;
  isColorAxis: boolean;
  uploadingForAxisValue: string | null;
  onRename: (name: string) => void;
  onChangeKind: (kind: 'color' | 'text') => void;
  onAddValue: (value: OptionValue) => void;
  onRemoveValue: (value: string) => void;
  onUpdateValue: (valueIdx: number, patch: Partial<OptionValue>) => void;
  onRemoveAxis: () => void;
  onPickValueImage: (valueIdx: number) => void;
}

function AxisEditor({
  axisIdx,
  axis,
  isColorAxis,
  uploadingForAxisValue,
  onRename,
  onChangeKind,
  onAddValue,
  onRemoveValue,
  onUpdateValue,
  onRemoveAxis,
  onPickValueImage,
}: AxisEditorProps) {
  const [pendingValue, setPendingValue] = useState('');
  const [pendingHex, setPendingHex] = useState('#888888');

  const template = AXIS_TEMPLATES.find((t) => t.name.toLowerCase() === axis.name.toLowerCase());
  const suggestions = isColorAxis
    ? COLOR_PRESETS.filter((p) => !axis.values.some((v) => v.value.toLowerCase() === p.value.toLowerCase()))
    : (template?.suggested || []).filter((s) => !axis.values.some((v) => v.value.toLowerCase() === s.toLowerCase()))
        .map((s) => ({ value: s, hex: undefined }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3 bg-gradient-to-r from-emerald-50/30 to-transparent">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
          {axisIdx + 1}
        </span>
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={axis.name}
            onChange={(e) => onRename(e.target.value)}
            className="text-base font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-emerald-500 focus:outline-none w-full"
          />
        </div>
        <select
          value={axis.kind}
          onChange={(e) => onChangeKind(e.target.value as 'color' | 'text')}
          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
        >
          <option value="text">Text / chips</option>
          <option value="color">Color swatch</option>
        </select>
        <button
          type="button"
          onClick={onRemoveAxis}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Remove this attribute"
        >
          <i className="ri-delete-bin-line text-lg" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {axis.values.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No values yet. Add some {axis.kind === 'color' ? 'colors' : 'options'} below.
          </p>
        )}

        {/* Existing values */}
        {axis.values.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {axis.values.map((v, valueIdx) => {
              const uploadingKey = `${axisIdx}-${valueIdx}`;
              const isUploading = uploadingForAxisValue === uploadingKey;
              return (
                <div
                  key={v.value}
                  className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 group hover:border-emerald-300 transition-colors"
                >
                  {isColorAxis && (
                    <input
                      type="color"
                      value={v.hex || '#888888'}
                      onChange={(e) => onUpdateValue(valueIdx, { hex: e.target.value })}
                      className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer p-0"
                      title="Edit color"
                    />
                  )}
                  {v.imageUrl ? (
                    <button type="button" onClick={() => onPickValueImage(valueIdx)} className="w-7 h-7 rounded-md overflow-hidden border border-gray-200" title="Replace value image">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={v.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPickValueImage(valueIdx)}
                      className="w-7 h-7 rounded-md border border-dashed border-gray-300 hover:border-emerald-400 flex items-center justify-center"
                      title="Upload an image for this value"
                    >
                      {isUploading ? (
                        <i className="ri-loader-4-line animate-spin text-emerald-700 text-sm" />
                      ) : (
                        <i className="ri-image-add-line text-gray-400 text-sm" />
                      )}
                    </button>
                  )}
                  <span className="text-sm font-medium text-gray-900">{v.value}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveValue(v.value)}
                    className="text-gray-400 hover:text-red-500 ml-1"
                    title="Remove value"
                  >
                    <i className="ri-close-line text-sm" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Suggestion chips */}
        {suggestions.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              {isColorAxis ? 'Quick add colors:' : 'Quick add suggestions:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 20).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onAddValue(s)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                >
                  {isColorAxis && (
                    <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: s.hex || '#888' }} />
                  )}
                  <i className={isColorAxis ? '' : 'ri-add-line text-xs'} />
                  <span>{s.value}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add new value */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {isColorAxis && (
            <input
              type="color"
              value={pendingHex}
              onChange={(e) => setPendingHex(e.target.value)}
              className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              title="Pick a color"
            />
          )}
          <input
            type="text"
            value={pendingValue}
            onChange={(e) => setPendingValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (pendingValue.trim()) {
                  onAddValue({ value: pendingValue.trim(), hex: isColorAxis ? pendingHex : undefined });
                  setPendingValue('');
                  if (isColorAxis) setPendingHex('#888888');
                }
              }
            }}
            placeholder={isColorAxis ? 'Custom color name' : `e.g. ${axis.name === 'Size' ? 'One Size' : axis.name === 'Capacity' ? '500ml' : 'New value'}`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => {
              if (pendingValue.trim()) {
                onAddValue({ value: pendingValue.trim(), hex: isColorAxis ? pendingHex : undefined });
                setPendingValue('');
                if (isColorAxis) setPendingHex('#888888');
              }
            }}
            disabled={!pendingValue.trim()}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line mr-0.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
