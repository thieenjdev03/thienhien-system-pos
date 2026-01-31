# Phase 01: BIN Validation & Storage Utilities

## Context
- [Plan Overview](plan.md)
- Related: `utils/auth.ts`

## Overview
Add BIN validation and localStorage helper functions to existing auth utilities.

## Key Insights
- Follow existing pattern in `utils/auth.ts` for PIN validation
- Use dedicated localStorage key to avoid conflicts
- Keep utilities pure and testable

## Requirements
1. Validate BIN format (alphanumeric, 6-12 chars)
2. Save BIN to localStorage
3. Retrieve BIN from localStorage
4. Clear BIN from localStorage

## Architecture
```
utils/auth.ts
├── hashPin()        # existing
├── verifyPin()      # existing
├── isValidPin()     # existing
├── generateUserId() # existing
├── isValidBin()     # NEW: validate format
├── saveBin()        # NEW: save to localStorage
├── getBin()         # NEW: retrieve from localStorage
└── clearBin()       # NEW: remove from localStorage
```

## Related Code Files
- `utils/auth.ts` - add new exports

## Implementation Steps

### Step 1: Add BIN Constants
```typescript
const BIN_STORAGE_KEY = 'pos_device_bin';
```

### Step 2: Add isValidBin Function
```typescript
export function isValidBin(bin: string): boolean {
  return /^[A-Za-z0-9]{6,12}$/.test(bin);
}
```

### Step 3: Add saveBin Function
```typescript
export function saveBin(bin: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(BIN_STORAGE_KEY, bin.toUpperCase());
  }
}
```

### Step 4: Add getBin Function
```typescript
export function getBin(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BIN_STORAGE_KEY);
}
```

### Step 5: Add clearBin Function
```typescript
export function clearBin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BIN_STORAGE_KEY);
  }
}
```

## Todo
- [ ] Add BIN_STORAGE_KEY constant
- [ ] Implement isValidBin()
- [ ] Implement saveBin()
- [ ] Implement getBin()
- [ ] Implement clearBin()
- [ ] Export all functions

## Success Criteria
- All 4 new functions exported from utils/auth.ts
- isValidBin rejects invalid formats (too short, too long, special chars)
- saveBin stores uppercase BIN
- getBin returns null when no BIN stored
- SSR safe (check typeof window)

## Risk Assessment
- LOW: localStorage API is standard and well-supported
- LOW: No external dependencies added

## Security Considerations
- BIN stored in plaintext (not sensitive data like PIN)
- Use uppercase normalization for consistency

## Next Steps
- Proceed to [Phase 02](phase-02-bin-context.md)
