/**
 * Customer Repository - Prisma Implementation
 * CRUD operations for customers with debt management
 */

import { prisma } from '@/lib/prisma'
import type { Customer, Prisma } from '@/lib/generated/prisma/client'

export type CustomerCreateInput = {
  name: string
  phone?: string | null
  address?: string | null
  note?: string | null
  debt?: number
}

export type CustomerUpdateInput = Partial<CustomerCreateInput>

export type CustomerSearchOptions = {
  search?: string
  hasDebt?: boolean
  limit?: number
  offset?: number
}

export const customerRepo = {
  /**
   * List customers with optional filtering and pagination
   * Searches in name and phone fields
   */
  async list(options: CustomerSearchOptions = {}): Promise<Customer[]> {
    const { search, hasDebt, limit = 100, offset = 0 } = options

    const where: Prisma.CustomerWhereInput = {
      ...(hasDebt && { debt: { gt: 0 } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    return prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  },

  /**
   * Get a customer by ID
   */
  async getById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { id },
    })
  },

  /**
   * Get a customer by ID with invoices
   */
  async getByIdWithInvoices(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 invoices
        },
      },
    })
  },

  /**
   * Get customer by phone number
   */
  async getByPhone(phone: string): Promise<Customer | null> {
    return prisma.customer.findFirst({
      where: { phone },
    })
  },

  /**
   * Create a new customer
   */
  async create(input: CustomerCreateInput): Promise<Customer> {
    return prisma.customer.create({
      data: {
        name: input.name,
        phone: input.phone,
        address: input.address,
        note: input.note,
        debt: input.debt ?? 0,
      },
    })
  },

  /**
   * Update an existing customer
   */
  async update(id: string, input: CustomerUpdateInput): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data: input,
    })
  },

  /**
   * Increase customer debt
   */
  async increaseDebt(id: string, amount: number): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data: {
        debt: {
          increment: amount,
        },
      },
    })
  },

  /**
   * Decrease customer debt (payment)
   */
  async decreaseDebt(id: string, amount: number): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data: {
        debt: {
          decrement: amount,
        },
      },
    })
  },

  /**
   * Set customer debt to a specific amount
   */
  async setDebt(id: string, amount: number): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data: { debt: amount },
    })
  },

  /**
   * Get customers with debt
   */
  async getCustomersWithDebt(): Promise<Customer[]> {
    return prisma.customer.findMany({
      where: {
        debt: { gt: 0 },
      },
      orderBy: { debt: 'desc' },
    })
  },

  /**
   * Get total debt across all customers
   */
  async getTotalDebt(): Promise<number> {
    const result = await prisma.customer.aggregate({
      _sum: {
        debt: true,
      },
    })
    return Number(result._sum.debt ?? 0)
  },

  /**
   * Hard delete a customer
   * Note: This will set customerId to null in related invoices
   */
  async delete(id: string): Promise<Customer> {
    return prisma.customer.delete({
      where: { id },
    })
  },

  /**
   * Count customers
   */
  async count(options: CustomerSearchOptions = {}): Promise<number> {
    const { search, hasDebt } = options

    const where: Prisma.CustomerWhereInput = {
      ...(hasDebt && { debt: { gt: 0 } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    return prisma.customer.count({ where })
  },

  /**
   * Check if customer exists by phone
   */
  async existsByPhone(phone: string): Promise<boolean> {
    const customer = await prisma.customer.findFirst({
      where: { phone },
    })
    return customer !== null
  },
}
