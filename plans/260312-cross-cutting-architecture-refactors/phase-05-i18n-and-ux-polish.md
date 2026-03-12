## Context Links

- Shared i18n: `shared/i18n/vi.ts` and related language files
- High-traffic pages: customers, products, invoices (existing plans for invoice-new)
- Design system primitives from Phase 3

## Overview

- **Priority**: P3
- **Status**: planned
- **Goal**: make i18n usage consistent across domains and improve UX polish for lists/search (loading, errors, empty states, accessibility) without major rewrites.

## Key Insights

- i18n is partially adopted; some strings still inline or inconsistent.
- Loading, error, and empty states vary in quality and clarity across features.
- Search/list UX is tied to performance; user feedback depends on clear states as much as raw speed.

## Requirements

- Standardized i18n pattern for all user-facing strings in dashboard routes.
- Clear guidelines and patterns for:
  - Loading indicators and skeletons.
  - Error messages and retry actions.
  - Empty states and “no results” messaging.
- Apply improvements first to customers and products features and align with invoice-new plan where sensible.

## Architecture

- **i18n**:
  - Centralize keys for shared UI elements (buttons, labels, errors) in shared i18n modules.
  - Use consistent key naming and nesting per domain (e.g. `customers.list.title`, `products.form.save`).
- **UX patterns**:
  - Reusable components for loading (skeletons/spinners) and empty states.
  - Common error boundary or inline error components with retry hooks.

## Related Code Files

- `shared/i18n/vi.ts` and other locale files
- Customers/products list and form components
- Any shared components for alerts, toasts, or notifications

## Implementation Steps

1. Audit i18n usage:
   - Identify hard-coded strings in customers/products and key shared components.
   - Propose and add i18n keys for missing strings.
2. Define UX patterns:
   - Standard loading indicators (per page section).
   - Standard empty-state component with icon, message, and call-to-action.
   - Standard error messaging pattern with retry.
3. Apply to customers/products:
   - Replace inline strings with i18n calls.
   - Integrate loading, empty, and error components into list/search flows.
4. Align with invoices:
   - Ensure keys and UX patterns do not conflict with invoice-new plan; reuse where already defined.

## Todo List

- [ ] Inventory hard-coded strings in customers/products and shared UI
- [ ] Add or refine i18n keys and translations
- [ ] Implement shared loading/empty/error UX components
- [ ] Apply UX patterns and i18n clean-up to customers/products lists and forms

## Success Criteria

- Customers and products features have no user-facing hard-coded strings (within scope of supported locales).
- Lists and searches show consistent loading, empty, and error UX patterns.
- New features can follow a simple recipe for i18n and UX states.

## Risk Assessment

- **Risk**: String key churn and translation drift.
  - **Mitigation**: Use predictable key naming and keep changes scoped; coordinate with translators when needed.
- **Risk**: Over-polishing low-traffic views.
  - **Mitigation**: Prioritize high-traffic screens; leave low-impact areas for later.

## Security Considerations

- Ensure error messages do not leak internal details (stack traces, SQL, internal IDs) in UI.
- Maintain consistent language for permission-related errors.

## Next Steps

- Use established i18n and UX patterns as defaults for all future features and refactors.
- Revisit after core refactors to expand coverage to remaining domains as needed.

