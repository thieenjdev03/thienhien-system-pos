---
title: "Invoice Page UX Refactor"
description: "Keyboard-first POS invoice creation with enhanced price tiers, cart UX, and payment clarity"
status: pending
priority: P1
effort: 6h
branch: main
tags: [frontend, refactor, ui-ux, pos, invoice]
created: 2026-01-28
---

# Invoice Page UX Refactor

## Overview

Refactor trang "Tạo hoá đơn" (`app/(dashboard)/invoices/new/page.tsx`) theo hướng keyboard-first, giảm thao tác, tối ưu bán nhanh cho POS.

## Current State

| Component | File | Lines | Issues |
|-----------|------|-------|--------|
| Invoice Page | `invoices/new/page.tsx` | 577 | Monolithic, mixed concerns |
| Product Search | `ProductSearchAddPanel.tsx` | 314 | Good keyboard nav, needs focus improvements |
| Formatters | `utils/formatters.ts` | 45 | Missing parseMoney |

**Current Features:**
- 3-tier pricing (basic radio buttons)
- Cart table with qty controls
- Payment sidebar (sticky)
- Keyboard shortcuts (Ctrl+K, Ctrl+Enter)

**Gaps:**
- No tier change confirmation for cart items
- No "custom price" badge/reset
- Negative change shows as negative number (confusing)
- No toast/undo for item removal
- No discount type toggle (amount vs %)
- No auto-focus on qty after add

## Target Architecture

```
app/(dashboard)/invoices/new/
├── page.tsx                    # Main layout, orchestration
├── components/
│   ├── PriceTierSwitch.tsx     # Tier selector with descriptions
│   ├── ProductSearch.tsx       # Enhanced search (refactored)
│   ├── CartTable.tsx           # Cart container
│   ├── CartItem.tsx            # Single cart row
│   └── PaymentSummary.tsx      # Payment sidebar
└── hooks/
    └── useInvoiceForm.ts       # State management hook
```

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Foundation & Types | Pending | 1h | [phase-01](./phase-01-foundation.md) |
| 2 | Price Tier & Cart Components | Pending | 2h | [phase-02](./phase-02-cart-components.md) |
| 3 | Payment Summary & UX | Pending | 2h | [phase-03](./phase-03-payment-ux.md) |
| 4 | Integration & Polish | Pending | 1h | [phase-04](./phase-04-integration.md) |

## Key Decisions

1. **State Hook**: Extract to `useInvoiceForm.ts` for testability
2. **Component Split**: 5 new components to replace monolithic page
3. **Toast System**: Use simple DOM-based toast (no library)
4. **Discount Mode**: Toggle between amount/percentage
5. **Price Labels**: Giá 1 (Lẻ), Giá 2 (Sỉ), Giá 3 (Đại lý)

## Success Criteria

- [ ] Enter on search adds first product, auto-focus qty
- [ ] Tier change prompts confirmation for existing cart
- [ ] Custom price shows badge + reset button
- [ ] Qty=0 removes with toast+undo
- [ ] Discount toggle: amount vs %
- [ ] CTA changes based on debt state
- [ ] Toast on save success
- [ ] All keyboard shortcuts working

## Files Affected

| File | Action |
|------|--------|
| `invoices/new/page.tsx` | Refactor |
| `invoices/new/components/*.tsx` | Create (5 files) |
| `invoices/new/hooks/useInvoiceForm.ts` | Create |
| `utils/formatters.ts` | Add parseMoney |
| `shared/i18n/vi.ts` | Add new strings |
| `app/globals.css` | Add toast styles |
