/**
 * Dexie Database Configuration for POS MVP
 * IndexedDB wrapper with typed tables
 */

import Dexie, { type EntityTable } from 'dexie';
import type {
  Product,
  Customer,
  Invoice,
  InvoiceItem,
  Counter,
  User,
} from '../domain/models';

// Database class with typed tables
class POSDatabase extends Dexie {
  products!: EntityTable<Product, 'id'>;
  customers!: EntityTable<Customer, 'id'>;
  invoices!: EntityTable<Invoice, 'id'>;
  invoiceItems!: EntityTable<InvoiceItem, 'id'>;
  counters!: EntityTable<Counter, 'key'>;
  users!: EntityTable<User, 'id'>;

  constructor() {
    super('pos-mvp-db');

    // Schema version 3: Added users table for authentication
    this.version(3).stores({
      products: 'id, name, category, active, createdAt',
      customers: 'id, name, phone, createdAt',
      invoices: 'id, invoiceNo, customerId, createdAt',
      invoiceItems: 'id, invoiceId, productId',
      counters: 'key',
      users: 'id, displayName, role, active',
    });

    // Schema version 2: Added new product fields, customer debt, invoice debtIncrease
    // Migration from v1: old 'price' field mapped to 'price1', debt defaults to 0
    this.version(2).stores({
      // Products: indexed by id, name for search, active for filtering, category for grouping
      products: 'id, name, category, active, createdAt',

      // Customers: indexed by id, name and phone for search
      customers: 'id, name, phone, createdAt',

      // Invoices: indexed by id, invoiceNo for lookup, customerId for filter
      invoices: 'id, invoiceNo, customerId, createdAt',

      // Invoice items: indexed by id, invoiceId for lookup
      invoiceItems: 'id, invoiceId, productId',

      // Counters: key is primary key (e.g., "invoice_2025")
      counters: 'key',
    }).upgrade(tx => {
      // Migrate products: convert old price to price1
      return tx.table('products').toCollection().modify(product => {
        if ('price' in product && !('price1' in product)) {
          product.price1 = product.price;
          product.price2 = null;
          product.price3 = null;
          delete product.price;
        }
        if (!('category' in product)) {
          product.category = undefined;
        }
        if (!('note' in product)) {
          product.note = undefined;
        }
      });
    });

    // Also handle customers and invoices migration
    this.version(2).upgrade(tx => {
      // Migrate customers: add debt field
      tx.table('customers').toCollection().modify(customer => {
        if (!('debt' in customer)) {
          customer.debt = 0;
        }
      });

      // Migrate invoices: add debtIncrease field
      tx.table('invoices').toCollection().modify(invoice => {
        if (!('debtIncrease' in invoice)) {
          invoice.debtIncrease = 0;
        }
      });
    });

    // Keep version 1 schema for initial DB creation backwards compat
    this.version(1).stores({
      products: 'id, name, active, createdAt',
      customers: 'id, name, phone, createdAt',
      invoices: 'id, invoiceNo, customerId, createdAt',
      invoiceItems: 'id, invoiceId, productId',
      counters: 'key',
    });
  }
}

// Singleton database instance
export const db = new POSDatabase();

// Export table types for convenience
export type { POSDatabase };
