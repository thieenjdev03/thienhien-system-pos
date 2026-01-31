# Prisma Schema Best Practices for POS Migration

**Research Date**: 2026-01-27
**Migration**: Dexie (IndexedDB) → Prisma (PostgreSQL)

## 1. Decimal/Money Fields

**Recommendation**: Use `Decimal` type (NOT Float)
```prisma
model Invoice {
  subtotal    Decimal  @db.Numeric(10, 2)
  tax         Decimal  @db.Numeric(10, 2)
  total       Decimal  @db.Numeric(10, 2)
}

model InvoiceItem {
  unitPrice   Decimal  @db.Numeric(10, 2)
  quantity    Decimal  @db.Numeric(8, 2)
  lineTotal   Decimal  @db.Numeric(10, 2)
}
```
- `Decimal` preserves precision (floats lose precision on financial calculations)
- `@db.Numeric(precision, scale)`: e.g., `(10,2)` = 10 total digits, 2 decimals
- Standard for accounting: `(10,2)` or `(12,2)`
- Requires `npm install @prisma/client decimal.js`

## 2. DateTime vs BigInt for Timestamps

**Recommendation**: Use `DateTime` (simpler, more readable)
```prisma
model Invoice {
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  invoiceDate  DateTime
}
```
- `DateTime` → PostgreSQL `timestamp with time zone`
- Auto-generates ISO 8601 strings in Prisma Client
- BigInt useful only if: millisecond-level Unix timestamps required + space critical
- For POS: DateTime is sufficient

## 3. Enum Types for Roles

**Recommendation**: Use native Prisma enums
```prisma
enum Role {
  ADMIN
  CASHIER
  MANAGER
}

model User {
  id    String @id @default(cuid())
  role  Role   @default(CASHIER)
}
```
- Maps to PostgreSQL `enum` type (native, efficient)
- Type-safe in generated client
- Database-enforced constraints

## 4. Optional Fields & Nullable Handling

**Best Practice**:
```prisma
model Customer {
  id               String   @id @default(cuid())
  name             String
  phone            String?  // nullable
  email            String?  @unique
  notes            String?  @db.Text
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
}
```
- `String?` = optional (null allowed)
- `String` = required (enforced)
- Use `@db.Text` for long strings (notes, descriptions)
- Always provide `@default()` for boolean fields (clarity)

## 5. Indexes for Performance

**Critical indexes for POS**:
```prisma
model Invoice {
  id           String   @id @default(cuid())
  invoiceNo    String   @unique  // fast invoice lookup
  customerId   String
  createdAt    DateTime @default(now())
  status       String   @default("DRAFT")

  customer     Customer @relation(fields: [customerId], references: [id])

  @@index([customerId])           // filter by customer
  @@index([createdAt])            // date range queries
  @@index([status, createdAt])    // composite: status filter + sort
}

model InvoiceItem {
  id        String @id @default(cuid())
  invoiceId String
  productId String

  invoice   Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@index([invoiceId])
  @@index([productId])
}
```
- Unique constraint on `invoiceNo` (sequential, must be unique)
- Composite index `[status, createdAt]` for dashboard queries
- Foreign key indexes auto-created (verify in migrations)

## 6. ID Strategy: UUID vs CUID vs Custom

**Recommendation**: CUID for simplicity, UUID if compliance required
```prisma
// Option A: CUID (recommended for new projects)
id String @id @default(cuid())

// Option B: UUID (if required)
id String @id @default(uuid())

// Option C: Custom sequential for invoiceNo
invoiceNo String @unique  // e.g., "INV-2026-001"
```
- CUID: sortable, shorter than UUID (25 chars), collision-resistant
- UUID: V4 unsorted, V7 sortable
- For existing string IDs: migrate via SQL, no type mismatch if data compatible

## 7. Counter Pattern for Sequential Invoice Numbers

**Challenge**: PostgreSQL no native counter (unlike Dexie)
**Solution A: Sequence + Trigger** (atomic, database-level)
```sql
CREATE SEQUENCE invoice_no_seq START 1000;
```
Then in Prisma, use raw SQL in migration or application logic.

**Solution B: Application-Level** (simpler, less atomic)
```typescript
async function getNextInvoiceNo() {
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { invoiceNo: 'desc' },
    select: { invoiceNo: true }
  });
  const lastNo = parseInt(lastInvoice?.invoiceNo.split('-')[2] || '0');
  return `INV-${new Date().getFullYear()}-${(lastNo + 1).toString().padStart(4, '0')}`;
}
```

**Solution C: Prisma `@unique` + Application Retry**
- Generate `invoiceNo` in app, catch unique violation, retry
- Simpler than triggers, acceptable for POS (low concurrency)

Recommended for POS: **Solution B** (application-level, predictable)

## 8. Relationship Patterns

**One-to-Many: Customer → Invoices**
```prisma
model Customer {
  id       String    @id @default(cuid())
  name     String
  invoices Invoice[]
}

model Invoice {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
}
```

**One-to-Many: Invoice → InvoiceItems**
```prisma
model Invoice {
  id    String         @id @default(cuid())
  items InvoiceItem[]
}

model InvoiceItem {
  id        String  @id @default(cuid())
  invoiceId String
  invoice   Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
}
```
- `onDelete: Cascade` ensures items deleted when invoice deleted

**Many-to-One: InvoiceItem → Product**
```prisma
model InvoiceItem {
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Restrict)
}

model Product {
  id    String         @id @default(cuid())
  items InvoiceItem[]
}
```
- `onDelete: Restrict` prevents accidental product deletion if in invoices

## 9. Schema Template for POS

```prisma
generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  CASHIER
  MANAGER
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(CASHIER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Customer {
  id       String    @id @default(cuid())
  name     String
  phone    String?
  email    String?   @unique
  address  String?   @db.Text
  invoices Invoice[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Product {
  id       String         @id @default(cuid())
  name     String
  sku      String         @unique
  price    Decimal        @db.Numeric(10, 2)
  items    InvoiceItem[]
  createdAt DateTime @default(now())

  @@index([sku])
}

model Invoice {
  id         String         @id @default(cuid())
  invoiceNo  String         @unique
  customerId String?
  status     String         @default("DRAFT")
  subtotal   Decimal        @db.Numeric(10, 2)
  tax        Decimal        @db.Numeric(10, 2)
  total      Decimal        @db.Numeric(10, 2)
  items      InvoiceItem[]
  customer   Customer?      @relation(fields: [customerId], references: [id], onDelete: SetNull)
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  @@index([customerId])
  @@index([createdAt])
  @@index([status, createdAt])
}

model InvoiceItem {
  id        String   @id @default(cuid())
  invoiceId String
  productId String
  quantity  Decimal  @db.Numeric(8, 2)
  unitPrice Decimal  @db.Numeric(10, 2)
  lineTotal Decimal  @db.Numeric(10, 2)
  invoice   Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@index([invoiceId])
  @@index([productId])
}
```

## Key Takeaways

1. **Decimal** for money (precision)
2. **DateTime** for timestamps (readability)
3. **Native Enums** for roles (type-safe)
4. **CUID** for IDs (sortable, shorter)
5. **Composite indexes** on query patterns
6. **Application-level counters** for invoice numbers (simpler)
7. **onDelete: Cascade** for dependent data, **Restrict** for referenced
8. **@updatedAt** on all tracked models

## Unresolved Questions

- Invoice number format preference: `INV-2026-001` or sequence-only?
- Required: Multi-tenant support (branches)?
- Timezone handling: UTC stored, local display needed?
- Audit trail: version history on invoices required?
