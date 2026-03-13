# Phase 03: Payment Summary & UX

## Context Links

- [Parent Plan](./plan.md)
- [Phase 02: Cart Components](./phase-02-cart-components.md)

## Overview

- **Priority:** P1
- **Status:** Pending
- **Effort:** 2h
- **Description:** Create PaymentSummary, Toast system, discount toggle, and clear change/debt display

## Key Insights

1. Current payment shows negative numbers for "change" - confusing
2. No discount mode toggle (amount vs %)
3. Toast needed for undo remove + save success
4. CTA button text should reflect debt state

## Requirements

### Functional

**PaymentSummary:**
- Subtotal (readonly)
- Discount: toggle between amount/% mode, capped at subtotal
- Total (bold)
- Cash received input
- Debt warning: only when customer selected + cash < total
- CTA: "LƯU HOÁ ĐƠN" or "LƯU HOÁ ĐƠN (CÔNG NỢ)"

**Toast System:**
- Bottom-right positioned
- Auto-dismiss (3s)
- Support action button (Undo)
- Stack multiple toasts

### Non-Functional
- No negative numbers shown to user
- Vietnamese copy
- Smooth animations

## Implementation Steps

### Step 3.1: Create Toast Component

```typescript
// app/(dashboard)/invoices/new/components/Toast.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ToastMessage } from '../types';

let toastIdCounter = 0;
let addToastFn: ((toast: Omit<ToastMessage, 'id'>) => void) | null = null;

// Global toast function
export function showToast(message: string, action?: { label: string; onClick: () => void }, duration = 3000) {
  addToastFn?.({ message, action, duration });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts(prev => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className="toast-item">
          <span className="toast-message">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.action!.onClick();
                dismissToast(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => dismissToast(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Step 3.2: Create PaymentSummary Component

```typescript
// app/(dashboard)/invoices/new/components/PaymentSummary.tsx
'use client';

import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { DiscountMode } from '../types';

interface PaymentSummaryProps {
  subtotal: number;
  discount: number;
  discountMode: DiscountMode;
  discountAmount: number;
  total: number;
  paid: number;
  remaining: number;   // total - paid (positive = owes, negative = change)
  hasDebt: boolean;
  hasCustomer: boolean;
  canSave: boolean;
  saving: boolean;

  onDiscountChange: (value: number) => void;
  onDiscountModeChange: (mode: DiscountMode) => void;
  onPaidChange: (value: number) => void;
  onSave: () => void;
}

export function PaymentSummary({
  subtotal,
  discount,
  discountMode,
  discountAmount,
  total,
  paid,
  remaining,
  hasDebt,
  hasCustomer,
  canSave,
  saving,
  onDiscountChange,
  onDiscountModeChange,
  onPaidChange,
  onSave,
}: PaymentSummaryProps) {
  // Determine cash status
  const isOwing = remaining > 0;
  const changeAmount = Math.abs(remaining);

  return (
    <div className="payment-card">
      <h3>Thanh toán</h3>

      <div className="payment-rows">
        {/* Subtotal */}
        <div className="payment-row">
          <span className="payment-label">Tạm tính:</span>
          <span className="payment-value">{formatCurrency(subtotal)}</span>
        </div>

        {/* Discount */}
        <div className="payment-row">
          <span className="payment-label">Giảm giá:</span>
          <div className="discount-input-group">
            <input
              type="number"
              className="payment-input discount-input"
              value={discount || ''}
              onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
              min="0"
              max={discountMode === 'percent' ? 100 : subtotal}
              step={discountMode === 'percent' ? 1 : 1000}
              placeholder="0"
            />
            <div className="discount-mode-toggle">
              <button
                type="button"
                className={cn('discount-mode-btn', discountMode === 'amount' && 'active')}
                onClick={() => onDiscountModeChange('amount')}
              >
                ₫
              </button>
              <button
                type="button"
                className={cn('discount-mode-btn', discountMode === 'percent' && 'active')}
                onClick={() => onDiscountModeChange('percent')}
              >
                %
              </button>
            </div>
          </div>
        </div>

        {/* Show discount amount if in percent mode */}
        {discountMode === 'percent' && discount > 0 && (
          <div className="payment-row payment-discount-detail">
            <span className="payment-label"></span>
            <span className="payment-value text-slate-400">
              −{formatCurrency(discountAmount)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="payment-row payment-total">
          <span className="payment-label">TỔNG CỘNG:</span>
          <span className="payment-value total-value">{formatCurrency(total)}</span>
        </div>

        {/* Cash Received */}
        <div className="payment-row">
          <span className="payment-label">Khách đưa:</span>
          <input
            type="number"
            className="payment-input"
            value={paid || ''}
            onChange={(e) => onPaidChange(parseFloat(e.target.value) || 0)}
            min="0"
            step="1000"
            placeholder="0"
          />
        </div>

        {/* Change / Remaining */}
        {paid > 0 && (
          <div className={cn('payment-row', isOwing ? 'payment-owing' : 'payment-change positive')}>
            <span className="payment-value">
              {formatCurrency(changeAmount)}
            </span>
          </div>
        )}

        {/* Debt Warning */}
        {hasDebt && hasCustomer && (
          <div className="payment-row payment-debt">
            <span className="payment-label">
              <span className="warning-icon">⚠️</span>
              Phát sinh công nợ:
            </span>
            <span className="payment-value debt-value">
              {formatCurrency(remaining)}
            </span>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        type="button"
        className={cn('save-invoice-btn', hasDebt && 'has-debt')}
        onClick={onSave}
        disabled={!canSave}
      >
        {saving
          ? 'Đang lưu...'
          : hasDebt
            ? '⚠️ LƯU HOÁ ĐƠN (CÔNG NỢ)'
            : '💾 LƯU HOÁ ĐƠN'
        }
      </button>

      {/* Keyboard Hint */}
      <div className="payment-keyboard-hint">
        <kbd>Ctrl</kbd>+<kbd>Enter</kbd> để lưu
      </div>
    </div>
  );
}
```

### Step 3.3: Add CSS Styles

```css
/* Toast System */
.toast-container {
  @apply fixed bottom-4 right-4 z-[500] flex flex-col gap-2;
}

.toast-item {
  @apply flex items-center gap-3 rounded-lg bg-slate-800 px-4 py-3 text-sm text-white shadow-lg;
  animation: slideInRight 0.2s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-message {
  @apply flex-1;
}

.toast-action {
  @apply rounded px-2 py-1 text-xs font-semibold text-blue-300 hover:text-blue-200;
}

.toast-dismiss {
  @apply ml-1 text-slate-400 hover:text-white;
}

/* Discount Toggle */
.discount-input-group {
  @apply flex items-center gap-1;
}

.discount-input {
  @apply w-24;
}

.discount-mode-toggle {
  @apply flex overflow-hidden rounded border border-slate-200;
}

.discount-mode-btn {
  @apply px-2 py-1 text-xs font-medium text-slate-500 transition-colors;
}

.discount-mode-btn.active {
  @apply bg-blue-600 text-white;
}

/* Payment Owing */
.payment-owing {
  @apply text-red-600;
}

.payment-owing .payment-value {
  @apply font-semibold text-red-600;
}

/* Keyboard Hint */
.payment-keyboard-hint {
  @apply mt-2 text-center text-xs text-slate-400;
}

.payment-keyboard-hint kbd {
  @apply rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs font-mono;
}
```

## Todo List

- [ ] Create `components/Toast.tsx` with global `showToast` function
- [ ] Create `components/PaymentSummary.tsx`
- [ ] Add toast CSS styles
- [ ] Add payment enhancement CSS
- [ ] Wire toast into cart remove (undo support)
- [ ] Verify discount amount vs percent toggle
- [ ] Verify no negative numbers displayed

## Success Criteria

- [ ] Toast shows on item removal with "Hoàn tác" button
- [ ] Toast shows on save success with invoice number
- [ ] Discount toggles between ₫ and % modes
- [ ] Discount capped at subtotal
- [ ] "Tiền thừa" shows when cash >= total
- [ ] No negative numbers displayed anywhere
- [ ] Debt warning only when customer selected + cash < total
- [ ] CTA text changes based on debt state
- [ ] Ctrl+Enter keyboard shortcut works

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Toast z-index overlap | Low | Low | Use z-500 |
| Discount mode switch confusion | Low | Medium | Show computed amount |
| Memory leak from toast timers | Low | Low | Cleanup on unmount |

## Next Steps

After this phase:
1. Integrate all components into page → Phase 04
2. Polish and test → Phase 04
