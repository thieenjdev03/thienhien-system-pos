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
            <span className="payment-label">
              {isOwing ? 'Còn thiếu:' : 'Tiền thừa:'}
            </span>
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
