/**
 * Zod Validation Schemas for POS MVP
 * Used for form validation and backup import validation
 */

import { z } from 'zod';
import { t } from '../shared/i18n/vi';

// ============================================
// Entity Schemas (for backup validation)
// ============================================

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().min(1),
  price1: z.number().nonnegative().nullable(),
  price2: z.number().nonnegative().nullable(),
  price3: z.number().nonnegative().nullable(),
  note: z.string().optional(),
  active: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
  sourceId: z.number().optional(),
});

export const CustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  debt: z.number().nonnegative().default(0),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const InvoiceSchema = z.object({
  id: z.string().min(1),
  invoiceNo: z.string().min(1),
  customerId: z.string().nullable(),
  createdAt: z.number(),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  total: z.number(),
  paid: z.number().nonnegative(),
  change: z.number(),
  debtIncrease: z.number().nonnegative().default(0),
  note: z.string().optional(),
});

export const InvoiceItemSchema = z.object({
  id: z.string().min(1),
  invoiceId: z.string().min(1),
  productId: z.string().min(1),
  productNameSnapshot: z.string().min(1),
  categorySnapshot: z.string().optional(),
  unitSnapshot: z.string().min(1),
  qty: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
  noteSnapshot: z.string().optional(),
});

export const CounterSchema = z.object({
  key: z.string().min(1),
  value: z.number().int().nonnegative(),
});

// ============================================
// Backup Payload Schema (v1/v2)
// ============================================

export const BackupMetaSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.string().datetime(),
  appName: z.literal('POS-MVP'),
});

export const BackupDataSchema = z.object({
  products: z.array(ProductSchema),
  customers: z.array(CustomerSchema),
  invoices: z.array(InvoiceSchema),
  invoiceItems: z.array(InvoiceItemSchema),
  counters: z.array(CounterSchema),
  // v2+: include users (missing in v1 payloads)
  users: z
    .array(
      z.object({
        id: z.string().min(1),
        pinHash: z.string().min(1),
        displayName: z.string().min(1),
        role: z.enum(['admin', 'cashier']),
        active: z.boolean(),
        createdAt: z.number(),
        updatedAt: z.number(),
      })
    )
    .optional()
    .default([]),
});

export const BackupPayloadSchema = z.object({
  meta: BackupMetaSchema,
  data: BackupDataSchema,
});

// ============================================
// Form Input Schemas
// ============================================

export const ProductInputSchema = z.object({
  name: z.string().min(1, t('validation.nameRequired')),
  category: z.string().optional(),
  unit: z.string().min(1, t('validation.required').replace('{field}', 'đơn vị')),
  price1: z.number().nonnegative(t('validation.priceNonNegative')).nullable(),
  price2: z.number().nonnegative(t('validation.priceNonNegative')).nullable(),
  price3: z.number().nonnegative(t('validation.priceNonNegative')).nullable(),
  note: z.string().optional(),
  active: z.boolean().default(true),
  sourceId: z.number().optional(),
});

export const ProductUpdateSchema = ProductInputSchema.partial();

export const CustomerInputSchema = z.object({
  name: z.string().min(1, t('validation.nameRequired')),
  phone: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  debt: z.number().nonnegative().default(0),
});

export const CustomerUpdateSchema = CustomerInputSchema.partial();

export const PriceTierSchema = z.enum(['price1', 'price2', 'price3']);

export const CartLineSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().min(1),
  qty: z.number().int().positive(t('validation.qtyPositive')),
  unitPrice: z.number().nonnegative(t('validation.priceNonNegative')),
  lineTotal: z.number().nonnegative(),
  note: z.string().optional(),
  priceTier: PriceTierSchema,
  price1: z.number().nonnegative().nullable(),
  price2: z.number().nonnegative().nullable(),
  price3: z.number().nonnegative().nullable(),
});

export const InvoiceCreateInputSchema = z.object({
  customerId: z.string().nullable(),
  lines: z.array(CartLineSchema).min(1, t('validation.atLeastOneItem')),
  discount: z.number().nonnegative(t('validation.discountNonNegative')),
  paid: z.number().nonnegative(t('validation.paidNonNegative')),
  note: z.string().optional(),
});

// ============================================
// Product Import Schema (for JSON import)
// ============================================

/**
 * Flexible schema for importing products from JSON
 * Handles various input formats and normalizes them
 */
const toNumberOrNull = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (isNaN(num) || num < 0) return null;
  return num;
};

const trimString = (val: unknown): string => {
  if (typeof val === 'string') return val.trim();
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

export const ProductImportItemSchema = z.object({
  // Source ID from original data (optional)
  id: z.union([z.number(), z.string()]).optional(),
  // Required fields
  name: z.preprocess(trimString, z.string().min(1, 'Thiếu tên sản phẩm')),
  unit: z.preprocess(trimString, z.string().min(1, 'Thiếu đơn vị')),
  // Optional fields
  category: z.preprocess(
    (val) => {
      const s = trimString(val);
      return s === '' ? null : s;
    },
    z.string().nullable().default(null)
  ),
  price1: z.preprocess(toNumberOrNull, z.number().nonnegative().nullable().default(null)),
  price2: z.preprocess(toNumberOrNull, z.number().nonnegative().nullable().default(null)),
  price3: z.preprocess(toNumberOrNull, z.number().nonnegative().nullable().default(null)),
  note: z.preprocess(
    (val) => {
      const s = trimString(val);
      return s === '' ? null : s;
    },
    z.string().nullable().default(null)
  ),
  active: z.boolean().optional().default(true),
});

export type ProductImportItem = z.infer<typeof ProductImportItemSchema>;

// ============================================
// Type inference from schemas
// ============================================

export type ProductInputType = z.infer<typeof ProductInputSchema>;
export type CustomerInputType = z.infer<typeof CustomerInputSchema>;
export type InvoiceCreateInputType = z.infer<typeof InvoiceCreateInputSchema>;
export type BackupPayloadType = z.infer<typeof BackupPayloadSchema>;
export type PriceTierType = z.infer<typeof PriceTierSchema>;
