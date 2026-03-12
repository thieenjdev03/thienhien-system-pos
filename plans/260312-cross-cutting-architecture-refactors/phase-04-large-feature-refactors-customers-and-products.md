## Context Links

- Customers: `app/(dashboard)/customers/CustomersPage.tsx`, `app/(dashboard)/customers/CustomerForm.tsx`
- Products: `app/(dashboard)/products/ProductsPage.tsx` (and related components)
- Invoices (for patterns only): `app/(dashboard)/invoices/new/page.tsx`, `app/(dashboard)/invoices/new/components/PaymentSummary.tsx`
- Invoice-new refactor plan (do not duplicate): `plans/260128-2349-invoice-page-refactor/*`

## Overview

- **Priority**: P2
- **Status**: planned
- **Goal**: refactor oversized customers/products feature components into smaller, composable pieces and hooks aligned with the new auth/layout, data layer, and design system.

## Key Insights

- `CustomersPage`, `ProductsPage`, `PaymentSummary`, and `CustomerForm` are large, multi-responsibility components.
- Concerns mixed: data fetching, business rules, formatting, UI rendering, and local state.
- Refactoring along clear boundaries will improve maintainability and prepare features for future enhancements.

## Requirements

- Keep feature behavior functionally equivalent while restructuring internals.
- Target file size guideline (~200 lines) by extracting components/hooks.
- Align with Phase 1 (auth/layout) and Phase 2 (data layer) patterns for data fetching and mutations.
- Use Phase 3 design system primitives where possible.

## Architecture

- **Separation of concerns**:
  - Container components: orchestrate data fetching (using repositories/APIs) and high-level state.
  - Presentational components: tables, forms, detail cards using design system primitives.
  - Hooks: encapsulate feature-specific behaviors (e.g. `useCustomerSearch`, `useProductSelection`).
- **Search/list performance**:
  - Server-side filtering and pagination via standardized list endpoints.
  - Client-side debouncing for search inputs and minimal re-renders.

## Related Code Files

- `app/(dashboard)/customers/CustomersPage.tsx`
- `app/(dashboard)/customers/CustomerForm.tsx`
- `app/(dashboard)/products/ProductsPage.tsx`
- Shared table/search/filter components once created in Phase 3

## Implementation Steps

1. For customers feature:
   - Map responsibilities inside `CustomersPage` and `CustomerForm`.
   - Extract:
     - Container for fetching/paginating customers.
     - Presentational table component.
     - Form component using shared form primitives.
     - Hooks for search, filtering, and selection.
2. For products feature:
   - Perform similar responsibility mapping and extraction from `ProductsPage`.
   - Align list/search behavior with standardized APIs from Phase 2.
3. Integrate design system:
   - Replace ad-hoc buttons/inputs/tables with primitives where practical.
4. Optimize search/list performance:
   - Introduce debounced search inputs.
   - Ensure server-side pagination and filters are used consistently.

## Todo List

- [ ] Audit responsibilities and pain points in customers components
- [ ] Extract containers, presentational components, and hooks for customers
- [ ] Repeat extraction and cleanup for products feature
- [ ] Integrate design system primitives into refactored components
- [ ] Ensure list/search flows use standardized data layer and pagination

## Success Criteria

- Customers and products features have smaller, focused components with clear roles.
- Search and list interactions feel responsive and predictable under normal data sizes.
- New developers can locate and modify feature logic without touching monolithic files.

## Risk Assessment

- **Risk**: Behavior regressions during refactor.
  - **Mitigation**: Preserve props and public behavior; refactor internals incrementally; add smoke tests where possible.
- **Risk**: Divergence from invoice-new patterns.
  - **Mitigation**: Reuse patterns and utilities where appropriate but keep invoice-specific logic in its own plan.

## Security Considerations

- Ensure refactors do not relax any authorization checks or leak extra data columns.
- Avoid hiding key actions behind fragile UI only; retain clear affordances for destructive operations.

## Next Steps

- Use refactored customers/products as exemplars for future domain refactors (e.g. invoice detail plan).
- Feed UX and performance observations into Phase 5 for broader i18n and UX polish.

