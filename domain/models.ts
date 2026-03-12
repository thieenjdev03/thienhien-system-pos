/**
 * Domain Models for POS MVP
 * All entities stored in IndexedDB via Dexie
 */

// Product - items available for sale
export interface Product {
  id: string;
  name: string;
  category?: string; // product category
  unit: string; // e.g., "cái", "kg", "hộp"
  price1: number | null; // tier 1 price (main price)
  price2: number | null; // tier 2 price
  price3: number | null; // tier 3 price
  note?: string; // product note
  active: boolean; // soft delete flag
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  sourceId?: number; // external source ID if imported
}

// Customer - buyer information
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  debt: number; // customer debt (>= 0)
  createdAt: number;
  updatedAt: number;
}

// Invoice - sales transaction header
export interface Invoice {
  id: string;
  invoiceNo: string; // HD-YYYY-XXXXXX format
  customerId: string | null; // null = "Bán lẻ" (walk-in)
  createdAt: number;
  subtotal: number; // sum of line totals
  discount: number; // discount amount
  total: number; // subtotal - discount
  paid: number; // amount paid
  change: number; // paid - total (can be negative)
  debtIncrease: number; // debt increase from this invoice (max(0, total - paid))
  note?: string;
}

// InvoiceItem - line items in an invoice
// Stores snapshots to preserve historical data
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  productNameSnapshot: string; // product name at time of sale
  categorySnapshot?: string; // category at time of sale
  unitSnapshot: string; // unit at time of sale
  qty: number;
  unitPrice: number; // price at time of sale
  lineTotal: number; // qty * unitPrice
  noteSnapshot?: string; // product note at time of sale
}

// Counter - for generating sequential invoice numbers
export interface Counter {
  key: string; // e.g., "invoice_2025"
  value: number; // current counter value
}

// ============================================
// Input types for creating/updating entities
// ============================================

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type ProductUpdateInput = Partial<Omit<Product, 'id' | 'createdAt'>>;

export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
export type CustomerUpdateInput = Partial<Omit<Customer, 'id' | 'createdAt'>>;

// Price tier enum for cart line selection
export type PriceTier = 'price1' | 'price2' | 'price3';

// Cart line used in UI before saving invoice
export interface CartLine {
  productId: string;
  productName: string;
  category?: string;
  unit: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  note?: string;
  priceTier: PriceTier; // which price tier was selected
  // Available prices for reference
  price1: number | null;
  price2: number | null;
  price3: number | null;
}

// Input for creating an invoice
export interface InvoiceCreateInput {
  customerId: string | null;
  lines: CartLine[];
  discount: number;
  paid: number;
  note?: string;
}

// ============================================
// Backup payload structure
// ============================================

export interface BackupMeta {
  version: number;
  exportedAt: string; // ISO date string
  appName: string;
}

export interface BackupData {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  counters: Counter[];
  users: User[];
}

export interface BackupPayload {
  meta: BackupMeta;
  data: BackupData;
}

// ============================================
// Authentication Models
// ============================================

// User - store owner/operator authentication
export interface User {
  id: string;
  pinHash: string; // SHA-256 hashed PIN
  displayName: string;
  role: 'admin' | 'cashier';
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

// Auth session stored in localStorage
export interface AuthSession {
  userId: string;
  displayName: string;
  role: 'admin' | 'cashier';
  expiresAt: number; // timestamp
}
