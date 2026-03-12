/**
 * Product Search & Add Panel for Invoice Creation
 * Features: debounced search, keyboard navigation, quick add to cart
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

/**
 * Map API product payload (Prisma model) to domain Product
 */
function mapApiProductToDomain(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category ?? undefined,
    unit: p.unit,
    price1: p.price1 === null || p.price1 === undefined ? null : Number(p.price1),
    price2: p.price2 === null || p.price2 === undefined ? null : Number(p.price2),
    price3: p.price3 === null || p.price3 === undefined ? null : Number(p.price3),
    note: p.note ?? undefined,
    active: Boolean(p.active),
    createdAt: new Date(p.createdAt).getTime(),
    updatedAt: new Date(p.updatedAt).getTime(),
    sourceId: p.sourceId ?? undefined,
  };
}

export function ProductSearchAddPanel({
  onAddToCart,
  priceTier,
  cartProductIds,
  searchInputRef,
}: ProductSearchAddPanelProps) {
  const PAGE_SIZE = 10;
  const SCROLL_THRESHOLD_PX = 32;
  const RESULTS_MAX_HEIGHT = '360px'; // ~5 items tall; keeps list compact

  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search input (300ms)
  const debouncedSearch = useDebounce(search.trim().toLowerCase(), 300);

  const effectiveHighlightedIndex =
    highlightedIndex >= products.length ? -1 : highlightedIndex;

  const fetchProducts = useCallback(
    async ({
      searchTerm,
      offset: fetchOffset,
      append,
    }: {
      searchTerm: string;
      offset: number;
      append: boolean;
    }) => {
      if (!searchTerm.trim()) {
        setProducts([]);
        setHasMore(false);
        setOffset(0);
        setError(null);
        return;
      }

      const loadingMore = append && fetchOffset > 0;
      if (loadingMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('search', searchTerm);
        params.set('active', 'true');
        params.set('limit', PAGE_SIZE.toString());
        params.set('offset', String(fetchOffset));

        const res = await fetch(`/api/products?${params.toString()}`, {
          method: 'GET',
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch products (${res.status})`);
        }

        const json = await res.json();
        const apiProducts = (json?.data ?? []) as any[];
        const mapped = apiProducts.map(mapApiProductToDomain);

        setProducts((prev) => (append ? [...prev, ...mapped] : mapped));

        const pagination = json?.pagination;
        const nextHasMore = Boolean(pagination?.hasMore);
        setHasMore(nextHasMore);
        setOffset(fetchOffset + mapped.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : vi.validation.invalidValue);
      } finally {
        if (loadingMore) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [PAGE_SIZE]
  );

  // Load first page when search term changes (debounced)
  useEffect(() => {
    if (!debouncedSearch) {
      setProducts([]);
      setHasMore(false);
      setOffset(0);
      setError(null);
      return;
    }

    fetchProducts({ searchTerm: debouncedSearch, offset: 0, append: false });
  }, [debouncedSearch, fetchProducts]);

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
    if (!products || products.length === 0) {
      if (e.key === 'Escape') {
        setSearch('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const maxIndex = products.length - 1;
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
        if (highlightedIndex >= 0 && highlightedIndex < products.length) {
          handleAddProduct(products[highlightedIndex]);
        } else if (products.length === 1) {
          // If only one result, add it
          handleAddProduct(products[0]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setSearch('');
        setHighlightedIndex(-1);
        setProducts([]);
        setHasMore(false);
        setOffset(0);
        break;
    }
  };

  const hasSearch = debouncedSearch.length > 0;
  const hasResults = products && products.length > 0;
  const showResults = hasSearch && (hasResults || (!isLoading && products.length === 0));

  const handleResultsScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom <= SCROLL_THRESHOLD_PX) {
      if (!hasMore || isLoading || isLoadingMore) return;
      fetchProducts({ searchTerm: debouncedSearch, offset, append: true });
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
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {feedbackMessage && (
          <div className="mt-1 text-xs text-green-600">{feedbackMessage}</div>
        )}
        {error && (
          <div className="mt-1 text-xs text-red-600">{error}</div>
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
          {isLoading && products.length === 0 ? (
            <div className="px-3 py-2 text-center text-slate-400">
              Đang tải sản phẩm...
            </div>
          ) : hasResults ? (
            <>
              {products.map((product, index) => {
              const inCart = cartProductIds.has(product.id);
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={product.id}
                  className={cn(
                    'product-result-item flex cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-2 text-sm',
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
            })}
              {isLoadingMore && (
                <div className="px-3 py-2 text-center text-xs text-slate-400">
                  Đang tải thêm sản phẩm...
                </div>
              )}
              {!isLoadingMore && !hasMore && products.length > 0 && (
                <div className="px-3 py-2 text-center text-xs text-slate-300">
                  Đã hiển thị tất cả kết quả.
                </div>
              )}
            </>
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
