# Phase 1: Prisma Schema Setup

## Context

- [Research: Prisma Schema Best Practices](./research/researcher-01-prisma-schema.md)
- [Research: Next.js + Prisma Patterns](./research/researcher-02-nextjs-prisma.md)
- [Scout: Dexie Usage](./scout/scout-dexie-usage.md)

## Overview

Create complete Prisma schema with all 6 models, configure client singleton, run initial migration.

**Effort**: 1.5h

## Requirements

1. Define all 6 models with proper types and relationships
2. Use Decimal for money fields (precision matters)
3. Create enum for user roles
4. Add necessary indexes for query performance
5. Setup Prisma client singleton for dev/prod
6. Run migration to create PostgreSQL tables

## Architecture

### Model Relationships

```
User (standalone)
Customer 1──N Invoice
Invoice 1──N InvoiceItem
Product 1──N InvoiceItem
Counter (standalone - key-value)
```

### Type Mappings (Dexie → Prisma)

| Field | Dexie | Prisma |
|-------|-------|--------|
| id | string (nanoid) | String @default(cuid()) |
| price/money | number | Decimal @db.Numeric(10,2) |
| timestamp | number (epoch) | DateTime |
| role | string | Role enum |
| nullable | optional prop | `?` suffix |

## Related Code Files

| File | Purpose |
|------|---------|
| `domain/models.ts` | Source of truth for entity shapes |
| `prisma/schema.prisma` | Target schema file (stub exists) |
| `db/index.ts` | Reference for indexes/relationships |

## Implementation Steps

### 1.1 Update Prisma Schema (prisma/schema.prisma)

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
  admin
  cashier
}

model User {
  id          String   @id @default(cuid())
  pinHash     String
  displayName String
  role        Role     @default(cashier)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Customer {
  id        String    @id @default(cuid())
  name      String
  phone     String?
  address   String?   @db.Text
  note      String?   @db.Text
  debt      Decimal   @default(0) @db.Numeric(12, 2)
  invoices  Invoice[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([name])
  @@index([phone])
}

model Product {
  id        String        @id @default(cuid())
  name      String
  category  String?
  unit      String
  price1    Decimal?      @db.Numeric(10, 2)
  price2    Decimal?      @db.Numeric(10, 2)
  price3    Decimal?      @db.Numeric(10, 2)
  note      String?       @db.Text
  active    Boolean       @default(true)
  sourceId  Int?
  items     InvoiceItem[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@index([name])
  @@index([category])
  @@index([active])
}

model Invoice {
  id           String        @id @default(cuid())
  invoiceNo    String        @unique
  customerId   String?
  customer     Customer?     @relation(fields: [customerId], references: [id], onDelete: SetNull)
  subtotal     Decimal       @db.Numeric(12, 2)
  discount     Decimal       @default(0) @db.Numeric(12, 2)
  total        Decimal       @db.Numeric(12, 2)
  paid         Decimal       @db.Numeric(12, 2)
  change       Decimal       @db.Numeric(12, 2)
  debtIncrease Decimal       @default(0) @db.Numeric(12, 2)
  note         String?       @db.Text
  items        InvoiceItem[]
  createdAt    DateTime      @default(now())

  @@index([customerId])
  @@index([createdAt])
  @@index([invoiceNo])
}

model InvoiceItem {
  id                  String   @id @default(cuid())
  invoiceId           String
  invoice             Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  productId           String
  product             Product  @relation(fields: [productId], references: [id], onDelete: Restrict)
  productNameSnapshot String
  categorySnapshot    String?
  unitSnapshot        String
  qty                 Decimal  @db.Numeric(10, 2)
  unitPrice           Decimal  @db.Numeric(10, 2)
  lineTotal           Decimal  @db.Numeric(12, 2)
  noteSnapshot        String?  @db.Text

  @@index([invoiceId])
  @@index([productId])
}

model Counter {
  key   String @id
  value Int    @default(0)
}
```

### 1.2 Create Prisma Singleton (lib/prisma.ts)

```typescript
import { PrismaClient } from './generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 1.3 Add DATABASE_URL to .env

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/pos_db?schema=public"
```

### 1.4 Run Prisma Commands

```bash
# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Verify tables created
npx prisma studio
```

## Todo List

- [x] Update `prisma/schema.prisma` with all 6 models
- [x] Create `lib/prisma.ts` singleton (⚠️ has accelerateUrl bug - needs fix)
- [x] Add `DATABASE_URL` to `.env` (and `.env.example`)
- [x] Run `npx prisma generate`
- [x] Run `npx prisma migrate dev --name init`
- [x] Verify tables in Prisma Studio
- [x] Test basic connection with a simple query

## Success Criteria

- [x] `npx prisma validate` passes
- [x] Migration creates all 6 tables + Counter
- [x] Prisma Studio shows correct schema
- [x] `prisma.user.findMany()` works in a test script
- [x] Generated types in `lib/generated/prisma/`

## Completion Timestamp

**Phase 1 Completed**: 2026-01-31

---

## Code Review Results (2026-01-31)

**Status**: 100% Complete - All items resolved

**Report**: plans/reports/code-reviewer-260131-1448-prisma-phase1.md

**Critical Issues**:
1. lib/prisma.ts uses invalid `accelerateUrl` parameter causing TypeScript error
2. Schema uses @db.Decimal instead of @db.Numeric per plan spec
3. Missing `url = env("DATABASE_URL")` in schema.prisma datasource

**Must Fix Before Phase 2**:
- Remove accelerateUrl from lib/prisma.ts
- Replace all @db.Decimal with @db.Numeric in schema.prisma
- Add url line to datasource block
- Run npx prisma generate after fixes
- Test connection with simple query

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| DATABASE_URL not set | Low | High | Check .env before migrate |
| Schema syntax errors | Low | Low | Run validate first |
| Decimal import missing | Medium | Low | Install @prisma/client |
| Connection refused | Medium | High | Verify PostgreSQL running |

## Notes

- Invoice items use `onDelete: Cascade` (delete items when invoice deleted)
- Products use `onDelete: Restrict` (prevent deletion if referenced in invoices)
- Customer uses `onDelete: SetNull` (keep invoices but null out customerId)
- Counter uses `key` as primary key (matches Dexie pattern)
