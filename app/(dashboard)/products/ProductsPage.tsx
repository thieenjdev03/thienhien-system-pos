import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { sortProducts, type SortField, type SortDirection } from '@/utils/sort';
import { ProductForm } from './ProductForm';
import { ImportProductsJsonModal } from './ImportProductsJsonModal';
import { vi } from '@/shared/i18n/vi';
import type { Product, ProductInput } from '@/domain/models';
import { cn } from '@/lib/utils';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

// localStorage keys
const STORAGE_KEY_SORT_FIELD = 'products_sort_field';
const STORAGE_KEY_SORT_DIR = 'products_sort_dir';
const PAGE_SIZE = 10;

// Load sort preferences from localStorage
function loadSortPreferences(): { field: SortField; dir: SortDirection } {
  const field = (localStorage.getItem(STORAGE_KEY_SORT_FIELD) || 'name') as SortField;
  const dir = (localStorage.getItem(STORAGE_KEY_SORT_DIR) || 'asc') as SortDirection;
  return { field, dir };
}

// Save sort preferences to localStorage
function saveSortPreferences(field: SortField, dir: SortDirection): void {
  localStorage.setItem(STORAGE_KEY_SORT_FIELD, field);
  localStorage.setItem(STORAGE_KEY_SORT_DIR, dir);
}

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [rawProducts, setRawProducts] = useState<Product[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = 'Sản phẩm - POS Thiện Hiền';
  }, []);

  // Sort state with localStorage persistence
  const [sortField, setSortField] = useState<SortField>(() => loadSortPreferences().field);
  const [sortDir, setSortDir] = useState<SortDirection>(() => loadSortPreferences().dir);

  // Save to localStorage when sort changes
  useEffect(() => {
    saveSortPreferences(sortField, sortDir);
  }, [sortField, sortDir]);

  // Reset visible window when filters/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [search, sortField, sortDir]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('search', search.trim());
      }
      // Only active products for listing by default
      params.set('active', 'true');
      params.set('limit', '1000');

      const res = await fetch(`/api/products?${params.toString()}`, {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch products (${res.status})`);
      }

      const json = await res.json();
      const apiProducts = (json?.data ?? []) as any[];

      const mapped: Product[] = apiProducts.map((p) => ({
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
      }));

      setRawProducts(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : vi.validation.invalidValue);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  // Fetch products from API whenever search changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Apply sorting to products
  const products = useMemo(() => {
    if (!rawProducts) return undefined;
    return sortProducts(rawProducts, sortField, sortDir);
  }, [rawProducts, sortField, sortDir]);

  // Handle sort field change
  const handleSortFieldChange = (field: SortField) => {
    // If clicking the same field, toggle direction; otherwise set new field with asc
    if (field === sortField) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Handle header click for quick sorting
  const handleHeaderClick = (field: SortField) => {
    handleSortFieldChange(field);
  };

  // Get sort indicator for header
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const canLoadMore = !!products && visibleCount < products.length;

  const loadMore = useCallback(() => {
    if (!products) return;
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, products.length));
  }, [products]);

  const handleAdd = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSave = async (data: ProductInput) => {
    if (editingProduct) {
      await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          unit: data.unit,
          price1: data.price1,
          price2: data.price2,
          price3: data.price3,
          note: data.note,
          active: data.active ?? true,
        }),
      });
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          unit: data.unit,
          price1: data.price1,
          price2: data.price2,
          price3: data.price3,
          note: data.note,
          active: data.active ?? true,
          sourceId: data.sourceId,
        }),
      });
    }

    // Reload from server
    await fetchProducts();
    setShowForm(false);
    setEditingProduct(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  const handleToggleActive = async (product: Product) => {
    if (product.active) {
      if (window.confirm(vi.products.confirmDisable)) {
        await fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: product.name,
            category: product.category,
            unit: product.unit,
            price1: product.price1,
            price2: product.price2,
            price3: product.price3,
            note: product.note,
            active: false,
          }),
        });
      }
    } else {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: product.name,
          category: product.category,
          unit: product.unit,
          price1: product.price1,
          price2: product.price2,
          price3: product.price3,
          note: product.note,
          active: true,
        }),
      });
    }

    await fetchProducts();
  };

  // Dashboard stats
  const stats = useMemo(() => {
    if (!products) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        categories: 0,
        latestUpdatedAt: undefined as Date | undefined,
      };
    }

    const total = products.length;
    const active = products.filter((p) => p.active).length;
    const inactive = total - active;
    const categorySet = new Set(products.map((p) => p.category).filter(Boolean));
    const categories = categorySet.size;

    let latestUpdatedAt: Date | undefined;
    for (const p of products) {
      if (p.updatedAt) {
        const d = new Date(p.updatedAt);
        if (!latestUpdatedAt || d > latestUpdatedAt) {
          latestUpdatedAt = d;
        }
      }
    }

    return { total, active, inactive, categories, latestUpdatedAt };
  }, [products]);

  const tableData = useMemo(() => {
    if (!products) return [];
    return products.slice(0, visibleCount);
  }, [products, visibleCount]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!canLoadMore) return;
        loadMore();
      },
      { root, rootMargin: '200px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore]);

  const columns = useMemo<ColumnDef<Product>[]>(() => {
    return [
      {
        id: 'index',
        header: '#',
        cell: ({ row }) => row.index + 1,
      },
      {
        accessorKey: 'name',
        header: () => (
          <button
            type="button"
            className="inline-flex items-center gap-1"
            onClick={() => handleHeaderClick('name')}
            title={
              sortField === 'name'
                ? sortDir === 'asc'
                  ? vi.products.sortTooltipAsc
                  : vi.products.sortTooltipDesc
                : vi.products.sortTooltipAsc
            }
          >
            {vi.products.name}
            {getSortIndicator('name')}
          </button>
        ),
        cell: ({ getValue }) => (getValue() as string) || '-',
      },
      {
        accessorKey: 'category',
        header: () => (
          <button
            type="button"
            className="inline-flex items-center gap-1"
            onClick={() => handleHeaderClick('category')}
            title={
              sortField === 'category'
                ? sortDir === 'asc'
                  ? vi.products.sortTooltipAsc
                  : vi.products.sortTooltipDesc
                : vi.products.sortTooltipAsc
            }
          >
            {vi.products.category}
            {getSortIndicator('category')}
          </button>
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string | undefined;
          return value && value.trim().length > 0 ? value : '-';
        },
      },
      {
        accessorKey: 'unit',
        header: vi.products.unit,
        cell: ({ getValue }) => (getValue() as string) || '-',
      },
      {
        accessorKey: 'price1',
        header: vi.products.price1,
        cell: ({ getValue }) => {
          const value = getValue() as number | null | undefined;
          return value !== null && value !== undefined ? formatCurrency(value) : '-';
        },
      },
      {
        accessorKey: 'price2',
        header: vi.products.price2,
        cell: ({ getValue }) => {
          const value = getValue() as number | null | undefined;
          return value !== null && value !== undefined ? formatCurrency(value) : '-';
        },
      },
      {
        accessorKey: 'price3',
        header: vi.products.price3,
        cell: ({ getValue }) => {
          const value = getValue() as number | null | undefined;
          return value !== null && value !== undefined ? formatCurrency(value) : '-';
        },
      },
      {
        accessorKey: 'note',
        header: vi.products.note,
        cell: ({ getValue }) => {
          const value = getValue() as string | undefined;
          return (
            <span className="block truncate text-slate-600">
              {value && value.trim().length > 0 ? value : '-'}
            </span>
          );
        },
      },
      {
        accessorKey: 'active',
        header: vi.products.status,
        cell: ({ row }) => {
          const isActive = row.original.active;
          return (
            <span
              className={cn(
                'inline-block rounded-2xl px-2 py-0.5 text-[0.7rem] font-medium',
                isActive
                  ? 'bg-green-100 text-green-600'
                  : 'bg-slate-100 text-slate-400',
              )}
            >
              {isActive ? vi.status.active : vi.status.inactive}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <button
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-slate-900 transition-colors hover:bg-slate-200"
              onClick={() => handleEdit(row.original)}
            >
              {vi.actions.edit}
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-slate-900 transition-colors hover:bg-slate-200"
              onClick={() => handleToggleActive(row.original)}
            >
              {row.original.active ? vi.actions.disable : vi.actions.enable}
            </button>
          </div>
        ),
      },
    ];
  }, [handleHeaderClick, sortField, sortDir, loadMore, handleToggleActive]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header + actions */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{vi.products.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý danh sách sản phẩm, mức giá và trạng thái kinh doanh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-900 transition-colors hover:bg-slate-200"
            onClick={() => setShowImportModal(true)}
          >
            {vi.productImport.importBtn}
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-blue-700"
            onClick={handleAdd}
          >
            + {vi.products.addProduct}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Tổng sản phẩm
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Đang kinh doanh
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Ngưng bán
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.inactive}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Nhóm hàng &amp; cập nhật
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {stats.categories} nhóm
          </p>
          {stats.latestUpdatedAt && (
            <p className="mt-0.5 text-xs text-slate-500">
              Cập nhật gần nhất: {formatDateTime(stats.latestUpdatedAt.getTime())}
            </p>
          )}
        </div>
      </div>


      {/* Products table */}
      <div
        ref={scrollRef}
        className="max-h-[560px] overflow-auto rounded-md border border-slate-200"
      >
        {error && (
          <div className="px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* --- New filter layout --- */}
        <div className="sticky top-0 z-10 mb-1 bg-white/95 backdrop-blur flex flex-col items-stretch gap-2 px-3 py-2 border-b border-slate-100 md:flex-row md:items-center md:gap-4">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              placeholder={vi.products.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
            />
          </div>
          <div className="flex flex-row items-center gap-2 flex-1">
            <label htmlFor="sort-field" className="text-sm font-medium text-slate-600 shrink-0">
              {vi.products.sortBy}:
            </label>
            <select
              id="sort-field"
              value={sortField}
              onChange={(e) => handleSortFieldChange(e.target.value as SortField)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
            >
              <option value="name">{vi.products.sortByName}</option>
              <option value="category">{vi.products.sortByCategory}</option>
              <option value="updatedAt">{vi.products.sortByUpdatedAt}</option>
            </select>
            <label htmlFor="sort-dir" className="text-sm font-medium text-slate-600 shrink-0 ml-2">
              {vi.products.sortOrder}:
            </label>
            <select
              id="sort-dir"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as SortDirection)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
            >
              <option value="asc">{vi.products.sortAsc}</option>
              <option value="desc">{vi.products.sortDesc}</option>
            </select>
          </div>
        </div>
        {/* --- End new filter layout --- */}

        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-slate-100 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'border-b border-slate-200 px-3 py-2 text-left',
                      header.column.id === 'actions' && 'text-right',
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {!products || products.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-10 text-center text-sm text-slate-400"
                >
                  {search ? vi.products.emptySearch : vi.products.emptyState}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-slate-100',
                    !row.original.active && 'opacity-60',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-3 py-2 align-middle',
                        cell.column.id === 'actions' && 'text-right',
                        cell.column.id === 'note' && 'max-w-xs',
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div ref={sentinelRef} className="h-10" />
      </div>

      {products && products.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing {Math.min(visibleCount, products.length)} / {products.length}
          </span>
          {canLoadMore && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadMore}
            >
              Load more
            </button>
          )}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {showImportModal && (
        <ImportProductsJsonModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            // Products will auto-refresh via useLiveQuery
          }}
        />
      )}
    </div>
  );
}
