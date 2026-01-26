import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { productRepo } from '@/repos/productRepo';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { sortProducts, type SortField, type SortDirection } from '@/utils/sort';
import { ProductForm } from './ProductForm';
import { ImportProductsJsonModal } from './ImportProductsJsonModal';
import { vi } from '@/shared/i18n/vi';
import type { Product, ProductInput } from '@/domain/models';
import { cn } from '@/lib/utils';

// localStorage keys
const STORAGE_KEY_SORT_FIELD = 'products_sort_field';
const STORAGE_KEY_SORT_DIR = 'products_sort_dir';

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
  
  // Sort state with localStorage persistence
  const [sortField, setSortField] = useState<SortField>(() => loadSortPreferences().field);
  const [sortDir, setSortDir] = useState<SortDirection>(() => loadSortPreferences().dir);

  // Save to localStorage when sort changes
  useEffect(() => {
    saveSortPreferences(sortField, sortDir);
  }, [sortField, sortDir]);

  // Live query for products - reacts to DB changes
  const rawProducts = useLiveQuery(async () => {
    const term = search.trim().toLowerCase();
    if (term) {
      const all = await db.products.toArray();
      return all.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    }
    return db.products.toArray();
  }, [search]);

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
      await productRepo.update(editingProduct.id, data);
    } else {
      await productRepo.create(data);
    }
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
        await productRepo.softDelete(product.id);
      }
    } else {
      await productRepo.restore(product.id);
    }
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

      {/* Filters: search + sort */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder={vi.products.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="sort-field" className="text-sm font-medium text-slate-600">
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
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-dir" className="text-sm font-medium text-slate-600">
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
      </div>

      {/* Products table */}
      <div className="overflow-x-auto">
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
              <th
                className="cursor-pointer border-b border-slate-200 px-3 py-2 text-left"
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
              </th>
              <th
                className="cursor-pointer border-b border-slate-200 px-3 py-2 text-left"
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
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.products.unit}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.products.price1}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.products.price2}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.products.price3}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.products.note}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.products.status}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {!products || products.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-10 text-center text-sm text-slate-400"
                >
                  {search ? vi.products.emptySearch : vi.products.emptyState}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className={cn(
                    'border-b border-slate-100',
                    !product.active && 'opacity-60',
                  )}
                >
                  <td className="px-3 py-2 align-middle">{product.name}</td>
                  <td className="px-3 py-2 align-middle">
                    {product.category || '-'}
                  </td>
                  <td className="px-3 py-2 align-middle">{product.unit}</td>
                  <td className="px-3 py-2 align-middle">
                    {product.price1 !== null
                      ? formatCurrency(product.price1)
                      : '-'}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    {product.price2 !== null
                      ? formatCurrency(product.price2)
                      : '-'}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    {product.price3 !== null
                      ? formatCurrency(product.price3)
                      : '-'}
                  </td>
                  <td className="max-w-xs px-3 py-2 align-middle">
                    <span className="block truncate text-slate-600">
                      {product.note || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span
                      className={cn(
                        'inline-block rounded-2xl px-2 py-0.5 text-[0.7rem] font-medium',
                        product.active
                          ? 'bg-green-100 text-green-600'
                          : 'bg-slate-100 text-slate-400',
                      )}
                    >
                      {product.active ? vi.status.active : vi.status.inactive}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right align-middle">
                    <div className="flex justify-end gap-2">
                      <button
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-slate-900 transition-colors hover:bg-slate-200"
                        onClick={() => handleEdit(product)}
                      >
                        {vi.actions.edit}
                      </button>
                      <button
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-slate-900 transition-colors hover:bg-slate-200"
                        onClick={() => handleToggleActive(product)}
                      >
                        {product.active ? vi.actions.disable : vi.actions.enable}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
