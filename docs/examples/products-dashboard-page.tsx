/**
 * Example: Products Dashboard Page
 * Client Component using TanStack React Table + infinite scroll
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { formatCurrency } from '@/utils/formatters'
import Link from 'next/link'

type ProductRow = {
  id: string
  name: string
  category: string | null
  unit: string
  price1: unknown
  price2: unknown
  price3: unknown
  note: string | null
}

type ProductsApiResponse = {
  data: ProductRow[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

const PAGE_SIZE = 10

const formatPrice = (value: unknown) => {
  if (value === null || value === undefined) return '-'
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  return formatCurrency(num)
}

const PRODUCT_COLUMNS: ColumnDef<ProductRow>[] = [
  {
    id: 'index',
    header: '#',
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue }) => (getValue() as string) || '-',
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ getValue }) => {
      const value = getValue() as string | null
      return value && value.trim().length > 0 ? value : '-'
    },
  },
  {
    accessorKey: 'unit',
    header: 'Unit',
    cell: ({ getValue }) => (getValue() as string) || '-',
  },
  {
    accessorKey: 'price1',
    header: 'Price 1',
    cell: ({ getValue }) => formatPrice(getValue()),
  },
  {
    accessorKey: 'price2',
    header: 'Price 2',
    cell: ({ getValue }) => formatPrice(getValue()),
  },
  {
    accessorKey: 'price3',
    header: 'Price 3',
    cell: ({ getValue }) => formatPrice(getValue()),
  },
]

export default function ProductsDashboardPage() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef(0)

  const [products, setProducts] = useState<ProductRow[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(async (offset: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      })

      const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`Failed to fetch products (HTTP ${res.status})`)
      }

      const json = (await res.json()) as ProductsApiResponse
      offsetRef.current = json.pagination.offset
      setTotal(json.pagination.total)
      setHasMore(json.pagination.hasMore)

      setProducts((prev) => (offset === 0 ? json.data : [...prev, ...json.data]))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPage(0)
  }, [fetchPage])

  useEffect(() => {
    const root = scrollRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (!hasMore || isLoading) return
        void fetchPage(offsetRef.current + PAGE_SIZE)
      },
      { root, rootMargin: '200px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage, hasMore, isLoading])

  const table = useReactTable({
    data: products,
    columns: PRODUCT_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  })

  const loadedCount = products.length
  const statusText = useMemo(() => {
    if (error) return error
    if (isLoading && loadedCount === 0) return 'Loading...'
    if (!hasMore && loadedCount > 0) return 'All products loaded'
    return ''
  }, [error, hasMore, isLoading, loadedCount])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Products Dashboard</h1>
        <p className="text-gray-600">
          Loaded: {loadedCount}
          {total > 0 ? ` / ${total}` : ''} (page size: {PAGE_SIZE})
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Products (react-table + infinite scroll)</h2>
        <div
          ref={scrollRef}
          className="max-h-[560px] overflow-y-auto rounded-md border border-slate-200 bg-white"
        >
          <table className="data-table !mt-0">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {products.length === 0 && !isLoading && !error && (
                <tr>
                  <td colSpan={PRODUCT_COLUMNS.length} className="empty-row">
                    No products
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div ref={sentinelRef} className="h-10" />
        </div>

        {statusText && <div className="mt-2 text-xs text-slate-500">{statusText}</div>}

        {!isLoading && hasMore && (
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={() => fetchPage(offsetRef.current + PAGE_SIZE)}
          >
            Load more
          </button>
        )}

        {isLoading && loadedCount > 0 && (
          <div className="mt-2 text-xs text-slate-500">Loading more...</div>
        )}
      </div>

      <Link
        href="/products"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        View All Products
      </Link>
    </div>
  )
}
