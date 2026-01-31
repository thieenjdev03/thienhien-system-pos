# Scout Report: Dexie Database Usage

## Summary
- **Total files using Dexie**: 10+ files
- **Repository pattern**: 4 repos in `repos/` directory
- **Components with useLiveQuery**: 6 files
- **Auth-related**: 2 files (AuthContext, setup page)

## Files to Migrate

### Repository Layer (Priority 1)
| File | Operations | Complexity |
|------|-----------|------------|
| `repos/productRepo.ts` | CRUD, soft delete, bulk import | High |
| `repos/customerRepo.ts` | CRUD, debt management | Medium |
| `repos/invoiceRepo.ts` | CRUD, transactions, counter | High |
| `repos/backupRepo.ts` | Export/import all tables | High |

### Auth Layer (Priority 2)
| File | Operations |
|------|-----------|
| `contexts/AuthContext.tsx` | db.users.count(), toArray() |
| `app/(auth)/setup/page.tsx` | db.users.add() |

### UI Components with useLiveQuery (Priority 3)
| File | Hook Usage |
|------|-----------|
| `app/(dashboard)/products/ProductsPage.tsx` | Products list |
| `app/(dashboard)/invoices/new/page.tsx` | Customer search |
| `app/(dashboard)/invoices/page.tsx` | Invoice list |
| `app/(dashboard)/customers/CustomersPage.tsx` | Customer list |
| `components/ProductSearch.tsx` | Active products |
| `components/ProductSearchAddPanel.tsx` | Product search |
| `components/CustomerSelect.tsx` | Customer dropdown |

### Database Config (Remove after migration)
| File | Purpose |
|------|---------|
| `db/index.ts` | Dexie database class |

## Key Patterns to Preserve
1. Soft delete for products (active flag)
2. Product snapshots in invoice items
3. Sequential invoice numbering via Counter
4. Customer debt tracking
5. Multi-table transactions (invoice creation, backup)

## Dependencies to Remove
```json
"dexie": "^4.2.1",
"dexie-react-hooks": "^4.2.0"
```
