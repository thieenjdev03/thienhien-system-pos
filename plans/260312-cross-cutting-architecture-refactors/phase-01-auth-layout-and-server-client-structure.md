## Context Links

- Existing auth routes: `app/(auth)/login/page.tsx`, `app/(auth)/register` (if present)
- Dashboard shell: `app/(dashboard)/layout.tsx`, `app/(dashboard)/page.tsx`
- Invoice new plan (for reference only): `plans/260128-2349-invoice-page-refactor/plan.md`

## Overview

- **Priority**: P1
- **Status**: planned
- **Goal**: clarify auth/layout boundaries, enforce protected dashboard access, and shift suitable logic from client-heavy pages into server components and route handlers without over-architecting.

## Key Insights

- `(auth)` and `(dashboard)` route groups exist but auth concerns leak into pages and components.
- Many pages (including invoices, customers, products) are client components doing data fetching directly.
- Consistent layout and auth handling will reduce duplication and simplify future feature refactors.

## Requirements

- Single, well-defined auth boundary between `(auth)` and `(dashboard)` that is easy to reason about.
- Dashboard layout ensures authenticated user context is available to child routes with minimal prop drilling.
- Clear guidance on when to use server components vs client components vs route handlers.
- No breaking changes to existing login/logout flows.

## Architecture

- **Auth boundary**:
  - Use a shared server-side auth utility (e.g. `getCurrentUser`) in `(dashboard)` layout or a wrapper to gate access.
  - Keep `(auth)` pages unauthenticated, with redirects if already logged in.
- **Server vs client**:
  - Default to server components for data fetching and initial render of lists/detail views.
  - Reserve client components for interactivity (forms, modals, local state, Dexie integration).
- **Layout structure**:
  - Ensure dashboard layout provides navigation shell, user context, and loading/error boundaries.

## Related Code Files

- `app/(auth)/login/page.tsx`
- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/page.tsx`
- Representative dashboard pages: `app/(dashboard)/customers/CustomersPage.tsx`, `app/(dashboard)/products/ProductsPage.tsx`

## Implementation Steps

1. Audit `(auth)` and `(dashboard)` layouts and pages to document current auth checks and redirects.
2. Define a minimal server-side auth helper (or reuse existing) for `(dashboard)` layout to enforce access.
3. Update `(dashboard)` layout to:
   - Fetch current user on the server.
   - Redirect unauthenticated users to `(auth)/login`.
   - Provide user context to children via React context or props where needed.
4. Identify top 2–3 client-heavy pages (excluding invoice-new) and:
   - Move initial data fetching into server components or route handlers.
   - Keep interactive pieces as client components consuming server-provided data.
5. Document simple guidelines for server vs client usage in this repo’s context (short section in `docs` or within this plan).

## Todo List

- [ ] Document current auth/layout behavior for `(auth)` and `(dashboard)`
- [ ] Implement or standardize server-side auth helper for `(dashboard)` layout
- [ ] Enforce dashboard auth in layout with redirects
- [ ] Refactor at least 2 client-heavy dashboard pages to server-first data fetching
- [ ] Write short internal guideline on server vs client usage

## Success Criteria

- Unauthenticated users cannot access any `(dashboard)` route and are consistently redirected to login.
- Authenticated users see consistent dashboard Chrome with user context available without deep prop drilling.
- Selected pages show server-rendered data on first load with client components only for interaction.

## Risk Assessment

- **Risk**: Breaking existing auth flows and redirects.
  - **Mitigation**: Start with small, low-risk routes; test login/logout and deep links.
- **Risk**: Over-aggressive server-ification causing UX regressions.
  - **Mitigation**: Preserve client-side interactions; only move initial data fetch.

## Security Considerations

- Ensure all protected routes rely on server-side auth checks instead of solely client-side guards.
- Avoid exposing sensitive user data in client-accessible contexts unnecessarily.
- Keep CSRF/session handling consistent with existing backend practices.

## Next Steps

- Feed layout and auth decisions into Phase 2 (data layer) so repositories/services can assume authenticated context.
- Use refactored pages from this phase as templates for Phase 4 feature refactors.

