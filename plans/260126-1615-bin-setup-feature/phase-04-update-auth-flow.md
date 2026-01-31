# Phase 04: Update Auth Flow Redirects

## Context
- [Plan Overview](plan.md)
- Depends on: [Phase 03](phase-03-bin-setup-page.md)
- Related: `app/(auth)/login/page.tsx`, `app/(auth)/setup/page.tsx`

## Overview
Update login and setup pages to check for BIN before proceeding. If no BIN, redirect to `/bin-setup`.

## Key Insights
- Current flow: login checks hasUsers -> redirects to setup if none
- New flow: FIRST check hasBin -> redirect to bin-setup if none
- Both pages need same BIN check logic
- Check order: isLoading -> hasBin -> existing logic

## Requirements
1. Login page: redirect to /bin-setup if no BIN
2. Setup page: redirect to /bin-setup if no BIN
3. Maintain existing hasUsers/session checks after BIN check

## Architecture
```
Login Page Flow:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Check hasBin│ -> │ No BIN?     │ -> │ /bin-setup  │
└─────────────┘    │ Redirect    │    └─────────────┘
                   └─────────────┘
                         │ Yes
                         v
                   ┌─────────────┐
                   │ Existing    │
                   │ hasUsers    │
                   │ check       │
                   └─────────────┘

Setup Page Flow:
Same BIN check before existing hasUsers redirect
```

## Related Code Files
- `app/(auth)/login/page.tsx` - modify
- `app/(auth)/setup/page.tsx` - modify

## Implementation Steps

### Step 1: Update Login Page Imports
Add `hasBin` to destructured auth values.

### Step 2: Add BIN Check Effect to Login
Add NEW useEffect BEFORE existing effects:
```typescript
// Redirect to BIN setup if no BIN configured
useEffect(() => {
  if (!isLoading && hasBin === false) {
    router.push('/bin-setup');
  }
}, [isLoading, hasBin, router]);
```

### Step 3: Update Login Loading State
Modify loading condition to include hasBin:
```typescript
if (isLoading || hasBin === null || hasUsers === null) {
  return (/* loading UI */);
}
```

### Step 4: Update Setup Page Imports
Add `hasBin` to destructured auth values.

### Step 5: Add BIN Check Effect to Setup
Add NEW useEffect BEFORE existing effects:
```typescript
// Redirect to BIN setup if no BIN configured
useEffect(() => {
  if (!isLoading && hasBin === false) {
    router.push('/bin-setup');
  }
}, [isLoading, hasBin, router]);
```

### Step 6: Update Setup Loading State
Modify loading condition:
```typescript
if (isLoading || hasBin === null || hasUsers === null) {
  return (/* loading UI */);
}
```

## Todo
- [ ] Login: import hasBin from useAuth
- [ ] Login: add BIN check useEffect
- [ ] Login: update loading condition
- [ ] Setup: import hasBin from useAuth
- [ ] Setup: add BIN check useEffect
- [ ] Setup: update loading condition
- [ ] Test: fresh visit redirects to /bin-setup
- [ ] Test: after BIN set, flows work as before

## Success Criteria
- Fresh localStorage -> /login -> /bin-setup
- Fresh localStorage -> /setup -> /bin-setup
- BIN set + no users -> /login -> /setup (existing)
- BIN set + users exist -> /login renders (existing)
- BIN set + users exist -> /setup -> /login (existing)

## Risk Assessment
- MEDIUM: Modifying core auth flow, must not break existing behavior
- LOW: Changes are additive (extra check before existing logic)

## Security Considerations
- No security impact - BIN is device identifier, not auth credential
- Auth still requires PIN after BIN check

## Next Steps
- Proceed to [Phase 05](phase-05-display-bin-ui.md)
