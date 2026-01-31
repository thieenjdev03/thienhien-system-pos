/**
 * Product Search & Add Panel for Invoice Creation
 * Features: debounced search, keyboard navigation, quick add to cart
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { formatCurrency } from '@/utils/formatters';
import { vi } from '@/shared/i18n/vi';
import { cn } from '@/lib/utils';
import type { Product, PriceTier } from '@/domain/models';

interface ProductSearchAddPanelProps {
  onAddToCart: (product: Product) => void;
  priceTier: PriceTier;
  cartProductIds: Set<string>;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * Format price display, show dash if null
 */
function formatPriceDisplay(price: number | null): string {
  if (price === null) return '—';
  return formatCurrency(price);
}

/**
 * Debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function ProductSearchAddPanel({
  onAddToCart,
  priceTier,
  cartProductIds,
  searchInputRef,
}: ProductSearchAddPanelProps) {
  const INITIAL_VISIBLE = 5;
  const LOAD_MORE_COUNT = 10;
  const SCROLL_THRESHOLD_PX = 32;
  const RESULTS_MAX_HEIGHT = '360px'; // ~5 items tall; keeps list compact

  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [itemsToShow, setItemsToShow] = useState(INITIAL_VISIBLE);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search input (300ms)
  const debouncedSearch = useDebounce(search.trim().toLowerCase(), 300);

  // Pre-load all active products once (cached by useLiveQuery)
  // This avoids re-fetching from IndexedDB on every search change
  const allActiveProducts = useLiveQuery(
    async () => {
      try {
        const all = await db.products.toArray();
        // Filter by active (boolean)
        const active = all.filter(p => p.active === true);
        return active;
      } catch (error) {
        console.error('Error loading products:', error);
        return [];
      }
    },
    [] // Empty deps - only fetch once, auto-updates when DB changes
  );

  // Filter products from cache based on search term
  const products = useMemo(() => {
    if (!allActiveProducts) return undefined;
    if (!debouncedSearch) return [];

    // Filter in memory from cached products (much faster than DB query)
    const filtered = allActiveProducts.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(debouncedSearch);
      const categoryMatch = p.category?.toLowerCase().includes(debouncedSearch);
      return nameMatch || categoryMatch;
    });

    // Limit to top 30 results for performance
    return filtered.slice(0, 30);
  }, [allActiveProducts, debouncedSearch]);

  const visibleProducts = useMemo(() => {
    if (!products) return [];
    return products.slice(0, Math.min(itemsToShow, products.length));
  }, [products, itemsToShow]);

  const effectiveHighlightedIndex =
    highlightedIndex >= visibleProducts.length ? -1 : highlightedIndex;

  // Scroll highlighted item into view
  useEffect(() => {
    if (effectiveHighlightedIndex >= 0 && resultsContainerRef.current) {
      const items = resultsContainerRef.current.querySelectorAll('.product-result-item');
      if (items[effectiveHighlightedIndex]) {
        items[effectiveHighlightedIndex].scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [effectiveHighlightedIndex]);

  // Handle adding product to cart
  const handleAddProduct = (product: Product) => {
    onAddToCart(product);
    // Keep search text and visible list so user can add multiple products quickly
    
    // Show feedback message
    setFeedbackMessage(`Đã thêm: ${product.name}`);
    setTimeout(() => setFeedbackMessage(null), 2000);
    
    // NOTE: Do not focus back to search input here, 
    // because page.tsx focuses the qty input of the new item
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!visibleProducts || visibleProducts.length === 0) {
      if (e.key === 'Escape') {
        setSearch('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const maxIndex = visibleProducts.length - 1;
          if (maxIndex < 0) return -1;
          const clampedPrev = Math.min(Math.max(prev, -1), maxIndex);
          return clampedPrev < maxIndex ? clampedPrev + 1 : clampedPrev;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < visibleProducts.length) {
          handleAddProduct(visibleProducts[highlightedIndex]);
        } else if (visibleProducts.length === 1) {
          // If only one result, add it
          handleAddProduct(visibleProducts[0]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setSearch('');
        setHighlightedIndex(-1);
        setItemsToShow(INITIAL_VISIBLE);
        break;
    }
  };

  const hasSearch = debouncedSearch.length > 0;
  const hasResults = visibleProducts && visibleProducts.length > 0;
  const showResults = hasSearch && (hasResults || products?.length === 0);

  const handleResultsScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    if (!products) return;
    if (itemsToShow >= products.length) return;

    const el = e.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom <= SCROLL_THRESHOLD_PX) {
      setItemsToShow((prev) => Math.min(prev + LOAD_MORE_COUNT, products.length));
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {/* Search Input */}
      <div className="space-y-1">
        <label htmlFor="product-search-input" className="block text-xs font-medium text-slate-500">
          {vi.invoices.productSearch || 'Tìm sản phẩm'}
        </label>
        <input
          id="product-search-input"
          ref={searchInputRef}
          type="text"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
          placeholder="Nhập tên sản phẩm để thêm…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            // Reset highlight when user types (immediate feedback)
            setHighlightedIndex(-1);
            setItemsToShow(INITIAL_VISIBLE);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {feedbackMessage && (
          <div className="mt-1 text-xs text-green-600">{feedbackMessage}</div>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div
          ref={resultsContainerRef}
          className="mt-2 rounded-md border border-slate-200 bg-white shadow-sm"
          style={{ maxHeight: RESULTS_MAX_HEIGHT, overflowY: 'auto' }}
          onScroll={handleResultsScroll}
        >
          {hasResults ? (
            visibleProducts.map((product, index) => {
              const inCart = cartProductIds.has(product.id);
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={product.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-2 text-sm',
                    isHighlighted && 'bg-slate-50',
                    inCart && 'bg-green-50'
                  )}
                  onClick={() => handleAddProduct(product)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.name}</span>
                      {product.category && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] text-slate-500">
                          {product.category}
                        </span>
                      )}
                      {inCart && (
                        <span className="rounded-full bg-green-600 px-2 py-0.5 text-[0.7rem] text-white">
                          Đã thêm
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span className="text-xs text-slate-400">{product.unit}</span>
                      <span className="text-xs text-slate-500">
                        <span className={cn(priceTier === 'price1' && 'font-semibold text-blue-600')}>
                          G1: {formatPriceDisplay(product.price1)}
                        </span>
                        <span className="mx-1 text-slate-200">|</span>
                        <span className={cn(priceTier === 'price2' && 'font-semibold text-blue-600')}>
                          G2: {formatPriceDisplay(product.price2)}
                        </span>
                        <span className="mx-1 text-slate-200">|</span>
                        <span className={cn(priceTier === 'price3' && 'font-semibold text-blue-600')}>
                          G3: {formatPriceDisplay(product.price3)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-2 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-white transition-colors hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddProduct(product);
                    }}
                  >
                    + Thêm
                  </button>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-center text-slate-400">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          )}
        </div>
      )}

      {/* Empty State (no search) */}
      {!hasSearch && (
        <div className="mt-2 text-xs text-slate-400">
          Gõ tên sản phẩm để tìm…
        </div>
      )}
    </div>
  );
}
