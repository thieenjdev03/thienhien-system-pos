'use client';

import { useMemo, useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { DiscountMode } from '../types';

type PaymentMethod = 'cash' | 'transfer' | 'vietqr' | 'debt';

interface PaymentSummaryProps {
  subtotal: number;
  discount: number;
  discountMode: DiscountMode;
  discountAmount: number;
  total: number;
  paid: number;
  remaining: number; // total - paid (positive = owes, negative = change)
  hasDebt: boolean;
  hasCustomer: boolean;
  canSave: boolean;
  saving: boolean;

  onDiscountChange: (value: number) => void;
  onDiscountModeChange: (mode: DiscountMode) => void;
  onPaidChange: (value: number) => void;
  onSave: () => void;

  // Optional invoice identifier for QR content
  invoiceId?: string;
  bankCode?: string;
  bankAccount?: string;
  bankAccountName?: string;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
}

const VIETQR_BANK_CODE =
  process.env.NEXT_PUBLIC_VIETQR_BANK_CODE || 'VCB';
const VIETQR_BANK_ACCOUNT =
  process.env.NEXT_PUBLIC_VIETQR_BANK_ACCOUNT || '0123456789';
const VIETQR_ACCOUNT_NAME =
  process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || 'TEN CUA HANG';

function buildVietQrUrl(opts: {
  bankCode: string;
  bankAccount: string;
  bankAccountName: string;
  amount: number;
  addInfo: string;
}) {
  const { bankCode, bankAccount, bankAccountName, amount, addInfo } = opts;
  const template = 'qr_only';
  const base = `https://img.vietqr.io/image/${encodeURIComponent(
    bankCode,
  )}-${encodeURIComponent(bankAccount)}-${template}.png`;
  const params = new URLSearchParams({
    amount: Math.max(0, Math.round(amount)).toString(),
    addInfo,
    accountName: bankAccountName,
  });
  return `${base}?${params.toString()}`;
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
  invoiceId,
  bankCode,
  bankAccount,
  bankAccountName,
  paymentMethod,
  onPaymentMethodChange,
}: PaymentSummaryProps) {
  const qrUrl = useMemo(() => {
    if (paymentMethod !== 'vietqr') return null;
    const addInfo = invoiceId || 'HOA DON TAM TINH' + ' - ' + new Date().toLocaleDateString('vi-VN');
    return buildVietQrUrl({
      bankCode: bankCode ?? VIETQR_BANK_CODE,
      bankAccount: bankAccount ?? VIETQR_BANK_ACCOUNT,
      bankAccountName: bankAccountName ?? VIETQR_ACCOUNT_NAME,
      amount: total,
      addInfo,
    });
  }, [paymentMethod, total, invoiceId, bankCode, bankAccount, bankAccountName]);

  const primaryLabel = useMemo(() => {
    if (paymentMethod === 'cash') {
      return 'Xác nhận thu tiền mặt & lưu hoá đơn';
    }
    if (paymentMethod === 'vietqr' || paymentMethod === 'transfer') {
      return 'Lưu hoá đơn (thanh toán chuyển khoản)';
    }
    return 'Lưu hoá đơn (ghi nợ)';
  }, [paymentMethod]);

  return (
    <div className="payment-card rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <h3>Thanh Toán</h3>
      {/* Summary */}
      <div className="mb-4 space-y-1">
        <div className="flex justify-between text-base text-slate-500">
          <span>Tạm tính</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {/* Discount controls */}
        <div className="mb-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-base text-slate-600">Giảm giá</span>
            <div className="discount-input-group flex items-center gap-1">
              <input
                type="number"
                className="payment-input discount-input w-24 text-right"
                value={discount || ''}
                onChange={(e) =>
                  onDiscountChange(parseFloat(e.target.value) || 0)
                }
                min={0}
                max={discountMode === 'percent' ? 100 : subtotal}
                step={discountMode === 'percent' ? 1 : 1000}
                placeholder="0"
              />
              <div className="discount-mode-toggle inline-flex rounded-md border border-slate-200 bg-slate-50 text-base">
                <button
                  type="button"
                  className={cn(
                    'discount-mode-btn px-4 py-2 text-lg', // Increased px/py and text-lg instead of text-sm
                    discountMode === 'amount' && 'active bg-slate-800 text-white',
                  )}
                  onClick={() => onDiscountModeChange('amount')}
                >
                  ₫
                </button>
                <button
                  type="button"
                  className={cn(
                    'discount-mode-btn px-4 py-2 text-lg', // Increased px/py and text-lg instead of text-sm
                    discountMode === 'percent' && 'active bg-slate-800 text-white',
                  )}
                  onClick={() => onDiscountModeChange('percent')}
                >
                  %
                </button>
              </div>
            </div>
          </div>
          {discountMode === 'percent' && discount > 0 && (
            <div className="flex justify-between text-sm text-slate-400">
              <span></span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-slate-200 pt-3">
          <span className="text-base font-semibold uppercase tracking-wide text-slate-600">
            Tổng cộng
          </span>
          <span className="text-3xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(total)}
          </span>
        </div>
      </div>



      {/* Payment method */}
      <div className="mb-4">
        <p className="mb-2 text-base font-semibold uppercase tracking-wide text-slate-600">
          Phương thức thanh toán
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'cash', label: 'Tiền mặt' },
            { key: 'vietqr', label: 'Chuyển khoản' },
            { key: 'debt', label: 'Ghi nợ' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onPaymentMethodChange(m.key as PaymentMethod)}
              className={cn(
                'min-w-[90px] rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors',
                paymentMethod === m.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Method-specific content */}
      <div className="mb-4 space-y-3 text-base">
        {paymentMethod === 'cash' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Khách đưa</span>
              <input
                type="number"
                className="payment-input w-32 text-right"
                value={paid || ''}
                onChange={(e) =>
                  onPaidChange(parseFloat(e.target.value) || 0)
                }
                min={0}
                step={1000}
                placeholder="0"
              />
            </div>
          </>
        )}

        {(paymentMethod === 'transfer' || paymentMethod === 'vietqr') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-base">
              <span className="text-slate-600">Số tiền cần chuyển</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Nội dung</span>
              <span className="font-mono">
                {invoiceId || 'INVOICE'}
              </span>
            </div>
            {qrUrl && paymentMethod === 'vietqr' && (
              <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4">
                <img
                  src={qrUrl}
                  alt="VietQR"
                  className="h-[280px] w-[280px] rounded-lg bg-white shadow-sm"
                />
                <p className="mt-3 text-[11px] text-slate-500 text-center max-w-xs">
                  Khách mở app ngân hàng và quét mã này để thanh toán.
                </p>
              </div>
            )}
          </div>
        )}

        {paymentMethod === 'debt' && (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Hoá đơn sẽ được ghi vào công nợ khách hàng với số tiền:&nbsp;
            <span className="font-semibold">
              {formatCurrency(total)}
            </span>
          </div>
        )}

      </div>

      {/* Save / Print Buttons */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={cn(
            'flex-1 rounded-lg px-4 py-3 text-base font-semibold uppercase tracking-wide text-white shadow-sm',
            paymentMethod === 'debt'
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-blue-600 hover:bg-blue-700',
          )}
          onClick={onSave}
          disabled={!canSave || saving}
        >
          {saving ? 'Đang lưu...' : primaryLabel}
        </button>
        <button
          type="button"
          className="rounded-lg px-4 py-3 text-base font-semibold uppercase tracking-wide text-slate-700 border border-slate-300 bg-white shadow-sm hover:bg-slate-50"
          onClick={() => window.print()}
        >
          In hoá đơn
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className="mt-2 text-xs text-slate-400 text-right">
        <kbd>Ctrl</kbd>+<kbd>Enter</kbd> để lưu
      </div>
    </div>
  );
}
