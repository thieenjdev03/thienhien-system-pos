---
title: "Cross-cutting architecture and UX refactors"
description: "Unify auth/layout, data layer, design system, and feature structure across the POS Next.js app."
status: pending
priority: P2
effort: 10h
branch: unknown
tags: [refactor, frontend, backend, tech-debt]
created: 2026-03-12
---

## Overview

Monolithic Next.js App Router app with `(auth)` and `(dashboard)` groups, Postgres+Prisma backend, Dexie for offline/cache, Tailwind with large `globals.css`, and domain areas for invoices, customers, products, and auth.
Pain points: oversized feature components, huge `globals.css`, inconsistent data access (Prisma repos vs raw `fetch`), partial i18n, client-heavy data fetching, and lack of unified data layer and design system.
Opportunities: standardize on Prisma-first data access, treat Dexie as cache with clear sync rules, introduce a shadcn-style design system, refactor large components into smaller pieces/hooks, and tighten type/i18n/error handling.
Invoice-new flows have their own detailed plan under `plans/260128-2349-invoice-page-refactor/` and are out of scope here.

## Phases

| # | Phase | Goal | Status | Link |
|---|-------|------|--------|------|
| 1 | Auth/layout & server-vs-client structure | Clarify layout/auth boundaries and shift suitable logic to server components/handlers. | planned | [phase-01-auth-layout-and-server-client-structure](./phase-01-auth-layout-and-server-client-structure.md) |
| 2 | Data layer & API unification | Establish a Prisma-first data layer with typed APIs and disciplined Dexie usage. | planned | [phase-02-data-layer-and-api-unification](./phase-02-data-layer-and-api-unification.md) |
| 3 | Design system & styles | Introduce a shadcn-style design system and progressively modularize `globals.css`. | planned | [phase-03-design-system-and-style-modularization](./phase-03-design-system-and-style-modularization.md) |
| 4 | Large-feature refactors (customers/products) | Split oversized feature components into composable pieces aligned with the new data/UI layers. | planned | [phase-04-large-feature-refactors-customers-and-products](./phase-04-large-feature-refactors-customers-and-products.md) |
| 5 | i18n & UX polish | Make i18n coverage and list/search UX consistent and fast across domains. | planned | [phase-05-i18n-and-ux-polish](./phase-05-i18n-and-ux-polish.md) |

## Dependencies & Notes

- Reuse and align with `plans/260128-2349-invoice-page-refactor/*` instead of duplicating invoice-new work.
- Prefer incremental, feature-by-feature refactors to avoid large risky branches.
- Keep file sizes under ~200 lines where practical by extracting components/hooks and shared utilities.

