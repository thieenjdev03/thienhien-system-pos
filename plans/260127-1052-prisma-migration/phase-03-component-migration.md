# Phase 3: Component Migration

## Context

- [Phase 2: Server Actions](./phase-02-server-actions.md) - Must be complete
- [Scout: Dexie Usage](./scout/scout-dexie-usage.md)
- [Research: Next.js + Prisma Patterns](./research/researcher-02-nextjs-prisma.md)

## Overview

Replace all `useLiveQuery` hooks with Server Components + Server Actions. Update AuthContext to use server actions instead of direct Dexie calls.

**Effort**: 3h

## Requirements

1. Convert components using useLiveQuery to Server Components
2. Add Suspense boundaries for loading states
3. Update forms to call Server Actions
4. Migrate AuthContext to use server-side user operations
5. Update setup page for initial user creation
6. Maintain current UX (no regressions)

## Architecture

### Migration Pattern

```
BEFORE (Client Component + Dexie):
┌────────────────────────────────┐
│ 'use client'                   │
│ useLiveQuery(() => db.query()) │
│ → Real-time updates            │
└────────────────────────────────┘

AFTER (Server Component + Actions):
┌────────────────────────────────┐
│ async function Component() {   │
│   const data = await action()  │
│ }                              │
│ + Suspense for loading         │
│ + revalidatePath for refresh   │
└────────────────────────────────┘
```

### Component Split Pattern

For pages needing both data fetching and client interactivity:

```tsx
// page.tsx (Server Component)
export default async function ProductsPage() {
  const products = await listProducts()
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsClient initialProducts={products} />
    </Suspense>
  )
}

// ProductsClient.tsx (Client Component)
'use client'
export function ProductsClient({ initialProducts }) {
  // Client-side state, handlers, etc.
}
```

## Related Code Files

### Components to Migrate (7 files)

| File | useLiveQuery Usage | Strategy |
|------|-------------------|----------|
| `app/(dashboard)/products/ProductsPage.tsx` | Products list with search | Server Component + props |
| `app/(dashboard)/customers/CustomersPage.tsx` | Customers list | Server Component + props |
| `app/(dashboard)/invoices/page.tsx` | Invoices with customers | Server Component |
| `app/(dashboard)/invoices/new/page.tsx` | Customer search for dropdown | Props from server |
| `components/ProductSearch.tsx` | Active products | Props from parent |
| `components/ProductSearchAddPanel.tsx` | All active products | Props from parent |
| `components/CustomerSelect.tsx` | Customer dropdown | Props from parent |

### Auth Files to Migrate (2 files)

| File | Dexie Usage | Strategy |
|------|-------------|----------|
| `contexts/AuthContext.tsx` | db.users.count, toArray | Server actions |
| `app/(auth)/setup/page.tsx` | db.users.add | Server action |

## Implementation Steps

### 3.1 Products Page Migration

**Before** (`app/(dashboard)/products/ProductsPage.tsx`):
```tsx
'use client'
const rawProducts = useLiveQuery(async () => {
  // ... search logic
  return db.products.toArray()
}, [search])
```

**After**:

1. Create wrapper server component:
```tsx
// app/(dashboard)/products/page.tsx
import { listAllProducts } from '@/app/actions/products'
import { ProductsPageClient } from './ProductsPageClient'

export default async function ProductsPage() {
  const products = await listAllProducts()
  return <ProductsPageClient initialProducts={products} />
}
```

2. Convert to client component with initial data:
```tsx
// app/(dashboard)/products/ProductsPageClient.tsx
'use client'

import { useState, useMemo, useTransition } from 'react'
import { listProducts, createProduct, updateProduct } from '@/app/actions/products'

export function ProductsPageClient({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts)
  const [isPending, startTransition] = useTransition()

  // Search now filters client-side or refetches
  const handleSearch = (term: string) => {
    startTransition(async () => {
      const results = await listProducts(term)
      setProducts(results)
    })
  }

  const handleSave = async (data: ProductInput) => {
    const result = await createProduct(data)
    if (result.success) {
      // Refetch or optimistic update
      const updated = await listAllProducts()
      setProducts(updated)
    }
  }
}
```

### 3.2 Customers Page Migration

Similar pattern to Products:

```tsx
// app/(dashboard)/customers/page.tsx
import { listCustomers } from '@/app/actions/customers'
import { CustomersPageClient } from './CustomersPageClient'

export default async function CustomersPage() {
  const customers = await listCustomers()
  return <CustomersPageClient initialCustomers={customers} />
}
```

### 3.3 Invoices Page Migration

```tsx
// app/(dashboard)/invoices/page.tsx
import { listInvoices } from '@/app/actions/invoices'
import { InvoicesClient } from './InvoicesClient'

export default async function InvoicesPage() {
  const invoices = await listInvoices()
  return <InvoicesClient invoices={invoices} />
}
```

### 3.4 New Invoice Page Migration

Needs customers for dropdown + products for search:

```tsx
// app/(dashboard)/invoices/new/page.tsx
import { listCustomers } from '@/app/actions/customers'
import { listProducts } from '@/app/actions/products'
import { NewInvoiceClient } from './NewInvoiceClient'

export default async function NewInvoicePage() {
  const [customers, products] = await Promise.all([
    listCustomers(),
    listProducts(),
  ])

  return <NewInvoiceClient customers={customers} products={products} />
}
```

### 3.5 Shared Components Migration

**CustomerSelect** - Convert to receive data as prop:

```tsx
// components/CustomerSelect.tsx
'use client'

interface Props {
  customers: Customer[]
  value: string | null
  onChange: (id: string | null) => void
}

export function CustomerSelect({ customers, value, onChange }: Props) {
  // Remove useLiveQuery, use prop directly
}
```

**ProductSearch / ProductSearchAddPanel** - Similar approach:

```tsx
interface Props {
  products: Product[]
  onSelect: (product: Product) => void
}

export function ProductSearch({ products, onSelect }: Props) {
  // Client-side filtering of products prop
  const filtered = useMemo(() => {
    if (!search) return products
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [products, search])
}
```

### 3.6 AuthContext Migration

**Before**:
```tsx
const checkHasUsers = useCallback(async () => {
  const count = await db.users.count()
  return count > 0
}, [])

const login = useCallback(async (pin: string) => {
  const users = await db.users.toArray()
  // ... verify PIN
}, [])
```

**After**:
```tsx
import { hasUsers, getAllUsers } from '@/app/actions/users'

const checkHasUsers = useCallback(async () => {
  const result = await hasUsers()
  setHasUsers(result)
  return result
}, [])

const login = useCallback(async (pin: string) => {
  const users = await getAllUsers()
  // ... verify PIN (client-side hash check)
}, [])
```

### 3.7 Setup Page Migration

```tsx
// app/(auth)/setup/page.tsx
'use client'

import { createUser } from '@/app/actions/users'
import { hashPin } from '@/utils/auth'

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  const pinHash = await hashPin(pin)
  const result = await createUser({
    pinHash,
    displayName: name,
    role: 'admin',
    active: true,
  })
  if (result.success) {
    router.push('/login')
  }
}
```

## Todo List

### Page Components
- [ ] Create `ProductsPageClient.tsx` with initial data pattern
- [ ] Update products `page.tsx` as Server Component wrapper
- [ ] Create `CustomersPageClient.tsx`
- [ ] Update customers `page.tsx` as Server Component wrapper
- [ ] Create `InvoicesClient.tsx`
- [ ] Update invoices `page.tsx` as Server Component wrapper
- [ ] Create `NewInvoiceClient.tsx`
- [ ] Update invoices/new `page.tsx` with data fetching

### Shared Components
- [ ] Update `CustomerSelect.tsx` to use props
- [ ] Update `ProductSearch.tsx` to use props
- [ ] Update `ProductSearchAddPanel.tsx` to use props

### Auth
- [ ] Update `AuthContext.tsx` to use server actions
- [ ] Update `setup/page.tsx` to use createUser action
- [ ] Test login flow end-to-end

### Polish
- [ ] Add loading skeletons where needed
- [ ] Add error boundaries
- [ ] Test optimistic updates work correctly

## Success Criteria

- [ ] Zero imports of `useLiveQuery` in codebase
- [ ] Zero imports of `dexie-react-hooks` in codebase
- [ ] Products page loads and CRUD works
- [ ] Customers page loads and CRUD works
- [ ] Invoices list shows with customer names
- [ ] New invoice creation works
- [ ] Login flow works (check users, verify PIN)
- [ ] Setup page creates first user
- [ ] Search/filter works on all list pages

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stale data after mutation | Medium | Medium | Refetch after action or use revalidatePath |
| Hydration mismatch | Medium | Low | Keep server/client data shapes identical |
| Loading state regressions | Medium | Low | Add Suspense + skeletons |
| PIN verification security | Low | High | Keep hash comparison on server |

## Notes

- **Data Freshness**: Without useLiveQuery, data won't auto-update. Use `revalidatePath` in actions + client refetch after mutations.
- **Decimal Handling**: Prisma Decimal serializes to string. Convert in components: `Number(product.price1)`
- **Auth Flow**: PIN verification stays client-side (comparing hashes). Could move to server action for added security but not required for MVP.
- **Performance**: Initial load may be slightly faster (no JS bundle for Dexie), but no real-time reactivity.
