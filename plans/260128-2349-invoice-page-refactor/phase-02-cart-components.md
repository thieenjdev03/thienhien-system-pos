# Phase 02: Price Tier & Cart Components

## Context Links

- [Parent Plan](./plan.md)
- [Phase 01: Foundation](./phase-01-foundation.md)
- Current page: `app/(dashboard)/invoices/new/page.tsx`

## Overview

- **Priority:** P1
- **Status:** Pending
- **Effort:** 2h
- **Description:** Create PriceTierSwitch, CartTable, CartItem components

## Key Insights

1. Price tier needs descriptions + confirmation modal on change
2. CartItem needs custom price indicator + reset button
3. Qty controls need hold-to-repeat and zero-removal logic
4. Line total needs transition animation

## Requirements

### Functional

**PriceTierSwitch:**
- Display tier descriptions (Lẻ/Sỉ/Đại lý)
- Confirm before applying tier change to cart
- Skip confirmation if cart empty

**CartItem:**
- Qty: direct input + buttons, hold-to-repeat
- Qty=0: auto-remove with toast
- Custom price: show original (muted), badge, reset button
- Line total: animated transition

**CartTable:**
- Responsive layout
- Empty state
- Keyboard-navigable

### Non-Functional
- Smooth animations (CSS transitions)
- Accessible (ARIA labels, keyboard support)
- Mobile-friendly

## Architecture

```
invoices/new/components/
├── PriceTierSwitch.tsx      # Tier radio with descriptions
├── TierChangeModal.tsx      # Confirmation dialog
├── CartTable.tsx            # Table wrapper
└── CartItem.tsx             # Single row with controls
```

## Implementation Steps

### Step 2.1: Create PriceTierSwitch

```typescript
// app/(dashboard)/invoices/new/components/PriceTierSwitch.tsx
'use client';

import { useState } from 'react';
import type { PriceTier } from '@/domain/models';
import { cn } from '@/lib/utils';

interface PriceTierSwitchProps {
  value: PriceTier;
  onChange: (tier: PriceTier, applyToCart: boolean) => void;
  hasCartItems: boolean;
}

const TIER_CONFIG = {
  price1: { label: 'Giá 1', desc: 'Bán lẻ', color: 'blue' },
  price2: { label: 'Giá 2', desc: 'Sỉ', color: 'amber' },
  price3: { label: 'Giá 3', desc: 'Đại lý', color: 'purple' },
} as const;

export function PriceTierSwitch({ value, onChange, hasCartItems }: PriceTierSwitchProps) {
  const [showModal, setShowModal] = useState(false);
  const [pendingTier, setPendingTier] = useState<PriceTier | null>(null);

  const handleTierClick = (tier: PriceTier) => {
    if (tier === value) return;

    if (hasCartItems) {
      setPendingTier(tier);
      setShowModal(true);
    } else {
      onChange(tier, false);
    }
  };

  const handleConfirm = (applyToCart: boolean) => {
    if (pendingTier) {
      onChange(pendingTier, applyToCart);
    }
    setShowModal(false);
    setPendingTier(null);
  };

  return (
    <>
      <div className="price-tier-switch">
        <div className="tier-switch-header">
          <span className="tier-switch-label">Loại giá:</span>
        </div>
        <div className="tier-switch-options">
          {(Object.keys(TIER_CONFIG) as PriceTier[]).map((tier) => {
            const config = TIER_CONFIG[tier];
            const isActive = value === tier;

            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleTierClick(tier)}
                className={cn(
                  'tier-switch-btn',
                  `tier-${config.color}`,
                  isActive && 'active'
                )}
              >
                <span className="tier-btn-label">{config.label}</span>
                <span className="tier-btn-desc">{config.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Thay đổi loại giá</h4>
            <p>Áp dụng cho toàn bộ sản phẩm trong giỏ hàng?</p>
            <p className="modal-note">
              (Sản phẩm đã chỉnh giá tay sẽ giữ nguyên)
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleConfirm(false)}
              >
                Chỉ SP mới
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleConfirm(true)}
              >
                Áp dụng tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Step 2.2: Create CartItem Component

```typescript
// app/(dashboard)/invoices/new/components/CartItem.tsx
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { EnhancedCartLine } from '../types';
import type { PriceTier } from '@/domain/models';

interface CartItemProps {
  line: EnhancedCartLine;
  index: number;
  onUpdateQty: (index: number, qty: number) => void;
  onUpdatePrice: (index: number, price: number) => void;
  onResetPrice: (index: number) => void;
  onRemove: (index: number) => void;
  registerQtyRef: (productId: string, ref: HTMLInputElement | null) => void;
}

const TIER_BADGE = {
  price1: { label: 'G1', class: 'badge-price1' },
  price2: { label: 'G2', class: 'badge-price2' },
  price3: { label: 'G3', class: 'badge-price3' },
} as const;

export function CartItem({
  line,
  index,
  onUpdateQty,
  onUpdatePrice,
  onResetPrice,
  onRemove,
  registerQtyRef,
}: CartItemProps) {
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup hold timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  // Handle hold-to-repeat
  const startHold = useCallback((action: () => void) => {
    action(); // Immediate action

    // Start repeating after 300ms
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(action, 100);
    }, 300);
  }, []);

  const stopHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const handleIncrement = useCallback(() => {
    onUpdateQty(index, line.qty + 1);
  }, [index, line.qty, onUpdateQty]);

  const handleDecrement = useCallback(() => {
    onUpdateQty(index, line.qty - 1);
  }, [index, line.qty, onUpdateQty]);

  // Get tier badge
  const getTierBadge = () => {
    if (line.isCustomPrice) {
      return { label: 'Tùy chỉnh', class: 'badge-custom' };
    }
    return TIER_BADGE[line.priceTier as keyof typeof TIER_BADGE] || TIER_BADGE.price1;
  };

  const badge = getTierBadge();

  return (
    <tr className="cart-item-row">
      {/* Product Info */}
      <td>
        <div className="cart-product-info">
          <span className="cart-product-name">{line.productName}</span>
          <span className="cart-product-unit">{line.unit}</span>
        </div>
      </td>

      {/* Quantity Control */}
      <td>
        <div className="qty-control">
          <button
            type="button"
            className="qty-btn qty-btn-minus"
            onMouseDown={() => startHold(handleDecrement)}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold(handleDecrement)}
            onTouchEnd={stopHold}
          >
            −
          </button>
          <input
            type="number"
            className="qty-input"
            value={line.qty}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) onUpdateQty(index, val);
            }}
            min="0"
            ref={(ref) => registerQtyRef(line.productId, ref)}
          />
          <button
            type="button"
            className="qty-btn qty-btn-plus"
            onMouseDown={() => startHold(handleIncrement)}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold(handleIncrement)}
            onTouchEnd={stopHold}
          >
            +
          </button>
        </div>
      </td>

      {/* Unit Price */}
      <td>
        <div className="price-cell">
          {line.isCustomPrice && (
            <span className="original-price">
              {formatCurrency(line.originalTierPrice)}
            </span>
          )}
          <div className="price-input-wrapper">
            <input
              type="number"
              className={cn('price-input', line.isCustomPrice && 'is-custom')}
              value={line.unitPrice}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) onUpdatePrice(index, val);
              }}
              min="0"
              step="1000"
            />
            <span className={cn('price-badge', badge.class)}>
              {badge.label}
            </span>
          </div>
          {line.isCustomPrice && (
            <button
              type="button"
              className="reset-price-btn"
              onClick={() => onResetPrice(index)}
              title="Reset về giá tier"
            >
              ↺
            </button>
          )}
        </div>
      </td>

      {/* Line Total */}
      <td className="line-total">
        <span className="line-total-value">
          {formatCurrency(line.lineTotal)}
        </span>
      </td>

      {/* Remove */}
      <td>
        <button
          type="button"
          className="remove-btn"
          onClick={() => onRemove(index)}
          title="Xóa"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
```

### Step 2.3: Create CartTable Component

```typescript
// app/(dashboard)/invoices/new/components/CartTable.tsx
'use client';

import { CartItem } from './CartItem';
import type { EnhancedCartLine } from '../types';

interface CartTableProps {
  lines: EnhancedCartLine[];
  onUpdateQty: (index: number, qty: number) => void;
  onUpdatePrice: (index: number, price: number) => void;
  onResetPrice: (index: number) => void;
  onRemove: (index: number) => void;
  registerQtyRef: (productId: string, ref: HTMLInputElement | null) => void;
}

export function CartTable({
  lines,
  onUpdateQty,
  onUpdatePrice,
  onResetPrice,
  onRemove,
  registerQtyRef,
}: CartTableProps) {
  if (lines.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-content">
          <span className="cart-empty-icon">🛒</span>
          <span>Chưa có sản phẩm trong giỏ hàng</span>
          <span className="cart-empty-hint">Tìm và thêm sản phẩm ở trên</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-table-wrapper">
      <table className="cart-table-enhanced">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th style={{ width: '140px' }}>Số lượng</th>
            <th style={{ width: '180px' }}>Đơn giá</th>
            <th style={{ width: '120px', textAlign: 'right' }}>Thành tiền</th>
            <th style={{ width: '50px' }}></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <CartItem
              key={line.productId}
              line={line}
              index={index}
              onUpdateQty={onUpdateQty}
              onUpdatePrice={onUpdatePrice}
              onResetPrice={onResetPrice}
              onRemove={onRemove}
              registerQtyRef={registerQtyRef}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Step 2.4: Add CSS Styles

```css
/* Add to app/globals.css */

/* Price Tier Switch */
.price-tier-switch {
  @apply mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3;
}

.tier-switch-header {
  @apply mb-2;
}

.tier-switch-label {
  @apply text-sm font-medium text-slate-600;
}

.tier-switch-options {
  @apply flex gap-2;
}

.tier-switch-btn {
  @apply flex flex-1 flex-col items-center rounded-md border-2 border-transparent bg-white px-3 py-2 transition-all;
}

.tier-switch-btn:hover {
  @apply border-slate-300;
}

.tier-switch-btn.active.tier-blue {
  @apply border-blue-500 bg-blue-50;
}

.tier-switch-btn.active.tier-amber {
  @apply border-amber-500 bg-amber-50;
}

.tier-switch-btn.active.tier-purple {
  @apply border-purple-500 bg-purple-50;
}

.tier-btn-label {
  @apply text-sm font-semibold;
}

.tier-btn-desc {
  @apply text-xs text-slate-500;
}

/* Cart Item Enhancements */
.cart-item-row {
  @apply transition-colors hover:bg-slate-50;
}

.original-price {
  @apply text-xs text-slate-400 line-through;
}

.price-input-wrapper {
  @apply flex items-center gap-1;
}

.price-input.is-custom {
  @apply border-amber-300 bg-amber-50;
}

.reset-price-btn {
  @apply ml-1 h-6 w-6 rounded-full bg-slate-100 text-xs text-slate-500 transition-colors hover:bg-slate-200;
}

.badge-custom {
  @apply bg-amber-100 text-amber-700;
}

/* Line total animation */
.line-total-value {
  @apply inline-block transition-all duration-200;
}

.cart-item-row:has(.qty-input:focus) .line-total-value,
.cart-item-row:has(.price-input:focus) .line-total-value {
  @apply scale-105 text-blue-600;
}

/* Modal */
.modal-overlay {
  @apply fixed inset-0 z-[300] flex items-center justify-center bg-black/50;
}

.modal-content {
  @apply w-full max-w-sm rounded-lg bg-white p-6 shadow-xl;
}

.modal-content h4 {
  @apply mb-2 text-lg font-semibold;
}

.modal-content p {
  @apply text-sm text-slate-600;
}

.modal-note {
  @apply mt-1 text-xs text-slate-400;
}

.modal-actions {
  @apply mt-4 flex justify-end gap-2;
}

/* Cart empty hint */
.cart-empty-hint {
  @apply mt-1 text-xs text-slate-400;
}
```

## Todo List

- [ ] Create `components/PriceTierSwitch.tsx`
- [ ] Create `components/CartItem.tsx`
- [ ] Create `components/CartTable.tsx`
- [ ] Add CSS styles to `globals.css`
- [ ] Test hold-to-repeat on qty buttons
- [ ] Test tier change confirmation modal
- [ ] Test custom price indicator and reset

## Success Criteria

- [ ] Tier switch shows descriptions (Lẻ/Sỉ/Đại lý)
- [ ] Tier change prompts confirmation when cart has items
- [ ] Custom price items show badge + reset button
- [ ] Hold +/- buttons for rapid qty change
- [ ] Line total animates on change
- [ ] All components compile without errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hold-to-repeat touch issues | Medium | Low | Test on mobile devices |
| Modal z-index conflicts | Low | Medium | Use high z-index (300) |
| CSS specificity issues | Low | Low | Use specific class names |

## Next Steps

After this phase:
1. Create PaymentSummary component → Phase 03
2. Add toast system → Phase 03
