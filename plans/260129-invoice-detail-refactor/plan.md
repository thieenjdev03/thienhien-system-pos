---
title: "Invoice Detail Page Refactor"
description: "Move detail page to correct route, enhance UI/UX, and align with new design system"
status: pending
priority: P1
effort: 2h
branch: main
tags: [frontend, refactor, ui-ux, pos, invoice-detail]
created: 2026-01-29
---

# Invoice Detail Page Refactor

## Overview

Refactor trang "Chi tiết hoá đơn" currently located at `app/(dashboard)/invoices/new/[id]/page.tsx` (incorrect) to `app/(dashboard)/invoices/[id]/page.tsx` (correct).
Enhance the UI to match the new "Create Invoice" design, improve data visualization, and fix UX issues.

## Current State

| Component | Current Location | Issues |
|-----------|------------------|--------|
| Invoice Detail Page | `invoices/new/[id]/page.tsx` | **Wrong Route** (nested under new), Monolithic, negative numbers shown, basic UI |

**Issues:**
1.  **Route:** URL is `/invoices/new/1` instead of `/invoices/1`.
2.  **UX:** "Tiền thừa" shows as negative number (e.g. -50.000).
3.  **UI:** Basic table, no visual hierarchy for totals.
4.  **Code:** No separation of concerns (all in one file).

## Target Architecture

```
app/(dashboard)/invoices/[id]/
├── page.tsx                    # Main layout, data fetching
└── components/
    ├── InvoiceHeader.tsx       # Title, Status, Actions (Print/Back)
    ├── CustomerCard.tsx        # Reusable customer display
    ├── InvoiceItemsTable.tsx   # Read-only items table
    └── InvoiceTotals.tsx       # Totals & Payment info
```

## Phases

| # | Phase | Status | Effort | Description |
|---|-------|--------|--------|-------------|
| 1 | Move & Fix Route | Pending | 0.5h | Move file, fix imports, ensure routing works |
| 2 | Component Extraction | Pending | 1h | Extract generic components and specialized invoice views |
| 3 | UI/UX Polish | Pending | 0.5h | Apply new styles, fix negative numbers, add Print button |

## Success Criteria

- [ ] Page accessible at `/invoices/[id]`
- [ ] Old route `/invoices/new/[id]` removed
- [ ] UI matches "Create Invoice" aesthetic (slate/white/blue)
- [ ] "Change" displayed as positive number with "Tiền thừa" label
- [ ] Data loading handles "Not Found" gracefully
- [ ] Print button available (mock functional or simple window.print())

## Files Affected

| File | Action |
|------|--------|
| `app/(dashboard)/invoices/new/[id]/page.tsx` | DELETE / MOVE |
| `app/(dashboard)/invoices/[id]/page.tsx` | CREATE |
| `app/(dashboard)/invoices/[id]/components/*.tsx` | CREATE |
