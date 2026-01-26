/**
 * Product Repository
 * CRUD operations for products with soft delete support
 */

import { nanoid } from 'nanoid';
import { db } from '../db';
import type { Product, ProductInput, ProductUpdateInput } from '../domain/models';
import type { ProductImportItem } from '../domain/schemas';

/**
 * Import mode for bulk operations
 */
export type ImportMode = 'upsert' | 'replace';

/**
 * Result of a bulk import operation
 */
export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

/**
 * Generate unique key for product matching (category|name|unit)
 */
function getProductKey(item: { category?: string | null; name: string; unit: string }): string {
  return `${item.category ?? ''}|${item.name}|${item.unit}`.toLowerCase();
}

/**
 * Get the first non-null price from a product
 */
export function getDefaultPrice(product: Product): number {
  return product.price1 ?? product.price2 ?? product.price3 ?? 0;
}

export const productRepo = {
  /**
   * List all active products, optionally filtered by search term
   */
  async list(search?: string): Promise<Product[]> {
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      const all = await db.products.where('active').equals(1).toArray();
      return all.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    }

    return db.products.where('active').equals(1).toArray();
  },

  /**
   * List all products including inactive (for admin/backup)
   */
  async listAll(): Promise<Product[]> {
    return db.products.orderBy('createdAt').reverse().toArray();
  },

  /**
   * Get a product by ID
   */
  async getById(id: string): Promise<Product | undefined> {
    return db.products.get(id);
  },

  /**
   * Create a new product
   */
  async create(input: ProductInput): Promise<Product> {
    const now = Date.now();
    const product: Product = {
      id: nanoid(),
      name: input.name,
      category: input.category,
      unit: input.unit,
      price1: input.price1,
      price2: input.price2,
      price3: input.price3,
      note: input.note,
      active: input.active ?? true,
      sourceId: input.sourceId,
      createdAt: now,
      updatedAt: now,
    };

    await db.products.add(product);
    return product;
  },

  /**
   * Update an existing product
   */
  async update(id: string, input: ProductUpdateInput): Promise<Product | undefined> {
    const existing = await db.products.get(id);
    if (!existing) return undefined;

    const updated: Product = {
      ...existing,
      ...input,
      updatedAt: Date.now(),
    };

    await db.products.put(updated);
    return updated;
  },

  /**
   * Soft delete a product (set active = false)
   * We don't hard delete to preserve invoice history
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await db.products.update(id, {
      active: false,
      updatedAt: Date.now(),
    });
    return result > 0;
  },

  /**
   * Restore a soft-deleted product
   */
  async restore(id: string): Promise<boolean> {
    const result = await db.products.update(id, {
      active: true,
      updatedAt: Date.now(),
    });
    return result > 0;
  },

  /**
   * Bulk import products from validated import items
   * @param items - Array of validated ProductImportItem
   * @param mode - 'upsert' or 'replace'
   * @returns ImportResult with counts and errors
   */
  async bulkImport(items: ProductImportItem[], mode: ImportMode): Promise<ImportResult> {
    const result: ImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    const now = Date.now();

    return db.transaction('rw', db.products, async () => {
      // For replace mode, clear all products first
      if (mode === 'replace') {
        await db.products.clear();
      }

      // Build index map of existing products for upsert mode
      let existingMap: Map<string, Product> = new Map();
      if (mode === 'upsert') {
        const allProducts = await db.products.toArray();
        for (const p of allProducts) {
          existingMap.set(getProductKey(p), p);
        }
      }

      // Process items in batches
      const productsToAdd: Product[] = [];
      const productsToUpdate: Product[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const key = getProductKey(item);

        // Parse sourceId from original id if numeric
        let sourceId: number | undefined;
        if (typeof item.id === 'number') {
          sourceId = item.id;
        } else if (typeof item.id === 'string' && /^\d+$/.test(item.id)) {
          sourceId = parseInt(item.id, 10);
        }

        if (mode === 'upsert') {
          const existing = existingMap.get(key);
          if (existing) {
            // Update existing product
            const updated: Product = {
              ...existing,
              category: item.category ?? undefined,
              price1: item.price1,
              price2: item.price2,
              price3: item.price3,
              note: item.note ?? undefined,
              sourceId: sourceId ?? existing.sourceId,
              active: item.active ?? existing.active,
              updatedAt: now,
            };
            productsToUpdate.push(updated);
            result.updated++;
          } else {
            // Create new product
            const newProduct: Product = {
              id: nanoid(),
              name: item.name,
              category: item.category ?? undefined,
              unit: item.unit,
              price1: item.price1,
              price2: item.price2,
              price3: item.price3,
              note: item.note ?? undefined,
              active: item.active ?? true,
              sourceId,
              createdAt: now,
              updatedAt: now,
            };
            productsToAdd.push(newProduct);
            // Add to map to handle duplicates within same import
            existingMap.set(key, newProduct);
            result.created++;
          }
        } else {
          // Replace mode - all items are new
          const newProduct: Product = {
            id: nanoid(),
            name: item.name,
            category: item.category ?? undefined,
            unit: item.unit,
            price1: item.price1,
            price2: item.price2,
            price3: item.price3,
            note: item.note ?? undefined,
            active: item.active ?? true,
            sourceId,
            createdAt: now,
            updatedAt: now,
          };
          productsToAdd.push(newProduct);
          result.created++;
        }
      }

      // Bulk insert/update using bulkPut for efficiency
      if (productsToAdd.length > 0) {
        await db.products.bulkAdd(productsToAdd);
      }
      if (productsToUpdate.length > 0) {
        await db.products.bulkPut(productsToUpdate);
      }

      return result;
    });
  },
};
