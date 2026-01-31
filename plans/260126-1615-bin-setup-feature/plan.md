---
title: "BIN (Device/POS ID) Setup Feature"
description: "Add device identifier setup screen before PIN setup on first app visit"
status: pending
priority: P2
effort: 4h
branch: main
tags: [auth, device-id, localStorage, onboarding]
created: 2026-01-26
---

# BIN Setup Feature

## Overview
Add BIN (Device/POS machine identifier) setup flow. Users enter unique BIN on first visit, stored in localStorage, displayed in UI header. Runs BEFORE PIN setup.

## Current Flow
1. Visit app -> Check if users exist in IndexedDB
2. No users -> `/setup` (create PIN)
3. Users exist -> `/login` (enter PIN)

## New Flow
1. Visit app -> Check localStorage for BIN
2. No BIN -> `/bin-setup` (enter BIN)
3. BIN saved -> Continue to existing flow (check users -> setup/login)

## BIN Rules
- Format: Alphanumeric, 6-12 characters (regex: `/^[A-Za-z0-9]{6,12}$/`)
- localStorage key: `pos_device_bin`
- Display in Navbar component

## Phases
| Phase | Description | Effort |
|-------|-------------|--------|
| [01](phase-01-bin-utilities.md) | BIN validation & storage utilities | 30m |
| [02](phase-02-bin-context.md) | Add BIN state to AuthContext | 30m |
| [03](phase-03-bin-setup-page.md) | Create BIN entry page | 1h |
| [04](phase-04-update-auth-flow.md) | Update login/setup redirects | 1h |
| [05](phase-05-display-bin-ui.md) | Display BIN in Navbar | 1h |

## Files to Modify
- `utils/auth.ts` - add BIN validation
- `contexts/AuthContext.tsx` - add BIN state
- `app/(auth)/bin-setup/page.tsx` - new page
- `app/(auth)/login/page.tsx` - update redirect logic
- `app/(auth)/setup/page.tsx` - update redirect logic
- `components/ui/Navbar.tsx` - display BIN

## Success Criteria
- First-time visitors see BIN setup before PIN setup
- BIN persists in localStorage across sessions
- Invalid BIN formats rejected with clear error
- BIN visible in dashboard header
- Subsequent visits skip BIN step

## Risk Assessment
- LOW: Breaking existing auth flow - mitigated by checking BIN first
- LOW: localStorage not available - SSR guard already in place
