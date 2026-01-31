# Phase 2: Server Actions

## Context

- [Phase 1: Prisma Schema](./phase-01-prisma-schema.md) - Must be complete
- [Research: Next.js + Prisma Patterns](./research/researcher-02-nextjs-prisma.md)

## Overview

Create Server Actions to replace all Dexie repository operations. Actions will be called from components directly.

**Effort**: 2.5h

## Requirements

1. Create server action files matching repository structure
2. Implement all CRUD operations with proper error handling
3. Use `revalidatePath` for cache invalidation
4. Handle Prisma errors with user-friendly messages
5. Maintain transaction support for invoice creation
6. Support bulk operations (product import)

## Architecture

### File Structure

```
app/
└── actions/
    ├── products.ts    # productRepo replacement
    ├── customers.ts   # customerRepo replacement
    ├── invoices.ts    # invoiceRepo replacement
    ├── users.ts       # Auth operations (db.users.*)
    └── backup.ts      # backupRepo replacement
```

### Action Pattern

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createProduct(data: ProductInput) {
  try {
    const product = await prisma.product.create({ data })
    revalidatePath('/dashboard/products')
    return { success: true, data: product }
  } catch (error) {
    return { success: false, error: 'Failed to create' }
  }
}
```

## Related Code Files

### Source (to migrate from)

| File | Methods |
|------|---------|
| `repos/productRepo.ts` | list, listAll, getById, create, update, softDelete, restore, bulkImport |
| `repos/customerRepo.ts` | list, getById, create, update, increaseDebt, delete |
| `repos/invoiceRepo.ts` | list, getById, getItems, create, getNextInvoiceNumber |
| `repos/backupRepo.ts` | exportData, importData, validatePayload |
| `contexts/AuthContext.tsx` | db.users.count, db.users.toArray, db.users.add |

### Target (to create)

| File | Location |
|------|----------|
| Product actions | `app/actions/products.ts` |
| Customer actions | `app/actions/customers.ts` |
| Invoice actions | `app/actions/invoices.ts` |
| User actions | `app/actions/users.ts` |
| Backup actions | `app/actions/backup.ts` |

## Implementation Steps

### 2.1 Product Actions (app/actions/products.ts)

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@/lib/generated/prisma'

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }

// List active products with optional search
export async function listProducts(search?: string) {
  const where: Prisma.ProductWhereInput = { active: true }

  if (search?.trim()) {
    const term = search.toLowerCase()
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { category: { contains: term, mode: 'insensitive' } },
    ]
  }

  return prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

// List all products (including inactive)
export async function listAllProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

// Get product by ID
export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } })
}

// Create product
export async function createProduct(data: Prisma.ProductCreateInput): Promise<ActionResult<typeof result>> {
  try {
    const result = await prisma.product.create({ data })
    revalidatePath('/dashboard/products')
    return { success: true, data: result }
  } catch (error) {
    console.error('[createProduct]', error)
    return { success: false, error: 'Failed to create product' }
  }
}

// Update product
export async function updateProduct(id: string, data: Prisma.ProductUpdateInput): Promise<ActionResult> {
  try {
    await prisma.product.update({ where: { id }, data })
    revalidatePath('/dashboard/products')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: 'Product not found' }
    }
    return { success: false, error: 'Failed to update product' }
  }
}

// Soft delete (set active = false)
export async function softDeleteProduct(id: string): Promise<ActionResult> {
  try {
    await prisma.product.update({
      where: { id },
      data: { active: false },
    })
    revalidatePath('/dashboard/products')
    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: 'Failed to delete product' }
  }
}

// Restore soft-deleted product
export async function restoreProduct(id: string): Promise<ActionResult> {
  try {
    await prisma.product.update({
      where: { id },
      data: { active: true },
    })
    revalidatePath('/dashboard/products')
    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: 'Failed to restore product' }
  }
}

// Bulk import products
export async function bulkImportProducts(
  items: ProductImportItem[],
  mode: 'upsert' | 'replace'
): Promise<ActionResult<ImportResult>> {
  // Implementation mirrors productRepo.bulkImport
  // Use prisma.$transaction for atomicity
}
```

### 2.2 Customer Actions (app/actions/customers.ts)

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@/lib/generated/prisma'

export async function listCustomers(search?: string) {
  const where: Prisma.CustomerWhereInput = {}

  if (search?.trim()) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ]
  }

  return prisma.customer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({ where: { id } })
}

export async function createCustomer(data: Prisma.CustomerCreateInput) {
  try {
    const customer = await prisma.customer.create({ data })
    revalidatePath('/dashboard/customers')
    return { success: true, data: customer }
  } catch (error) {
    return { success: false, error: 'Failed to create customer' }
  }
}

export async function updateCustomer(id: string, data: Prisma.CustomerUpdateInput) {
  try {
    await prisma.customer.update({ where: { id }, data })
    revalidatePath('/dashboard/customers')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update customer' }
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({ where: { id } })
    revalidatePath('/dashboard/customers')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete customer' }
  }
}

export async function increaseCustomerDebt(id: string, amount: number) {
  try {
    await prisma.customer.update({
      where: { id },
      data: { debt: { increment: amount } },
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update debt' }
  }
}
```

### 2.3 Invoice Actions (app/actions/invoices.ts)

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { InvoiceCreateInput } from '@/domain/models'

// Generate invoice number: HD-YYYY-XXXXXX
async function generateInvoiceNo(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear()
  const key = `invoice_${year}`

  const counter = await tx.counter.upsert({
    where: { key },
    update: { value: { increment: 1 } },
    create: { key, value: 1 },
  })

  return `HD-${year}-${String(counter.value).padStart(6, '0')}`
}

export async function listInvoices() {
  return prisma.invoice.findMany({
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
    },
  })
}

export async function createInvoice(input: InvoiceCreateInput) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const invoiceNo = await generateInvoiceNo(tx)

      // Calculate totals
      const subtotal = input.lines.reduce((sum, line) => sum + line.lineTotal, 0)
      const total = subtotal - input.discount
      const change = input.paid - total
      const debtIncrease = Math.max(0, total - input.paid)

      // Create invoice with items
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          customerId: input.customerId,
          subtotal,
          discount: input.discount,
          total,
          paid: input.paid,
          change,
          debtIncrease,
          note: input.note,
          items: {
            create: input.lines.map(line => ({
              productId: line.productId,
              productNameSnapshot: line.productName,
              categorySnapshot: line.category,
              unitSnapshot: line.unit,
              qty: line.qty,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal,
              noteSnapshot: line.note,
            })),
          },
        },
        include: { items: true },
      })

      // Update customer debt if applicable
      if (input.customerId && debtIncrease > 0) {
        await tx.customer.update({
          where: { id: input.customerId },
          data: { debt: { increment: debtIncrease } },
        })
      }

      return invoice
    })

    revalidatePath('/dashboard/invoices')
    return { success: true, data: result }
  } catch (error) {
    console.error('[createInvoice]', error)
    return { success: false, error: 'Failed to create invoice' }
  }
}

export async function getNextInvoiceNumber() {
  const year = new Date().getFullYear()
  const key = `invoice_${year}`
  const counter = await prisma.counter.findUnique({ where: { key } })
  const nextValue = (counter?.value ?? 0) + 1
  return `HD-${year}-${String(nextValue).padStart(6, '0')}`
}
```

### 2.4 User Actions (app/actions/users.ts)

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma'

export async function hasUsers(): Promise<boolean> {
  const count = await prisma.user.count()
  return count > 0
}

export async function getAllUsers() {
  return prisma.user.findMany({
    where: { active: true },
  })
}

export async function createUser(data: Prisma.UserCreateInput) {
  try {
    const user = await prisma.user.create({ data })
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: 'Failed to create user' }
  }
}

export async function findUserByPin(pinHash: string) {
  return prisma.user.findFirst({
    where: { pinHash, active: true },
  })
}
```

### 2.5 Backup Actions (app/actions/backup.ts)

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import type { BackupData, BackupPayload } from '@/domain/models'

const BACKUP_VERSION = 1
const APP_NAME = 'POS-MVP'

export async function exportData(): Promise<BackupPayload> {
  const [products, customers, invoices, invoiceItems, counters] = await Promise.all([
    prisma.product.findMany(),
    prisma.customer.findMany(),
    prisma.invoice.findMany(),
    prisma.invoiceItem.findMany(),
    prisma.counter.findMany(),
  ])

  return {
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
  }
}

export async function importData(data: BackupData): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Clear all tables
      await tx.invoiceItem.deleteMany()
      await tx.invoice.deleteMany()
      await tx.product.deleteMany()
      await tx.customer.deleteMany()
      await tx.counter.deleteMany()

      // Import data
      if (data.customers.length) await tx.customer.createMany({ data: data.customers })
      if (data.products.length) await tx.product.createMany({ data: data.products })
      if (data.invoices.length) await tx.invoice.createMany({ data: data.invoices })
      if (data.invoiceItems.length) await tx.invoiceItem.createMany({ data: data.invoiceItems })
      if (data.counters.length) await tx.counter.createMany({ data: data.counters })
    })

    return { success: true }
  } catch (error) {
    console.error('[importData]', error)
    return { success: false, error: 'Failed to import data' }
  }
}
```

## Todo List

- [ ] Create `app/actions/products.ts` with all methods
- [ ] Create `app/actions/customers.ts` with all methods
- [ ] Create `app/actions/invoices.ts` with transaction support
- [ ] Create `app/actions/users.ts` for auth
- [ ] Create `app/actions/backup.ts` for export/import
- [ ] Add shared types file `app/actions/types.ts` if needed
- [ ] Test each action with Prisma Studio / test script
- [ ] Verify transaction rollback works for invoice creation

## Success Criteria

- [ ] All productRepo methods have action equivalents
- [ ] All customerRepo methods have action equivalents
- [ ] Invoice creation works atomically (items + counter + debt)
- [ ] User operations work for auth flow
- [ ] Backup export produces valid JSON
- [ ] Backup import clears and restores data
- [ ] revalidatePath calls added for cache busting

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Transaction timeout | Low | High | Keep transactions focused |
| Decimal serialization | Medium | Medium | Test JSON roundtrip |
| Missing revalidatePath | Medium | Low | Checklist review |
| Type mismatches | Medium | Medium | Use Prisma generated types |

## Notes

- Decimal fields serialize to strings in JSON - components must handle conversion
- `increaseCustomerDebt` uses Prisma's `{ increment: amount }` syntax
- Invoice counter uses `upsert` for atomic increment (simpler than Dexie approach)
- Backup import order matters: customers/products before invoices
