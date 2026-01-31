# Phase 02: Add BIN State to AuthContext

## Context
- [Plan Overview](plan.md)
- Depends on: [Phase 01](phase-01-bin-utilities.md)
- Related: `contexts/AuthContext.tsx`

## Overview
Extend AuthContext to track BIN state, enabling components to check if BIN is configured and access its value.

## Key Insights
- Current AuthContext pattern: useState + useEffect for hydration
- BIN check runs in parallel with session check on mount
- Expose BIN via context for Navbar display

## Requirements
1. Add `bin` state (string | null)
2. Add `hasBin` state (boolean | null)
3. Load BIN from localStorage on mount
4. Expose `setBin` function for setup page

## Architecture
```
AuthContext
├── session        # existing
├── isLoading      # existing
├── hasUsers       # existing
├── bin            # NEW: current BIN value
├── hasBin         # NEW: null=checking, true/false
├── login()        # existing
├── logout()       # existing
├── checkHasUsers()# existing
└── setBinValue()  # NEW: save and update state
```

## Related Code Files
- `contexts/AuthContext.tsx` - modify

## Implementation Steps

### Step 1: Import BIN Utilities
```typescript
import { verifyPin, getBin, saveBin } from '@/utils/auth';
```

### Step 2: Add State Variables
```typescript
const [bin, setBin] = useState<string | null>(null);
const [hasBin, setHasBin] = useState<boolean | null>(null);
```

### Step 3: Add BIN Check in useEffect
Add to existing mount effect after session check:
```typescript
// Check for existing BIN
const storedBin = getBin();
if (storedBin) {
  setBin(storedBin);
  setHasBin(true);
} else {
  setHasBin(false);
}
```

### Step 4: Add setBinValue Function
```typescript
const setBinValue = useCallback((newBin: string) => {
  saveBin(newBin);
  setBin(newBin.toUpperCase());
  setHasBin(true);
}, []);
```

### Step 5: Update Interface
```typescript
interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  hasUsers: boolean | null;
  bin: string | null;        // NEW
  hasBin: boolean | null;    // NEW
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkHasUsers: () => Promise<boolean>;
  setBinValue: (bin: string) => void;  // NEW
}
```

### Step 6: Update useMemo
Add bin, hasBin, setBinValue to value object and dependency array.

## Todo
- [ ] Import getBin, saveBin from utils/auth
- [ ] Add bin and hasBin state variables
- [ ] Add BIN check to mount useEffect
- [ ] Implement setBinValue callback
- [ ] Update AuthContextValue interface
- [ ] Update useMemo value object
- [ ] Update useMemo dependencies

## Success Criteria
- hasBin starts as null (checking), then true/false
- bin contains stored BIN value or null
- setBinValue saves and updates state
- No breaking changes to existing login/logout flow

## Risk Assessment
- LOW: Additive changes only, no breaking changes
- LOW: Uses same localStorage pattern as session

## Security Considerations
- BIN value accessible from context (by design for UI display)
- No sensitive data exposed

## Next Steps
- Proceed to [Phase 03](phase-03-bin-setup-page.md)
