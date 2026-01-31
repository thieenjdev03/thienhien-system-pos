# Code Standards & Best Practices

**Last Updated**: 2026-01-31
**Version**: 1.0

## Table of Contents

1. [General Guidelines](#general-guidelines)
2. [TypeScript Standards](#typescript-standards)
3. [React & Components](#react--components)
4. [Database & Prisma](#database--prisma)
5. [API Routes](#api-routes)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [Performance](#performance)
9. [Security](#security)

---

## General Guidelines

### Code Style
- **Language**: TypeScript (strict mode)
- **Formatter**: Prettier (configured in project)
- **Linter**: ESLint with Next.js config
- **Line Length**: 100 characters (soft limit)

### Naming Conventions

#### Files
```typescript
// Components: PascalCase + .tsx
CustomerForm.tsx
ProductSearchPanel.tsx

// Pages: lowercase + .tsx
page.tsx
layout.tsx

// Utilities: camelCase + .ts
formatters.ts
auth.ts

// Directories: kebab-case
components/
app/
lib/
utils/
```

#### Variables & Functions
```typescript
// Constants: UPPER_SNAKE_CASE
const MAX_INVOICE_AMOUNT = 999_999_999
const DEFAULT_CURRENCY = 'VND'

// Variables & functions: camelCase
const customerName = 'John Doe'
const isActive = true
function formatPrice(price: number): string {}

// React components: PascalCase
function ProductCard() {}
const InvoiceItem = () => {}

// Types & Interfaces: PascalCase
interface Customer {
  id: string
  name: string
}

type InvoiceData = {
  total: Decimal
  items: InvoiceItemData[]
}
```

#### Database Fields
```prisma
// Model names: PascalCase
model Customer {}
model InvoiceItem {}

// Fields: camelCase
id        String
name      String
createdAt DateTime
debt      Decimal

// Relations: camelCase
customer  Customer?
invoices  Invoice[]
```

### Imports Organization
```typescript
// 1. External libraries (alphabetical)
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import React, { useState } from 'react'

// 2. Internal modules (alphabetical)
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/utils/formatters'
import { authMiddleware } from '@/utils/auth'

// 3. Types
import type { Invoice, Customer } from '@prisma/client'

// 4. Styles
import styles from './Component.module.css'
```

---

## TypeScript Standards

### Type Strictness
```typescript
// Use strict types everywhere
const getValue = (data: unknown): string => {
  if (typeof data !== 'string') {
    throw new Error('Value must be a string')
  }
  return data
}

// Avoid 'any' - use 'unknown' if necessary
// ❌ AVOID
const processData = (data: any) => {}

// ✅ GOOD
const processData = (data: unknown): void => {}
```

### Function Types
```typescript
// Explicit return types
function createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
  // ...
}

// Arrow functions with types
const formatPrice = (price: number): string => {
  return `${price.toLocaleString('vi-VN')} VND`
}

// Async functions
async function fetchCustomers(): Promise<Customer[]> {
  // ...
}
```

### Interfaces vs Types
```typescript
// Interfaces for object shapes (prefer for contracts)
interface Customer {
  id: string
  name: string
  phone?: string
  debt: Decimal
}

// Types for unions, tuples, primitives
type PriceLevel = 'price1' | 'price2' | 'price3'
type PaymentMethod = 'cash' | 'card' | 'debt'
type QueryResult<T> = { data: T } | { error: string }

// Generic interfaces
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### Null Handling
```typescript
// Use optional chaining
const customerName = customer?.name ?? 'Unknown'

// Use nullish coalescing for defaults
const discount = invoice.discount ?? 0

// Type guards
if (customer !== null && customer !== undefined) {
  // customer is definitely defined here
}
```

---

## React & Components

### Functional Components
```typescript
// Use function declaration for components
function ProductCard({ product }: { product: Product }): JSX.Element {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>${product.price1}</p>
    </div>
  )
}

// Or typed props interface
interface ProductCardProps {
  product: Product
  onSelect?: (product: Product) => void
}

function ProductCard({ product, onSelect }: ProductCardProps): JSX.Element {
  return <div onClick={() => onSelect?.(product)}>{product.name}</div>
}
```

### Hooks Usage
```typescript
// Standard hooks
function CustomerForm() {
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    phone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  return <>...</>
}

// Custom hooks
function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCustomers().then(setCustomers).catch(console.error)
  }, [])

  return { customers, isLoading }
}
```

### Conditional Rendering
```typescript
// Simple conditionals
{isLoading && <Spinner />}
{error && <ErrorMessage message={error} />}
{items.length > 0 && <ItemList items={items} />}

// Ternary for two branches
<div>
  {isActive ? <ActiveBadge /> : <InactiveBadge />}
</div>

// Early returns in custom hooks
if (!items) return null
if (isLoading) return <Skeleton />

return <ItemList items={items} />
```

### Event Handling
```typescript
// Typed event handlers
function SearchInput() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.currentTarget.value
    // ...
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    // ...
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
    </form>
  )
}
```

### Component Props Pattern
```typescript
// Avoid prop drilling - use Context for deeply nested data
interface LayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: BreadcrumbItem[]
}

function DashboardLayout({ children, title }: LayoutProps): JSX.Element {
  return (
    <div>
      <Navbar />
      <Sidebar />
      <main>
        {title && <h1>{title}</h1>}
        {children}
      </main>
    </div>
  )
}
```

### Server vs Client Components
```typescript
// Server Component (default in Next.js 13+)
// Use for data fetching, auth checks
async function CustomerList() {
  const customers = await prisma.customer.findMany()
  return <ul>...</ul>
}

// Client Component (when needed)
'use client'

import { useState } from 'react'

function SearchInput() {
  const [query, setQuery] = useState('')
  return <input onChange={(e) => setQuery(e.target.value)} />
}
```

---

## Database & Prisma

### Prisma Client Usage

#### CRUD Operations
```typescript
// CREATE
const customer = await prisma.customer.create({
  data: {
    name: 'John Doe',
    phone: '0912345678',
    address: '123 Street',
  },
})

// READ - Single
const customer = await prisma.customer.findUnique({
  where: { id: customerId },
})

// READ - Multiple
const customers = await prisma.customer.findMany({
  where: { active: true },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 50,
})

// UPDATE
const updated = await prisma.customer.update({
  where: { id: customerId },
  data: { name: 'Jane Doe' },
})

// DELETE (use soft delete instead)
// ❌ AVOID hard deletes
await prisma.customer.delete({ where: { id: customerId } })

// ✅ GOOD - soft delete
await prisma.customer.update({
  where: { id: customerId },
  data: { active: false },
})
```

#### Relationships
```typescript
// Include related data
const invoice = await prisma.invoice.findUnique({
  where: { id: invoiceId },
  include: {
    customer: true,
    items: {
      include: {
        product: true,
      },
    },
  },
})

// Select specific fields
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    price1: true,
  },
})
```

#### Transactions
```typescript
// For multi-step operations that must all succeed or all fail
const result = await prisma.$transaction(async (tx) => {
  // Create invoice
  const invoice = await tx.invoice.create({
    data: {
      invoiceNo: generateInvoiceNo(),
      customerId,
      subtotal: calculateSubtotal(items),
      total: calculateTotal(items),
    },
  })

  // Create line items
  await tx.invoiceItem.createMany({
    data: items.map((item) => ({
      invoiceId: invoice.id,
      productId: item.productId,
      qty: item.quantity,
      unitPrice: item.price,
      lineTotal: item.quantity * item.price,
    })),
  })

  // Update customer debt
  if (customerId) {
    await tx.customer.update({
      where: { id: customerId },
      data: { debt: { increment: debtAmount } },
    })
  }

  return invoice
})
```

#### Aggregations
```typescript
// Sum, count, avg, min, max
const stats = await prisma.invoice.aggregate({
  _sum: { total: true, paid: true },
  _count: { id: true },
  where: { createdAt: { gte: startDate } },
})

// Group by
const dailyRevenue = await prisma.invoice.groupBy({
  by: ['createdAt'],
  _sum: { total: true },
  where: { createdAt: { gte: startDate } },
})
```

### Query Optimization
```typescript
// ✅ GOOD - Fetch only needed fields
const products = await prisma.product.findMany({
  select: { id: true, name: true, price1: true },
})

// ❌ AVOID - Fetch everything
const products = await prisma.product.findMany()

// ✅ GOOD - Use indexes
const customer = await prisma.customer.findMany({
  where: { name: { contains: 'John', mode: 'insensitive' } },
})

// ✅ GOOD - Paginate large datasets
const page = 1
const pageSize = 20
const products = await prisma.product.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
})
```

### Schema Design
```prisma
// Model naming: PascalCase
model Customer {
  // Primary key
  id String @id @default(cuid())

  // Required fields without defaults
  name String

  // Optional fields
  phone String?

  // Fields with defaults
  active Boolean @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  invoices Invoice[]

  // Indexes for performance
  @@index([name])
  @@index([phone])
}

// Use @db.Decimal for money fields
model Invoice {
  total Decimal @db.Decimal(12, 2)  // VND with cents
  // NOT: total Float  ❌ Causes floating-point errors
}

// Use snapshots in detail records
model InvoiceItem {
  productNameSnapshot String  // Snapshot at invoice time
  product Product @relation(fields: [productId], references: [id])
}
```

---

## API Routes

### Route Organization
```typescript
// app/api/customers/route.ts - List & Create
export async function GET(request: Request) {
  // ...
}
export async function POST(request: Request) {
  // ...
}

// app/api/customers/[id]/route.ts - Get, Update, Delete
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ...
}
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ...
}
```

### Request/Response Handling
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')

    if (page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      )
    }

    const items = await prisma.customer.findMany({
      skip: (page - 1) * 20,
      take: 20,
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // Validate input
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        name: body.name.trim(),
        phone: body.phone?.trim(),
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Error Responses
```typescript
// Consistent error response format
interface ApiError {
  error: string
  code?: string
  details?: Record<string, unknown>
}

// Usage
return NextResponse.json(
  {
    error: 'Product not found',
    code: 'PRODUCT_NOT_FOUND',
  },
  { status: 404 }
)
```

---

## Error Handling

### Try-Catch Pattern
```typescript
async function fetchCustomer(id: string): Promise<Customer | null> {
  try {
    return await prisma.customer.findUnique({ where: { id } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Record not found
        return null
      }
    }
    console.error('Database error:', error)
    throw new Error('Failed to fetch customer')
  }
}
```

### Validation Errors
```typescript
interface ValidationError {
  field: string
  message: string
}

function validateCustomer(data: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data || typeof data !== 'object') {
    return [{ field: '_root', message: 'Invalid data' }]
  }

  if (!('name' in data) || typeof data.name !== 'string' || !data.name) {
    errors.push({ field: 'name', message: 'Name is required' })
  }

  if ('phone' in data && data.phone && typeof data.phone !== 'string') {
    errors.push({ field: 'phone', message: 'Phone must be a string' })
  }

  return errors
}
```

### Custom Error Classes
```typescript
class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`)
    this.name = 'NotFoundError'
  }
}

class ValidationError extends Error {
  constructor(public errors: Record<string, string>) {
    super('Validation failed')
    this.name = 'ValidationError'
  }
}

// Usage
if (!customer) {
  throw new NotFoundError('Customer', customerId)
}
```

---

## Testing

### Unit Tests
```typescript
// utils/formatters.test.ts
import { formatCurrency } from './formatters'

describe('formatCurrency', () => {
  it('should format number as Vietnamese currency', () => {
    expect(formatCurrency(10000)).toBe('10,000 VND')
    expect(formatCurrency(1000000)).toBe('1,000,000 VND')
  })

  it('should handle decimal values', () => {
    expect(formatCurrency(10.5)).toBe('10.5 VND')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('0 VND')
  })
})
```

### API Route Tests
```typescript
// app/api/customers/route.test.ts
import { GET, POST } from './route'

describe('GET /api/customers', () => {
  it('should return customers', async () => {
    const request = new Request('http://localhost/api/customers')
    const response = await GET(request as NextRequest)
    expect(response.status).toBe(200)
  })
})
```

### Component Tests
```typescript
import { render, screen } from '@testing-library/react'
import { ProductCard } from './ProductCard'

describe('ProductCard', () => {
  it('should display product name and price', () => {
    const product = { id: '1', name: 'Test', price1: 10000 }
    render(<ProductCard product={product} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

---

## Performance

### Data Fetching
```typescript
// ✅ GOOD - Server component with data fetch
async function ProductsList() {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, price1: true },
  })

  return <Products items={products} />
}

// ✅ GOOD - With pagination
const pageSize = 50
const products = await prisma.product.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
})
```

### Memoization
```typescript
// Memoize expensive computations
function InvoiceTotal({ items }: { items: InvoiceItem[] }): JSX.Element {
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0)
  }, [items])

  return <div>Total: {formatCurrency(total)}</div>
}

// Memoize callbacks
function ProductList() {
  const handleSelect = useCallback((productId: string) => {
    // ...
  }, [])

  return <Products onSelect={handleSelect} />
}
```

### Code Splitting
```typescript
// Dynamic imports for large components
const InvoiceEditor = dynamic(() => import('./InvoiceEditor'), {
  loading: () => <Skeleton />,
})
```

---

## Security

### Input Validation
```typescript
// Always validate and sanitize user input
function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Expected string')
  }
  return input.trim().substring(0, 255)
}

function validateEmail(email: unknown): string {
  if (typeof email !== 'string' || !email.includes('@')) {
    throw new Error('Invalid email')
  }
  return email.toLowerCase()
}
```

### Prisma Query Injection Prevention
```typescript
// ✅ GOOD - Prisma prevents injection
const customer = await prisma.customer.findMany({
  where: {
    name: { contains: userInput, mode: 'insensitive' },
  },
})

// NOT: Raw queries with string concatenation
// ❌ AVOID
const query = `SELECT * FROM Customer WHERE name = '${userInput}'`
```

### Authentication & Authorization
```typescript
// Check user authentication before operations
async function updateCustomer(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check authorization
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Proceed with update
  // ...
}
```

### Environment Variables
```typescript
// Use environment variables for sensitive config
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// Never log sensitive data
console.log('Database connected') // ✅ GOOD
console.log(`Connected to ${DATABASE_URL}`) // ❌ AVOID
```

---

## Summary

| Category | Standard |
|----------|----------|
| **Language** | TypeScript with strict mode |
| **File Naming** | PascalCase (components), camelCase (utilities) |
| **Variables** | camelCase, UPPER_SNAKE_CASE for constants |
| **Imports** | External → Internal → Types → Styles |
| **Components** | Functional, typed props |
| **Data Fetching** | Server components, Prisma ORM |
| **Databases** | Decimal for money, CUID for IDs |
| **Error Handling** | Try-catch, custom error classes |
| **Security** | Input validation, parameterized queries |
| **Performance** | Pagination, selective field selection |

---

**Maintained By**: Development Team
**Version**: 1.0
**Last Updated**: 2026-01-31
