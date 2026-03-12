'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { EnhancedCartLine } from '../types';

interface CartItemProps {
  line: EnhancedCartLine;
  index: number;
  onUpdateQty: (index: number, qty: number) => void;
  onUpdatePrice: (index: number, price: number) => void;
  onResetPrice: (index: number) => void;
  onRemove: (index: number) => void;
  registerQtyRef: (productId: string, ref: HTMLInputElement | null) => void;
}

export function CartItem({
  line,
  index,
  onUpdateQty,
  onUpdatePrice,
  onResetPrice,
  onRemove,
  registerQtyRef,
}: CartItemProps) {
  const [isEditingPrice, setIsEditingPrice] = useState(line.isCustomPrice);
  const priceInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditingPrice) {
      priceInputRef.current?.focus();
      priceInputRef.current?.select();
    }
  }, [isEditingPrice]);

  const handleQtyChange = (value: number) => {
    if (Number.isNaN(value)) return;
    if (value <= 0) {
      onRemove(index);
      return;
    }
    onUpdateQty(index, value);
  };

  const tierLabel = line.isCustomPrice
    ? 'Tùy chỉnh'
    : line.priceTier?.toUpperCase() ?? 'G1';

  return (
    <tr className="border-b border-slate-100 text-lg">
      {/* Product info + remove */}
      <td className="px-2 py-1 align-top">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="max-w-[180px] truncate font-medium text-slate-900">
              {line.productName}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
              <span>{line.unit}</span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {tierLabel}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="ml-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={() => onRemove(index)}
            title="Xóa dòng"
          >
            ✕
          </button>
        </div>
      </td>

      {/* Quantity */}
      <td className="px-2 py-1 align-middle">
        <div className="inline-flex items-center rounded-md border border-slate-200 bg-white">
          <button
            type="button"
            className="px-2 py-1 text-lg text-slate-700 hover:bg-slate-100"
            onClick={() => handleQtyChange(line.qty - 1)}
          >
            −
          </button>
          <input
            type="number"
            className="w-14 border-x border-slate-200 px-1 py-1 text-center text-lg outline-none"
            value={line.qty}
            onChange={(e) => handleQtyChange(parseInt(e.target.value, 10))}
            onFocus={(e) => e.target.select()}
            min={1}
            ref={(ref) => registerQtyRef(line.productId, ref)}
          />
          <button
            type="button"
            className="px-2 py-1 text-lg text-slate-700 hover:bg-slate-100"
            onClick={() => handleQtyChange(line.qty + 1)}
          >
            +
          </button>
        </div>
      </td>

      {/* Unit Price (view / edit) */}
      <td className="px-2 py-1 align-middle">
        {isEditingPrice ? (
          <div className="flex items-center gap-1">
            <input
              ref={priceInputRef}
              type="number"
              className="w-24 rounded-md border border-slate-200 px-2 py-1 text-lg outline-none focus:border-blue-600"
              value={line.unitPrice}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!Number.isNaN(val)) onUpdatePrice(index, val);
              }}
              onBlur={() => setIsEditingPrice(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              min={0}
              step={1000}
            />
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-800"
              onClick={() => {
                onResetPrice(index);
                setIsEditingPrice(false);
              }}
            >
              Reset
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="text-lg text-slate-700">
              {formatCurrency(line.unitPrice)}
            </span>
            <button
              type="button"
              className="self-start text-[11px] text-slate-400 hover:text-slate-700"
              onClick={() => setIsEditingPrice(true)}
            >
              Sửa giá
            </button>
          </div>
        )}
      </td>

      {/* Line Total */}
      <td className="px-2 py-1 align-middle text-right">
        <div className="text-lg font-semibold text-slate-900">
          {formatCurrency(line.lineTotal)}
        </div>
      </td>
    </tr>
  );
}
