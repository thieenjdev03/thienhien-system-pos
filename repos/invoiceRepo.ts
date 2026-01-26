/**
 * Invoice Repository
 * Handles invoice creation with transaction support
 * Manages invoice numbering via counters table
 * Handles debt increase for customers
 */

import { nanoid } from 'nanoid';
import { db } from '../db';
import type {
  Invoice,
  InvoiceItem,
  InvoiceCreateInput,
  Counter,
} from '../domain/models';

// Invoice with items for detail view
export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

/**
 * Generate invoice number in format HD-YYYY-XXXXXX
 * Uses counter table to track sequential numbers per year
 */
async function generateInvoiceNo(): Promise<string> {
  const year = new Date().getFullYear();
  const counterKey = `invoice_${year}`;

  // Get or create counter
  let counter = await db.counters.get(counterKey);
  let nextValue: number;

  if (counter) {
    nextValue = counter.value + 1;
    await db.counters.update(counterKey, { value: nextValue });
  } else {
    nextValue = 1;
    const newCounter: Counter = { key: counterKey, value: nextValue };
    await db.counters.add(newCounter);
  }

  // Format: HD-2025-000001
  const paddedNumber = String(nextValue).padStart(6, '0');
  return `HD-${year}-${paddedNumber}`;
}

export const invoiceRepo = {
  /**
   * List all invoices sorted by creation date (newest first)
   */
  async list(): Promise<Invoice[]> {
    return db.invoices.orderBy('createdAt').reverse().toArray();
  },

  /**
   * Get invoice by ID with items
   */
  async getById(id: string): Promise<InvoiceWithItems | undefined> {
    const invoice = await db.invoices.get(id);
    if (!invoice) return undefined;

    const items = await db.invoiceItems
      .where('invoiceId')
      .equals(id)
      .toArray();

    return { ...invoice, items };
  },

  /**
   * Get invoice items by invoice ID
   */
  async getItems(invoiceId: string): Promise<InvoiceItem[]> {
    return db.invoiceItems.where('invoiceId').equals(invoiceId).toArray();
  },

  /**
   * Create a new invoice with items in a single transaction
   * - Generates sequential invoice number
   * - Calculates totals and debt increase
   * - Stores product snapshots in invoice items
   * - Updates customer debt if applicable
   */
  async create(input: InvoiceCreateInput): Promise<InvoiceWithItems> {
    return db.transaction('rw', [db.invoices, db.invoiceItems, db.counters, db.customers], async () => {
      const now = Date.now();
      const invoiceId = nanoid();
      const invoiceNo = await generateInvoiceNo();

      // Calculate totals
      const subtotal = input.lines.reduce((sum, line) => sum + line.lineTotal, 0);
      const total = subtotal - input.discount;
      const change = input.paid - total;

      // Calculate debt increase: max(0, total - paid)
      // If customer paid less than total, the difference becomes debt
      const debtIncrease = Math.max(0, total - input.paid);

      // Create invoice
      const invoice: Invoice = {
        id: invoiceId,
        invoiceNo,
        customerId: input.customerId,
        createdAt: now,
        subtotal,
        discount: input.discount,
        total,
        paid: input.paid,
        change,
        debtIncrease,
        note: input.note,
      };

      await db.invoices.add(invoice);

      // Create invoice items with snapshots
      const items: InvoiceItem[] = input.lines.map(line => ({
        id: nanoid(),
        invoiceId,
        productId: line.productId,
        productNameSnapshot: line.productName,
        categorySnapshot: line.category,
        unitSnapshot: line.unit,
        qty: line.qty,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        noteSnapshot: line.note,
      }));

      await db.invoiceItems.bulkAdd(items);

      // Update customer debt if applicable
      if (input.customerId && debtIncrease > 0) {
        const customer = await db.customers.get(input.customerId);
        if (customer) {
          await db.customers.update(input.customerId, {
            debt: customer.debt + debtIncrease,
            updatedAt: now,
          });
        }
      }

      return { ...invoice, items };
    });
  },

  /**
   * Get the current counter value for a year
   * Useful for displaying "next invoice number" preview
   */
  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counterKey = `invoice_${year}`;
    const counter = await db.counters.get(counterKey);
    const nextValue = (counter?.value ?? 0) + 1;
    const paddedNumber = String(nextValue).padStart(6, '0');
    return `HD-${year}-${paddedNumber}`;
  },
};
