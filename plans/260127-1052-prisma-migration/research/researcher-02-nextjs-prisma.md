# Next.js 16 + Prisma Integration Patterns Research

**Date:** 2026-01-27
**Context:** Migrating POS app from Dexie (client-side) to Prisma (server-side)

---

## 1. Prisma Client Singleton Pattern

### Problem
Hot module reloading in Next.js dev creates multiple Prisma client instances, causing connection pool exhaustion.

### Solution
**File: `lib/prisma.ts`**
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Why:** Global variable persists across hot reloads in dev mode. Production uses new instance (vercel/railway handles pooling).

**Type safety:** Always import from `lib/prisma.ts`, never `@prisma/client` directly in app code.

---

## 2. Server Actions vs API Routes

### Decision Matrix

| Use Case | Server Actions | API Routes |
|----------|---|---|
| Simple CRUD, auth-required | ✅ (default) | ❌ overkill |
| Caching needs (ISR/cache tags) | ✅ revalidatePath/Tag | ❌ verbose |
| Error boundary integration | ✅ client boundary catches | ❌ JSON only |
| Middleware auth checks | ✅ built-in | ❌ manual |
| External API webhooks | ❌ unsafe | ✅ required |
| Rate limiting, metrics | ❌ limited | ✅ better |

### Recommendation
**Server Actions for core POS operations:**
- Create/Update/Delete records
- Sync with inventory
- Report generation

**API Routes only for:**
- Webhooks (payment processor, etc)
- File uploads (multipart)
- Public endpoints

---

## 3. Server Action Pattern for Database Operations

### CRUD Implementation
```typescript
// app/actions/products.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createProduct(data: CreateProductInput) {
  try {
    const product = await prisma.product.create({ data })
    revalidatePath('/dashboard/products')
    return { success: true, data: product }
  } catch (error) {
    console.error('[createProduct]', error)
    return { success: false, error: 'Failed to create product' }
  }
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data,
    })
    revalidatePath(`/dashboard/products/${id}`)
    revalidatePath('/dashboard/products')
    return { success: true, data: product }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed'
    }
  }
}
```

### Error Handling Pattern
```typescript
export async function deleteProduct(id: string) {
  try {
    // Type-safe error handling
    await prisma.product.delete({ where: { id } })
    revalidatePath('/dashboard/products')
    return { success: true }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'Product not found' }
      }
      if (error.code === 'P2003') {
        return { success: false, error: 'Cannot delete: linked records exist' }
      }
    }
    throw error // Let boundary handle
  }
}
```

---

## 4. Transaction Handling

### Pattern for Multi-Step Operations
```typescript
export async function transferInventory(
  fromLocationId: string,
  toLocationId: string,
  items: TransferItem[]
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Atomic: all succeed or all fail
      for (const item of items) {
        await tx.inventory.update({
          where: { locationId_productId: { locationId: fromLocationId, productId: item.productId } },
          data: { quantity: { decrement: item.quantity } },
        })

        await tx.inventory.upsert({
          where: { locationId_productId: { locationId: toLocationId, productId: item.productId } },
          update: { quantity: { increment: item.quantity } },
          create: { locationId: toLocationId, productId: item.productId, quantity: item.quantity },
        })
      }

      // Log the transfer
      return await tx.auditLog.create({
        data: {
          action: 'INVENTORY_TRANSFER',
          details: { fromLocationId, toLocationId, itemCount: items.length },
        },
      })
    })

    revalidatePath('/dashboard/inventory')
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: 'Transfer failed' }
  }
}
```

**Key points:**
- Use callback-style transaction (more readable)
- Prisma handles rollback automatically
- Don't mix with revalidatePath inside tx (call after)

---

## 5. Migration from Dexie to Prisma

### Converting useLiveQuery to Server Components
```typescript
// BEFORE (Dexie)
function ProductList() {
  const products = useLiveQuery(() => db.products.toArray())
  return <div>{products?.map(p => <ProductRow key={p.id} product={p} />)}</div>
}

// AFTER (Server Component)
async function ProductList() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return <div>{products.map(p => <ProductRow key={p.id} product={p} />)}</div>
}
```

### Loading States Pattern
```typescript
import { Suspense } from 'react'

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductList />
    </Suspense>
  )
}

async function ProductList() {
  const products = await prisma.product.findMany()
  return <div>{/* render products */}</div>
}
```

### Optimistic Updates (Client Component)
```typescript
'use client'

import { useTransition } from 'react'
import { updateProduct } from '@/app/actions/products'

export function EditProductForm({ product }: Props) {
  const [isPending, startTransition] = useTransition()
  const [optimisticProduct, setOptimisticProduct] = useState(product)

  const handleSubmit = (formData: FormData) => {
    const updated = { ...optimisticProduct, name: formData.get('name') }
    setOptimisticProduct(updated)

    startTransition(async () => {
      const result = await updateProduct(product.id, Object.fromEntries(formData))
      if (!result.success) {
        setOptimisticProduct(product) // Revert
        toast.error(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit}>
      {/* inputs bound to optimisticProduct */}
    </form>
  )
}
```

---

## 6. Type Safety Best Practices

### Generate Types from Schema
```bash
npx prisma generate
```

### Use Prisma Types in Actions
```typescript
import { Prisma } from '@prisma/client'

export async function createProduct(
  data: Prisma.ProductCreateInput
): Promise<{ success: boolean; data?: Prisma.ProductGetPayload<{}> }> {
  // Full type inference
}

// For input validation:
import { z } from 'zod'

const CreateProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  price: z.number().positive(),
})

type CreateProductInput = z.infer<typeof CreateProductSchema>
```

---

## 7. Recommended File Structure

```
app/
├── actions/
│   ├── products.ts
│   ├── inventory.ts
│   ├── sales.ts
│   └── types.ts (input schemas + types)
├── (dashboard)/
│   └── products/
│       ├── page.tsx (server component)
│       └── [id]/edit/page.tsx
lib/
├── prisma.ts (singleton)
├── validators.ts (zod schemas)
└── types.ts (shared TS types)
```

---

## Unresolved Questions

- Pagination strategy (cursor vs offset) for large datasets in POS?
- Caching invalidation complexity with multiple concurrent users?
- Real-time sync pattern for multi-location inventory (WebSocket vs polling)?
- Offline-first capability needed (going back to Dexie hybrid)?
