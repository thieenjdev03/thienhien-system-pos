---
title: "Prisma Database Migration"
description: "Migrate POS from Dexie/IndexedDB to Prisma/PostgreSQL"
status: in_progress
priority: P1
effort: 8h
branch: main
tags: [prisma, database, migration]
created: 2026-01-27
---

# Prisma Database Migration Plan

## Overview

Replace Dexie (client-side IndexedDB) with Prisma (server-side PostgreSQL) for the POS application. Fresh start - no data migration required.

## Current State

| Component | Count | Location |
|-----------|-------|----------|
| Domain Models | 6 | `domain/models.ts` |
| Dexie Database | 1 | `db/index.ts` |
| Repositories | 4 | `repos/` |
| useLiveQuery Hooks | 7 | Components |
| Auth Context | 1 | `contexts/AuthContext.tsx` |

## Target Architecture

- **Database**: PostgreSQL (Prisma ORM)
- **Data Access**: Server Actions (not API routes)
- **UI Pattern**: Server Components + Suspense (replace useLiveQuery)
- **Client State**: useTransition for optimistic updates

## Migration Phases

| Phase | Title | Effort | Status | Dependencies |
|-------|-------|--------|--------|--------------|
| [Phase 1](./phase-01-prisma-schema.md) | Prisma Schema Setup | 1.5h | Done | None |
| [Phase 2](./phase-02-server-actions.md) | Server Actions | 2.5h | Pending | Phase 1 |
| [Phase 3](./phase-03-component-migration.md) | Component Migration | 3h | Pending | Phase 2 |
| [Phase 4](./phase-04-cleanup.md) | Cleanup & Finalize | 1h | Pending | Phase 3 |

## Key Decisions

1. **Decimal for money** - Use `@db.Numeric(10,2)` for financial precision
2. **CUID for IDs** - Sortable, collision-resistant
3. **DateTime over BigInt** - Simpler timestamp handling
4. **Application-level invoice counter** - Simpler than DB sequences
5. **Server Actions for CRUD** - Built-in Next.js caching integration

## Files to Create

```
lib/prisma.ts              # Prisma singleton
app/actions/products.ts    # Product CRUD
app/actions/customers.ts   # Customer CRUD
app/actions/invoices.ts    # Invoice + items + counter
app/actions/users.ts       # Auth operations
app/actions/backup.ts      # Export/import
```

## Files to Modify

- 7 components with useLiveQuery
- `contexts/AuthContext.tsx`
- `app/(auth)/setup/page.tsx`

## Files to Remove

- `db/index.ts`
- `repos/productRepo.ts`
- `repos/customerRepo.ts`
- `repos/invoiceRepo.ts`
- `repos/backupRepo.ts`
- Dexie dependencies from `package.json`

## Success Criteria

- [ ] All 6 models in Prisma schema with relationships
- [ ] Server Actions replace all repository methods
- [ ] No useLiveQuery remaining in codebase
- [ ] Auth works with Prisma (login, user check)
- [ ] Backup export/import functional
- [ ] Zero Dexie imports in codebase
- [ ] All pages load without errors

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Transaction rollback semantics differ | Medium | Test invoice creation thoroughly |
| Decimal handling in UI | Low | Convert to number for display |
| Server component hydration | Medium | Use Suspense boundaries |

## Validation Summary

**Validated:** 2026-01-27
**Questions asked:** 4

### Confirmed Decisions
1. **Offline capability**: Online-only OK - no offline fallback needed
2. **Delete rules**: Cascade for InvoiceItems, Restrict for Products (protect history)
3. **PIN verification**: Keep client-side hash comparison (simpler, sufficient for MVP)
4. **Data refresh**: Manual refetch after mutations + revalidatePath (no polling/WebSocket)

### Action Items
- None - all decisions align with current plan
