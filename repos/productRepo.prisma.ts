/**
 * Product Repository - Prisma Implementation
 * CRUD operations for products with soft delete support
 */

import { prisma } from '@/lib/prisma'
import type { Product, Prisma } from '@/lib/generated/prisma/client'

export type ProductCreateInput = {
  name: string
  category?: string | null
  unit: string
  price1?: number | null
  price2?: number | null
  price3?: number | null
  note?: string | null
  active?: boolean
  sourceId?: number | null
}

export type ProductUpdateInput = Partial<ProductCreateInput>

export type ProductSearchOptions = {
  search?: string
  category?: string
  active?: boolean
  limit?: number
  offset?: number
}

/**
 * Get the first non-null price from a product
 */
export function getDefaultPrice(product: Product): number {
  return Number(product.price1 ?? product.price2 ?? product.price3 ?? 0)
}

export const productRepo = {
  /**
   * List products with optional filtering and pagination
   */
  async list(options: ProductSearchOptions = {}): Promise<Product[]> {
    const {
      search,
      category,
      active = true,
      limit = 100,
      offset = 0,
    } = options

    const where: Prisma.ProductWhereInput = {
      active,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    return prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    })
  },

  /**
   * List all products including inactive (for admin/backup)
   */
  async listAll(): Promise<Product[]> {
    return prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })
  },

  /**
   * Get a product by ID
   */
  async getById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
    })
  },

  /**
   * Get products by IDs (bulk fetch)
   */
  async getByIds(ids: string[]): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        id: { in: ids },
      },
    })
  },

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const result = await prisma.product.findMany({
      where: {
        category: { not: null },
        active: true,
      },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    return result
      .map((r) => r.category)
      .filter((c): c is string => c !== null)
  },

  /**
   * Create a new product
   */
  async create(input: ProductCreateInput): Promise<Product> {
    return prisma.product.create({
      data: {
        name: input.name,
        category: input.category,
        unit: input.unit,
        price1: input.price1,
        price2: input.price2,
        price3: input.price3,
        note: input.note,
        active: input.active ?? true,
        sourceId: input.sourceId,
      },
    })
  },

  /**
   * Update an existing product
   */
  async update(id: string, input: ProductUpdateInput): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: input,
    })
  },

  /**
   * Soft delete a product (set active = false)
   * We don't hard delete to preserve invoice history
   */
  async softDelete(id: string): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: { active: false },
    })
  },

  /**
   * Restore a soft-deleted product
   */
  async restore(id: string): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: { active: true },
    })
  },

  /**
   * Hard delete a product (use with caution!)
   * This will fail if product is referenced in invoices
   */
  async hardDelete(id: string): Promise<Product> {
    return prisma.product.delete({
      where: { id },
    })
  },

  /**
   * Bulk create products
   */
  async bulkCreate(products: ProductCreateInput[]): Promise<number> {
    const result = await prisma.product.createMany({
      data: products,
      skipDuplicates: true,
    })
    return result.count
  },

  /**
   * Count products
   */
  async count(options: ProductSearchOptions = {}): Promise<number> {
    const { search, category, active = true } = options

    const where: Prisma.ProductWhereInput = {
      active,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    return prisma.product.count({ where })
  },

  /**
   * Check if product exists by name, category, and unit
   */
  async existsByKey(
    name: string,
    category: string | null,
    unit: string
  ): Promise<boolean> {
    const product = await prisma.product.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        category: category ?? null,
        unit: { equals: unit, mode: 'insensitive' },
      },
    })
    return product !== null
  },
}
