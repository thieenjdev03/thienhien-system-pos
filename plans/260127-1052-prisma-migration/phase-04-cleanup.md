# Phase 4: Cleanup & Finalize

## Context

- [Phase 3: Component Migration](./phase-03-component-migration.md) - Must be complete

## Overview

Remove all Dexie code, dependencies, and verify the migration is complete. Final testing and documentation.

**Effort**: 1h

## Requirements

1. Remove Dexie dependencies from package.json
2. Delete unused Dexie-related files
3. Verify no Dexie imports remain
4. Test all features end-to-end
5. Update documentation if needed

## Related Code Files

### Files to Delete

| File | Reason |
|------|--------|
| `db/index.ts` | Dexie database class |
| `repos/productRepo.ts` | Replaced by server actions |
| `repos/customerRepo.ts` | Replaced by server actions |
| `repos/invoiceRepo.ts` | Replaced by server actions |
| `repos/backupRepo.ts` | Replaced by server actions |

### Dependencies to Remove

```json
{
  "dexie": "^4.2.1",
  "dexie-react-hooks": "^4.2.0"
}
```

### Files to Verify Clean

All files should have no imports from:
- `dexie`
- `dexie-react-hooks`
- `../db` or `@/db`
- `../repos/*` or `@/repos/*`

## Implementation Steps

### 4.1 Remove Dexie Dependencies

```bash
npm uninstall dexie dexie-react-hooks
```

### 4.2 Delete Obsolete Files

```bash
rm -rf db/
rm -rf repos/
```

### 4.3 Verify No Dexie Imports

```bash
# Should return no results
grep -r "from 'dexie" --include="*.ts" --include="*.tsx" .
grep -r "from 'dexie-react-hooks" --include="*.ts" --include="*.tsx" .
grep -r "from '@/db" --include="*.ts" --include="*.tsx" .
grep -r "from '../db" --include="*.ts" --include="*.tsx" .
grep -r "from '@/repos" --include="*.ts" --include="*.tsx" .
grep -r "useLiveQuery" --include="*.ts" --include="*.tsx" .
```

### 4.4 Update TypeScript Config (if needed)

Check `tsconfig.json` paths for any db/* or repos/* references.

### 4.5 Run Type Check

```bash
npm run type-check  # or: npx tsc --noEmit
```

### 4.6 Run Linter

```bash
npm run lint
```

### 4.7 Build Test

```bash
npm run build
```

### 4.8 End-to-End Testing Checklist

| Feature | Test Steps | Pass |
|---------|-----------|------|
| Setup | Create first admin user | [ ] |
| Login | Enter PIN, verify session | [ ] |
| Products | Create, edit, soft-delete, restore | [ ] |
| Products | Search by name/category | [ ] |
| Products | Bulk import (JSON) | [ ] |
| Customers | Create, edit, delete | [ ] |
| Customers | Search by name/phone | [ ] |
| Customers | Debt tracking | [ ] |
| Invoices | Create with items | [ ] |
| Invoices | Customer association | [ ] |
| Invoices | Sequential numbering | [ ] |
| Invoices | Debt increase on partial payment | [ ] |
| Invoices | View invoice details | [ ] |
| Backup | Export all data | [ ] |
| Backup | Import from file | [ ] |
| Logout | Session cleared | [ ] |

### 4.9 Clean Up Unused Imports in domain/models.ts

Check if any types are no longer used:
- `BackupData`, `BackupPayload` - Still used by backup actions
- `CartLine`, `InvoiceCreateInput` - Still used by invoice creation
- All types should still be relevant

### 4.10 Update .gitignore

Ensure these are ignored:
```
.env
.env.local
prisma/migrations/
lib/generated/
```

### 4.11 Documentation Updates

Update `README.md` if it mentions:
- IndexedDB / local storage for data
- Dexie setup instructions
- Offline-first capabilities (no longer true)

Add to README:
```markdown
## Database Setup

1. Ensure PostgreSQL is running
2. Copy `.env.example` to `.env` and set `DATABASE_URL`
3. Run migrations: `npx prisma migrate dev`
4. Generate client: `npx prisma generate`
```

## Todo List

- [ ] Run `npm uninstall dexie dexie-react-hooks`
- [ ] Delete `db/` directory
- [ ] Delete `repos/` directory
- [ ] Run grep checks for leftover imports
- [ ] Run `npm run type-check`
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Test setup flow (first user creation)
- [ ] Test login flow
- [ ] Test products CRUD + search + import
- [ ] Test customers CRUD + search
- [ ] Test invoice creation
- [ ] Test invoice listing with customer names
- [ ] Test backup export
- [ ] Test backup import
- [ ] Update README.md with Prisma setup
- [ ] Update .gitignore if needed
- [ ] Commit all changes

## Success Criteria

- [ ] `npm run build` succeeds
- [ ] Zero Dexie-related code in codebase
- [ ] All E2E tests pass
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Application runs without runtime errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missed import somewhere | Low | Low | Grep + build will catch |
| Runtime error not caught by types | Medium | Medium | E2E testing |
| Performance regression | Low | Low | Monitor on staging |

## Notes

- **Rollback Plan**: Git revert to pre-migration commit if critical issues found
- **Data**: Fresh start assumed - no IndexedDB data to preserve
- **Offline**: App now requires network connection (no local DB fallback)

## Post-Migration Considerations

1. **Real-time updates**: Consider adding WebSocket or polling if multi-user real-time needed
2. **Caching**: Add `unstable_cache` or data cache for frequently read data
3. **Pagination**: Add cursor-based pagination for large datasets
4. **Audit log**: Consider adding audit table for invoice changes
