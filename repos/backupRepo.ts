/**
 * Backup Repository
 * Handles export and import of all data
 */

import { db } from '../db';
import type { BackupPayload, BackupData } from '../domain/models';
import { BackupPayloadSchema } from '../domain/schemas';

const BACKUP_VERSION = 1;
const APP_NAME = 'POS-MVP';

export const backupRepo = {
  /**
   * Export all data as a backup payload
   */
  async exportData(): Promise<BackupPayload> {
    const [products, customers, invoices, invoiceItems, counters] = await Promise.all([
      db.products.toArray(),
      db.customers.toArray(),
      db.invoices.toArray(),
      db.invoiceItems.toArray(),
      db.counters.toArray(),
    ]);

    const payload: BackupPayload = {
      meta: {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        appName: APP_NAME,
      },
      data: {
        products,
        customers,
        invoices,
        invoiceItems,
        counters,
      },
    };

    return payload;
  },

  /**
   * Validate a backup payload using Zod schema
   * Returns validated data or throws error
   */
  validatePayload(payload: unknown): BackupPayload {
    return BackupPayloadSchema.parse(payload);
  },

  /**
   * Import data from a backup payload
   * Clears all existing data and replaces with backup
   * Runs in a transaction for atomicity
   */
  async importData(data: BackupData): Promise<void> {
    await db.transaction('rw', [
      db.products,
      db.customers,
      db.invoices,
      db.invoiceItems,
      db.counters,
    ], async () => {
      // Clear all tables
      await Promise.all([
        db.products.clear(),
        db.customers.clear(),
        db.invoices.clear(),
        db.invoiceItems.clear(),
        db.counters.clear(),
      ]);

      // Import all data
      await Promise.all([
        db.products.bulkPut(data.products),
        db.customers.bulkPut(data.customers),
        db.invoices.bulkPut(data.invoices),
        db.invoiceItems.bulkPut(data.invoiceItems),
        db.counters.bulkPut(data.counters),
      ]);
    });
  },

  /**
   * Download payload as JSON file
   */
  downloadAsFile(payload: BackupPayload): void {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    const filename = `pos-backup-${date}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Read file and parse as JSON
   */
  async readFile(file: File): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result as string);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
};
