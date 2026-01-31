---
title: "Customer Popup Form UI/UX Update"
description: "Refactor CustomerForm to use reusable Modal component for add/edit customers"
status: pending
priority: P2
effort: 1h
branch: main
tags: [frontend, refactor, ui-ux]
created: 2026-01-28
---

# Customer Popup Form UI/UX Update

## Overview

Refactor `CustomerForm` component to use existing reusable `Modal` component instead of custom overlay implementation. This improves code consistency, accessibility, and maintainability.

## Current State

- `CustomerForm.tsx` renders its own overlay using `.form-modal` CSS classes
- `Modal.tsx` component exists with full features but unused by CustomerForm
- Modal features: ESC key close, overlay click close, focus management, aria accessibility

## Target State

- CustomerForm wrapped inside Modal component
- Consistent UX across all forms in application
- Better accessibility via Modal's built-in aria attributes

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Refactor CustomerForm | Pending | 45m | [phase-01](./phase-01-refactor-customer-form.md) |
| 2 | Verify & Test | Pending | 15m | [phase-02](./phase-02-verify-test.md) |

## Dependencies

- `components/Modal.tsx` - existing reusable modal
- `app/(dashboard)/customers/CustomerForm.tsx` - form to refactor
- `app/(dashboard)/customers/CustomersPage.tsx` - parent component

## Files Affected

| File | Action | Description |
|------|--------|-------------|
| `app/(dashboard)/customers/CustomerForm.tsx` | Modify | Integrate Modal component |
| `app/(dashboard)/customers/CustomersPage.tsx` | Modify | Update props if needed |

## Success Criteria

- [ ] CustomerForm displays inside Modal popup
- [ ] Modal closes via: overlay click, ESC key, X button, Cancel button
- [ ] Form validation works correctly
- [ ] Focus management works (focus form on open, restore on close)
- [ ] No breaking changes to other components
