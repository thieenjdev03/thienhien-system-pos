## Context Links

- Global styles: `app/globals.css`
- Common UI patterns: buttons, inputs, tables, modals in `(dashboard)` pages
- Existing i18n config: `shared/i18n/*`

## Overview

- **Priority**: P2
- **Status**: planned
- **Goal**: introduce a lightweight shadcn-style design system and progressively decompose `globals.css` into modular, reusable style layers without blocking feature work.

## Key Insights

- `globals.css` is large and mixes resets, tokens, layout, and component styles.
- UI patterns (buttons, inputs, tables, modals) are duplicated across features.
- A small, well-chosen set of primitives will improve consistency and speed future refactors.

## Requirements

- Define a minimal design system (tokens + primitives) aligned with Tailwind and shadcn principles.
- Extract cross-cutting component patterns into reusable components (e.g. `Button`, `Input`, `Table`, `Dialog`).
- Gradually move component-specific CSS out of `globals.css` into component-level or module styles.
- Avoid big-bang rewrites; prioritize high-traffic features first.

## Architecture

- **Design tokens**:
  - Colors, spacing, typography, radii defined as Tailwind config and/or CSS variables.
- **Primitives**:
  - Core components (button, input, select, dialog, sheet, table, badge, alert) designed with accessibility in mind.
- **Layered styles**:
  - `globals.css` limited to reset, root variables, and a few app-wide layout helpers.
  - Component-level styles live near components or in dedicated partials.

## Related Code Files

- `app/globals.css`
- Shared layout/navigation components in `(dashboard)`
- Existing shared UI components (if any) under `components/` or similar

## Implementation Steps

1. Audit `globals.css`:
   - Categorize rules: reset, tokens, layout, component-specific.
   - Identify top 3–5 duplicated component patterns.
2. Define design tokens:
   - Colors, spacing, typography, radii using CSS variables and Tailwind config.
3. Implement core primitives:
   - `Button`, `Input`, `Table` row/cell styles, and one dialog/sheet component.
4. Refactor high-impact screens (e.g. customers/products lists) to use primitives.
5. Trim `globals.css`:
   - Move component-specific rules into component modules.
   - Keep only reset, tokens, and app-shell layout styles.

## Todo List

- [ ] Categorize and document current `globals.css` contents
- [ ] Define core design tokens in Tailwind/CSS variables
- [ ] Implement minimal shadcn-style primitive set
- [ ] Migrate at least one major list screen to primitives
- [ ] Remove or relocate obsolete component styles from `globals.css`

## Success Criteria

- Shared primitive components cover most buttons/inputs/tables in at least one or two core features.
- `globals.css` becomes noticeably smaller and more focused on base styles and tokens.
- New screens can be built using primitives without adding bespoke CSS to `globals.css`.

## Risk Assessment

- **Risk**: Visual regressions during migration.
  - **Mitigation**: Migrate feature-by-feature; use visual QA on key flows.
- **Risk**: Over-building component library.
  - **Mitigation**: Start with minimal primitives; add new components only when clearly reused.

## Security Considerations

- Ensure focus states and accessible color contrast in primitives for better usability and compliance.
- Avoid UI patterns that obscure important warnings or destructive actions.

## Next Steps

- Use primitives and modular styles as the default building blocks in Phase 4 feature refactors.
- Align typography and spacing with i18n needs to avoid truncation in Phase 5.

