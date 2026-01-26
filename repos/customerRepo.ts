/**
 * Customer Repository
 * CRUD operations for customers with debt management
 */

import { nanoid } from 'nanoid';
import { db } from '../db';
import type { Customer, CustomerInput, CustomerUpdateInput } from '../domain/models';

export const customerRepo = {
  /**
   * List all customers, optionally filtered by search term
   * Searches in name and phone fields
   */
  async list(search?: string): Promise<Customer[]> {
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      const all = await db.customers.orderBy('createdAt').reverse().toArray();
      return all.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
      );
    }

    return db.customers.orderBy('createdAt').reverse().toArray();
  },

  /**
   * Get a customer by ID
   */
  async getById(id: string): Promise<Customer | undefined> {
    return db.customers.get(id);
  },

  /**
   * Create a new customer
   */
  async create(input: CustomerInput): Promise<Customer> {
    const now = Date.now();
    const customer: Customer = {
      id: nanoid(),
      name: input.name,
      phone: input.phone,
      address: input.address,
      note: input.note,
      debt: input.debt ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.customers.add(customer);
    return customer;
  },

  /**
   * Update an existing customer
   */
  async update(id: string, input: CustomerUpdateInput): Promise<Customer | undefined> {
    const existing = await db.customers.get(id);
    if (!existing) return undefined;

    const updated: Customer = {
      ...existing,
      ...input,
      updatedAt: Date.now(),
    };

    await db.customers.put(updated);
    return updated;
  },

  /**
   * Increase customer debt
   */
  async increaseDebt(id: string, amount: number): Promise<Customer | undefined> {
    const existing = await db.customers.get(id);
    if (!existing) return undefined;

    const updated: Customer = {
      ...existing,
      debt: existing.debt + amount,
      updatedAt: Date.now(),
    };

    await db.customers.put(updated);
    return updated;
  },

  /**
   * Hard delete a customer
   * Note: Invoices will retain customerId but customer lookup will return null
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.customers.delete(id);
    return result !== undefined;
  },
};
