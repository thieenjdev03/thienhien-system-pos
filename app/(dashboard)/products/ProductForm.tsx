import { useState, useEffect } from 'react';
import type { Product, ProductInput } from '@/domain/models';
import { vi } from '@/shared/i18n/vi';

interface ProductFormProps {
  product?: Product; // undefined = create mode, defined = edit mode
  onSave: (data: ProductInput) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [unit, setUnit] = useState(product?.unit ?? '');
  const [price1, setPrice1] = useState(product?.price1?.toString() ?? '');
  const [price2, setPrice2] = useState(product?.price2?.toString() ?? '');
  const [price3, setPrice3] = useState(product?.price3?.toString() ?? '');
  const [note, setNote] = useState(product?.note ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!product;

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category ?? '');
      setUnit(product.unit);
      setPrice1(product.price1?.toString() ?? '');
      setPrice2(product.price2?.toString() ?? '');
      setPrice3(product.price3?.toString() ?? '');
      setNote(product.note ?? '');
    }
  }, [product]);

  const parsePrice = (value: string): number | null => {
    if (!value.trim()) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!name.trim()) {
      setError(vi.validation.nameRequired);
      return;
    }
    if (!unit.trim()) {
      setError(vi.validation.required.replace('{field}', vi.products.unit.toLowerCase()));
      return;
    }

    const p1 = parsePrice(price1);
    const p2 = parsePrice(price2);
    const p3 = parsePrice(price3);

    // At least one price must be set
    if (p1 === null && p2 === null && p3 === null) {
      setError(vi.validation.required.replace('{field}', 'ít nhất một mức giá'));
      return;
    }

    // Validate prices are non-negative
    if ((p1 !== null && p1 < 0) || (p2 !== null && p2 < 0) || (p3 !== null && p3 < 0)) {
      setError(vi.validation.priceNonNegative);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        category: category.trim() || undefined,
        unit: unit.trim(),
        price1: p1,
        price2: p2,
        price3: p3,
        note: note.trim() || undefined,
        active: product?.active ?? true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : vi.validation.invalidValue);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 sm:px-6">
      <div className="w-full max-w-lg rounded-md bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-semibold">
          {isEdit ? vi.products.editProduct : vi.products.addProduct}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700"
            >
              {vi.products.name} *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Nhập ${vi.products.name.toLowerCase()}`}
              autoFocus
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="category"
              className="block text-sm font-medium text-slate-700"
            >
              {vi.products.category}
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={`Nhập ${vi.products.category.toLowerCase()}`}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="unit"
              className="block text-sm font-medium text-slate-700"
            >
              {vi.products.unit} *
            </label>
            <input
              type="text"
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={vi.products.unitPlaceholder}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label
                htmlFor="price1"
                className="block text-sm font-medium text-slate-700"
              >
                {vi.products.price1}
              </label>
              <input
                type="number"
                id="price1"
                value={price1}
                onChange={(e) => setPrice1(e.target.value)}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="price2"
                className="block text-sm font-medium text-slate-700"
              >
                {vi.products.price2}
              </label>
              <input
                type="number"
                id="price2"
                value={price2}
                onChange={(e) => setPrice2(e.target.value)}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="price3"
                className="block text-sm font-medium text-slate-700"
              >
                {vi.products.price3}
              </label>
              <input
                type="number"
                id="price3"
                value={price3}
                onChange={(e) => setPrice3(e.target.value)}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="note"
              className="block text-sm font-medium text-slate-700"
            >
              {vi.products.note}
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Nhập ${vi.products.note.toLowerCase()}`}
              rows={3}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-900 transition-colors hover:bg-slate-200"
              onClick={onCancel}
              disabled={loading}
            >
              {vi.actions.cancel}
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              {loading ? vi.actions.saving : isEdit ? vi.actions.update : vi.actions.add}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
