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
