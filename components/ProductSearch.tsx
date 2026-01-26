import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatCurrency } from '../utils/formatters';
import { vi } from '../shared/i18n/vi';
import { cn } from '@/lib/utils';
import type { Product } from '../domain/models';

interface ProductSearchProps {
  onAddToCart: (product: Product) => void;
  excludeIds?: string[]; // Products already in cart (optional, to show differently)
}

/**
 * Get the first non-null price from a product
 */
function getDisplayPrice(product: Product): number {
  return product.price1 ?? product.price2 ?? product.price3 ?? 0;
}

export function ProductSearch({ onAddToCart, excludeIds = [] }: ProductSearchProps) {
  const [search, setSearch] = useState('');

  // Live query for active products filtered by search
  const products = useLiveQuery(async () => {
    const term = search.trim().toLowerCase();
    const all = await db.products.where('active').equals(1).toArray();

    if (term) {
      return all.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    }
    return all;
  }, [search]);

  const handleSelect = (product: Product) => {
    onAddToCart(product);
    setSearch(''); // Clear search after adding
  };

  return (
    <div className="relative">
      <input
        type="text"
        className="mb-4 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
        placeholder={vi.cart.searchProducts}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {search.trim() && products && products.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 max-h-[200px] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
          {products.map((product) => {
            const inCart = excludeIds.includes(product.id);
            const displayPrice = getDisplayPrice(product);
            return (
              <div
                key={product.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-2 hover:bg-slate-50',
                  inCart && 'bg-green-50'
                )}
                onClick={() => handleSelect(product)}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {product.name}
                    {inCart && <span className="text-slate-400"> ({vi.cart.inCart})</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {product.category && <span>{product.category} • </span>}
                    {product.unit} • {formatCurrency(displayPrice)}
                  </div>
                </div>
                <button
                  type="button"
                  className="ml-2 inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-2 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-white transition-colors hover:bg-blue-700"
                >
                  + {vi.actions.add}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {search.trim() && products && products.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-400">
          {vi.products.emptySearch}
        </div>
      )}
    </div>
  );
}
