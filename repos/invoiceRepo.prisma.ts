/**
 * Invoice Repository - Prisma Implementation
 * CRUD operations for invoices with transaction support
 */

import { prisma } from '@/lib/prisma'
import type { Invoice, InvoiceItem, Prisma } from '@/lib/generated/prisma/client'

export type InvoiceItemInput = {
  productId: string
  productNameSnapshot: string
  categorySnapshot?: string | null
  unitSnapshot: string
  qty: number
  unitPrice: number
  lineTotal: number
  noteSnapshot?: string | null
}

export type InvoiceCreateInput = {
  invoiceNo: string
  customerId?: string | null
  subtotal: number
  discount?: number
  total: number
  paid: number
  change: number
  debtIncrease?: number
  note?: string | null
  items: InvoiceItemInput[]
}

export type InvoiceSearchOptions = {
  customerId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export type InvoiceWithDetails = Invoice & {
  items: (InvoiceItem & {
    product: {
      id: string
      name: string
      category: string | null
    }
  })[]
  customer: {
    id: string
    name: string
    phone: string | null
  } | null
}

export const invoiceRepo = {
  /**
   * Create a new invoice with items in a transaction
   * Also updates customer debt if applicable
   */
  async create(input: InvoiceCreateInput): Promise<Invoice> {
    return prisma.$transaction(async (tx) => {
      // 1. Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo: input.invoiceNo,
          customerId: input.customerId,
          subtotal: input.subtotal,
          discount: input.discount ?? 0,
          total: input.total,
          paid: input.paid,
          change: input.change,
          debtIncrease: input.debtIncrease ?? 0,
          note: input.note,
        },
      })

      // 2. Create invoice items
      if (input.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: input.items.map((item) => ({
            invoiceId: invoice.id,
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            categorySnapshot: item.categorySnapshot,
            unitSnapshot: item.unitSnapshot,
            qty: item.qty,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            noteSnapshot: item.noteSnapshot,
          })),
        })
      }

      // 3. Update customer debt if applicable
      if (input.customerId && input.debtIncrease && input.debtIncrease > 0) {
        await tx.customer.update({
          where: { id: input.customerId },
          data: {
            debt: {
              increment: input.debtIncrease,
            },
          },
        })
      }

      return invoice
    })
  },

  /**
   * Get invoice by ID with full details
   */
  async getById(id: string): Promise<InvoiceWithDetails | null> {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })
  },

  /**
   * Get invoice by invoice number
   */
  async getByInvoiceNo(invoiceNo: string): Promise<InvoiceWithDetails | null> {
    return prisma.invoice.findUnique({
      where: { invoiceNo },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })
  },

  /**
   * List invoices with optional filtering and pagination
   */
  async list(options: InvoiceSearchOptions = {}): Promise<InvoiceWithDetails[]> {
    const { customerId, startDate, endDate, limit = 50, offset = 0 } = options

    const where: Prisma.InvoiceWhereInput = {
      ...(customerId && { customerId }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    }

    return prisma.invoice.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  },

  /**
   * Get recent invoices
   */
  async getRecent(limit: number = 10): Promise<InvoiceWithDetails[]> {
    return prisma.invoice.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },

  /**
   * Get invoices for a specific customer
   */
  async getByCustomerId(customerId: string): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    })
  },

  /**
   * Get next invoice number
   */
  async getNextInvoiceNo(): Promise<string> {
    const counter = await prisma.counter.upsert({
      where: { key: 'invoice' },
      update: {
        value: {
          increment: 1,
        },
      },
      create: {
        key: 'invoice',
        value: 1,
      },
    })

    const today = new Date()
    const year = today.getFullYear().toString().slice(-2)
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    const sequence = counter.value.toString().padStart(4, '0')

    return `INV${year}${month}${day}${sequence}`
  },

  /**
   * Get sales statistics for a date range
   */
  async getSalesStats(startDate: Date, endDate: Date) {
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const stats = await prisma.invoice.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        subtotal: true,
        discount: true,
        total: true,
        paid: true,
        debtIncrease: true,
      },
      _count: {
        id: true,
      },
    })

    return {
      count: stats._count.id,
      subtotal: Number(stats._sum.subtotal ?? 0),
      discount: Number(stats._sum.discount ?? 0),
      total: Number(stats._sum.total ?? 0),
      paid: Number(stats._sum.paid ?? 0),
      debt: Number(stats._sum.debtIncrease ?? 0),
    }
  },

  /**
   * Get top selling products
   */
  async getTopSellingProducts(limit: number = 10, startDate?: Date, endDate?: Date) {
    const where: Prisma.InvoiceItemWhereInput = {}

    if (startDate && endDate) {
      where.invoice = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }
    }

    const items = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      where,
      _sum: {
        qty: true,
        lineTotal: true,
      },
      orderBy: {
        _sum: {
          lineTotal: 'desc',
        },
      },
      take: limit,
    })

    // Get product details
    const productIds = items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    return items.map((item) => ({
      product: productMap.get(item.productId),
      totalQty: Number(item._sum.qty ?? 0),
      totalRevenue: Number(item._sum.lineTotal ?? 0),
    }))
  },

  /**
   * Count invoices
   */
  async count(options: InvoiceSearchOptions = {}): Promise<number> {
    const { customerId, startDate, endDate } = options

    const where: Prisma.InvoiceWhereInput = {
      ...(customerId && { customerId }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    }

    return prisma.invoice.count({ where })
  },

  /**
   * Delete invoice (use with caution!)
   * This will also delete related invoice items due to cascade
   */
  async delete(id: string): Promise<Invoice> {
    return prisma.invoice.delete({
      where: { id },
    })
  },
}
