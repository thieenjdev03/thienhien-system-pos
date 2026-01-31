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
