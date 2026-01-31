# Phase 03: Create BIN Entry Page

## Context
- [Plan Overview](plan.md)
- Depends on: [Phase 02](phase-02-bin-context.md)
- Related: `app/(auth)/setup/page.tsx` (use as template)

## Overview
Create `/bin-setup` page for first-time BIN entry. Uses same UI patterns as setup/login pages (centered card, input field, submit button).

## Key Insights
- Copy styling from `app/(auth)/setup/page.tsx`
- Simpler than PIN: single input field, not numpad
- Alphanumeric input vs numeric-only PIN
- Redirect to `/setup` or `/login` after save

## Requirements
1. Full-width input for BIN entry
2. Real-time format validation feedback
3. Submit button saves BIN and redirects
4. Vietnamese UI text

## Architecture
```
app/(auth)/bin-setup/
└── page.tsx
    ├── State: bin, error, submitting
    ├── useEffect: check hasBin, redirect if exists
    ├── handleSubmit: validate, save, redirect
    └── UI: card with input + button
```

## Related Code Files
- `app/(auth)/setup/page.tsx` - template for styling
- `app/(auth)/layout.tsx` - shared auth layout

## Implementation Steps

### Step 1: Create File Structure
Create `app/(auth)/bin-setup/page.tsx`

### Step 2: Add Imports
```typescript
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isValidBin } from '@/utils/auth';
```

### Step 3: Component Shell
```typescript
export default function BinSetupPage() {
  const router = useRouter();
  const { hasBin, setBinValue, isLoading, checkHasUsers } = useAuth();
  const [bin, setBin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // ...
}
```

### Step 4: Redirect Effect
```typescript
useEffect(() => {
  if (!isLoading && hasBin === true) {
    // BIN already set, check if users exist
    checkHasUsers().then((exists) => {
      router.push(exists ? '/login' : '/setup');
    });
  }
}, [isLoading, hasBin, router, checkHasUsers]);
```

### Step 5: Handle Submit
```typescript
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();
  const trimmed = bin.trim();
  if (!isValidBin(trimmed)) {
    setError('Mã BIN phải từ 6-12 ký tự chữ hoặc số.');
    return;
  }
  setSubmitting(true);
  setBinValue(trimmed);
  const exists = await checkHasUsers();
  router.push(exists ? '/login' : '/setup');
}, [bin, setBinValue, checkHasUsers, router]);
```

### Step 6: UI Template
```tsx
return (
  <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
    <h1 className="mb-2 text-center text-2xl font-bold text-blue-600">
      Quản lý bán hàng
    </h1>
    <h2 className="mb-2 text-center text-lg font-semibold text-slate-700">
      Thiết lập thiết bị
    </h2>
    <p className="mb-6 text-center text-sm text-slate-500">
      Nhập mã định danh (BIN) cho máy POS này
    </p>

    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={bin}
        onChange={(e) => { setBin(e.target.value.toUpperCase()); setError(''); }}
        placeholder="VD: POS001"
        maxLength={12}
        className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 text-lg font-mono uppercase ..."
        autoFocus
      />
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      <button
        type="submit"
        disabled={submitting || bin.length < 6}
        className="mt-4 w-full h-12 rounded-lg bg-blue-600 text-white font-semibold ..."
      >
        {submitting ? 'Đang lưu...' : 'Tiếp tục'}
      </button>
    </form>
  </div>
);
```

## Todo
- [ ] Create app/(auth)/bin-setup/page.tsx
- [ ] Add client directive and imports
- [ ] Set up component state (bin, error, submitting)
- [ ] Add redirect effect when BIN exists
- [ ] Implement handleSubmit with validation
- [ ] Build UI matching setup page styling
- [ ] Test input auto-uppercase
- [ ] Test validation error display
- [ ] Test redirect after save

## Success Criteria
- Page renders at /bin-setup route
- Input auto-converts to uppercase
- Submit disabled when < 6 chars
- Invalid format shows Vietnamese error
- Successful save redirects appropriately

## Risk Assessment
- LOW: Simple form, no complex state
- MEDIUM: Must integrate with auth context correctly

## Security Considerations
- No sensitive data handled
- Input sanitized by uppercase transform

## Next Steps
- Proceed to [Phase 04](phase-04-update-auth-flow.md)
