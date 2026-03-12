## Context Links

- Prisma/Postgres setup: Prisma schema and database config files
- Existing repositories/services vs raw `fetch` usage across app routes
- Dexie/offline utilities and usage sites
- Invoice-specific plan for reference: `plans/260128-2349-invoice-page-refactor/phase-02-cart-components.md`

## Overview

- **Priority**: P1
- **Status**: planned
- **Goal**: standardize on a Prisma-first data layer with typed APIs, unify access patterns, and define Dexie as an explicit cache layer with simple sync rules to improve correctness, performance, and DX.

## Key Insights

- Mix of direct Prisma usage, ad-hoc `fetch` calls, and scattered data helpers creates inconsistency.
- Dexie is used for offline/cache behavior but without a clearly documented contract.
- Search/list endpoints are potential performance hotspots if not consistently server-filtered/paginated.

## Requirements

- Single, documented pattern for data access (repositories/services on top of Prisma).
- Type-safe API surface between server and client (TS types and/or schema validation).
- Clear rules for:
  - When to use Prisma directly (server-only).
  - When to call internal HTTP APIs.
  - When/how Dexie participates as cache.
- Minimal, not over-engineered; avoid full-blown micro-ORM or CQRS layers.

## Architecture

- **Repositories/services**:
  - Create per-domain repositories (e.g. `customersRepository`, `productsRepository`) that wrap Prisma queries.
  - Keep them thin: one level above Prisma, no complex abstractions.
- **API typing**:
  - Define shared TypeScript types (and optionally Zod schemas) for key DTOs and list/search query params.
  - Enforce consistent pagination/search parameters across list endpoints.
- **Dexie as cache**:
  - Treat Dexie as a write-through/read-through cache for selected domains (e.g. products, frequently-used lists).
  - Document simple sync strategy (e.g. invalidate on mutation, periodic background refresh, or version stamps).

## Related Code Files

- Prisma schema: `prisma/schema.prisma`
- Data access utilities (repositories, Prisma clients)
- API routes for customers, products, invoices
- Dexie setup and hook usages

## Implementation Steps

1. Inventory current data access:
   - List all places using Prisma directly.
   - List all API routes and their consumers.
   - List Dexie usage sites and current sync assumptions.
2. Define a minimal repository pattern per domain:
   - For customers/products: list, detail, create/update/delete, and search endpoints.
   - Use Prisma under the hood, returning plain TS types.
3. Align API routes with repositories:
   - Route handlers call repositories.
   - Normalize request/response shapes (including pagination and search parameters).
4. Define shared types/schemas:
   - Common `PaginatedResult<T>` type.
   - Search/filter input types for main lists.
5. Clarify Dexie strategy:
   - Select 1–2 critical domains for Dexie caching.
   - Document and implement simple cache lifecycle (populate, invalidate, refresh) using hooks or services.

## Todo List

- [ ] Inventory current Prisma, API route, and Dexie usage
- [ ] Draft and implement minimal repository interfaces for customers/products
- [ ] Align key API routes with repositories and shared DTO types
- [ ] Introduce shared pagination/search types
- [ ] Document and implement Dexie cache behavior for at least one domain

## Success Criteria

- New features can follow a single “Prisma → repository → route → client” pattern.
- At least customers and products lists use shared pagination/search types and server-side filtering.
- Dexie usage is confined to a small set of well-documented entry points with predictable sync behavior.

## Risk Assessment

- **Risk**: Over-abstracting data layer and adding indirection without value.
  - **Mitigation**: Keep repositories very thin; no generic repository base unless clearly needed.
- **Risk**: Inconsistent migration of existing endpoints leading to mixed patterns.
  - **Mitigation**: Tackle per-domain; complete customers/products before touching others.

## Security Considerations

- Ensure repositories enforce tenant/business constraints and never leak unauthorized data.
- Validate and sanitize search/filter inputs at the API boundary.
- Avoid sending sensitive fields to clients; define explicit DTOs when necessary.

## Next Steps

- Feed repository and type decisions into Phase 3 (design system) so components can rely on consistent data shapes.
- Use standardized data patterns as the backbone for Phase 4 feature refactors and Phase 5 UX improvements.

