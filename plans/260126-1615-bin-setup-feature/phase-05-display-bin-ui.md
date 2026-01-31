# Phase 05: Display BIN in Navbar

## Context
- [Plan Overview](plan.md)
- Depends on: [Phase 04](phase-04-update-auth-flow.md)
- Related: `components/ui/Navbar.tsx`

## Overview
Display the device BIN in the dashboard Navbar so users always know which device they're using.

## Key Insights
- Navbar already imports useAuth for session info
- BIN display next to user display name makes sense
- Use subtle styling - device ID is informational, not primary

## Requirements
1. Show BIN in Navbar when authenticated
2. Position: left side near logo, or right side near user name
3. Subtle styling (small, muted color)
4. Format: "Device: {BIN}" or just "{BIN}"

## Architecture
```
Navbar Layout:
┌────────────────────────────────────────────────────┐
│ POS    [BIN: ABC123]          Hoa don | Admin | X  │
└────────────────────────────────────────────────────┘
         ^^^^^^^^^^^^^^^
         NEW: BIN badge

Alternative (right side):
┌────────────────────────────────────────────────────┐
│ POS              Hoa don | [ABC123] | Admin | X    │
└────────────────────────────────────────────────────┘
```

## Related Code Files
- `components/ui/Navbar.tsx` - modify

## Implementation Steps

### Step 1: Add bin to useAuth Destructure
```typescript
const { session, logout, bin } = useAuth();
```

### Step 2: Add BIN Display Element
Option A - Left side after logo:
```tsx
<div>
  <Link href="/" className="text-xl font-bold text-blue-600">POS</Link>
  {bin && (
    <span className="ml-2 px-2 py-1 text-xs font-mono bg-slate-100 text-slate-500 rounded">
      {bin}
    </span>
  )}
</div>
```

Option B - Right side before user name (RECOMMENDED):
```tsx
<div className="flex items-center gap-4">
  <Button href="/invoices" variant="ghost">Hoa don</Button>
  {session && (
    <>
      {bin && (
        <span className="px-2 py-1 text-xs font-mono bg-slate-100 text-slate-600 rounded">
          {bin}
        </span>
      )}
      <span className="text-sm text-slate-500">
        {session.displayName}
      </span>
      <Button onClick={handleLogout} variant="ghost">
        Dang xuat
      </Button>
    </>
  )}
</div>
```

### Step 3: Styling Details
- Font: `font-mono` for device ID look
- Size: `text-xs` to keep subtle
- Background: `bg-slate-100` light gray
- Text: `text-slate-600` medium gray
- Padding: `px-2 py-1` compact
- Border radius: `rounded`

## Todo
- [ ] Add bin to useAuth destructure
- [ ] Add BIN badge element in right section
- [ ] Apply font-mono and muted styling
- [ ] Conditional render only when bin exists
- [ ] Test display with various BIN lengths (6-12 chars)
- [ ] Verify responsive behavior

## Success Criteria
- BIN visible in Navbar when set
- Hidden when BIN not set (shouldn't happen in authenticated state)
- Styling is subtle, doesn't compete with main nav
- Readable on all screen sizes

## Risk Assessment
- LOW: Simple UI addition, no logic changes
- LOW: Conditional render handles missing BIN

## Security Considerations
- BIN is device identifier, safe to display
- No sensitive data exposed

## Next Steps
- Feature complete after this phase
- Consider: Add BIN to footer for redundancy
- Consider: Settings page to view/clear BIN

## Unresolved Questions
None - this phase is straightforward UI work.
