import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import type { Customer, InvoiceItem } from '@/domain/models';
import type { EnhancedCartLine } from '@/app/(dashboard)/invoices/new/types';
import { InvoiceQrCode } from '@/components/InvoiceQrCode';

export interface PrintableInvoiceLine {
  id: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  note?: string;
}

interface PrintableInvoiceProps {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  storeTaxCode?: string;
  createdAt?: string | number | Date;
  cashierName?: string | null;
  paymentMethodLabel?: string | null;
  invoiceNo: string;
  customer: Customer | null;
  lines: PrintableInvoiceLine[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  qrValue?: string | null;
}

export function PrintableInvoice({
  storeName,
  storeAddress,
  storePhone,
  storeTaxCode,
  createdAt,
  cashierName,
  paymentMethodLabel,
  invoiceNo,
  customer,
  lines,
  subtotal,
  discount,
  total,
  paid,
  change,
  qrValue,
}: PrintableInvoiceProps) {
  const maxRows = 10;
  const visibleLines = lines.slice(0, maxRows);
  const emptyRowCount = Math.max(0, maxRows - visibleLines.length);
  const createdAtDate =
    createdAt instanceof Date
      ? createdAt
      : createdAt
      ? new Date(createdAt)
      : null;

  return (
    <div className="print-invoice">
      <div className="print-invoice__header">
        <div className="print-invoice__store">
          <div className="print-invoice__store-name">
            {storeName || 'CTY TNHH Thiện Hiền'}
          </div>
          <div className="print-invoice__store-line">
            {storeAddress || 'Địa chỉ cập nhật sau'}
          </div>
          <div className="print-invoice__store-line">
            {storePhone ? `ĐT: ${storePhone}` : 'ĐT: cập nhật sau'}
          </div>
          {storeTaxCode && (
            <div className="print-invoice__store-line">
              Mã số thuế: {storeTaxCode}
            </div>
          )}
        </div>
        <div className="print-invoice__meta">
          <div className="print-invoice__field">
            <span className="print-invoice__label">Số HĐ:</span>
            <span className="print-invoice__value">{invoiceNo}</span>
          </div>
          {createdAtDate && (
            <div className="print-invoice__field">
              <span className="print-invoice__label">Ngày giờ:</span>
              <span className="print-invoice__value">
                {createdAtDate.toLocaleString('vi-VN')}
              </span>
            </div>
          )}
          {cashierName && (
            <div className="print-invoice__field">
              <span className="print-invoice__label">Thu ngân:</span>
              <span className="print-invoice__value">{cashierName}</span>
            </div>
          )}
          {paymentMethodLabel && (
            <div className="print-invoice__field">
              <span className="print-invoice__label">Thanh toán:</span>
              <span className="print-invoice__value">
                {paymentMethodLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="print-invoice__section print-invoice__customer-info">
        <div className="print-invoice__field">
          <span className="print-invoice__label">Khách hàng:</span>
          <span className="print-invoice__value">
            {customer?.name || 'Khách lẻ'}
          </span>
        </div>
        <div className="print-invoice__field">
          <span className="print-invoice__label">SĐT:</span>
          <span className="print-invoice__value">
            {customer?.phone || 'Chưa cập nhật'}
          </span>
        </div>
        <div className="print-invoice__field">
          <span className="print-invoice__label">Địa chỉ:</span>
          <span className="print-invoice__value">
            {customer?.address || 'Chưa cập nhật'}
          </span>
        </div>
      </div>

      <table className="print-invoice__table">
        <thead>
          <tr>
            <th className="col-index">STT</th>
            <th className="col-name">Tên hàng hoá, dịch vụ</th>
            <th className="col-unit">ĐVT</th>
            <th className="col-qty print-invoice__num">SL</th>
            <th className="col-price print-invoice__num">Đơn giá</th>
            <th className="col-total print-invoice__num">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {visibleLines.map((line, idx) => (
            <tr key={line.id || String(idx)}>
              <td className="col-index">{idx + 1}</td>
              <td className="col-name">{line.name}</td>
              <td className="col-unit">{line.unit}</td>
              <td className="col-qty print-invoice__num">
                {line.qty}
              </td>
              <td className="col-price print-invoice__num">
                {formatCurrency(line.unitPrice)}
              </td>
              <td className="col-total print-invoice__num">
                {formatCurrency(line.lineTotal)}
              </td>
            </tr>
          ))}

          {Array.from({ length: emptyRowCount }).map((_, idx) => (
            <tr key={`empty-${idx}`} className="row-empty">
              <td className="col-index">&nbsp;</td>
              <td className="col-name">&nbsp;</td>
              <td className="col-unit">&nbsp;</td>
              <td className="col-qty">&nbsp;</td>
              <td className="col-price">&nbsp;</td>
              <td className="col-total">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-invoice__summary">
        <div className="print-invoice__totals">
          <div className="print-invoice__field">
            <span className="print-invoice__label">Tạm tính:</span>
            <span className="print-invoice__value print-invoice__num">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div className="print-invoice__field">
            <span className="print-invoice__label">Giảm giá:</span>
            <span className="print-invoice__value print-invoice__num">
              {formatCurrency(discount)}
            </span>
          </div>
          <div className="print-invoice__field print-invoice__row-total">
            <span className="print-invoice__label">Tổng cộng:</span>
            <span className="print-invoice__value print-invoice__num">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="print-invoice__field">
            <span className="print-invoice__label">Khách đưa:</span>
            <span className="print-invoice__value print-invoice__num">
              {formatCurrency(paid)}
            </span>
          </div>
          <div className="print-invoice__field">
            <span className="print-invoice__label">Tiền thừa/Nợ:</span>
            <span className="print-invoice__value print-invoice__num">
              {formatCurrency(change)}
            </span>
          </div>
        </div>

        {qrValue && (
          <div className="print-invoice__qr-block">
            <InvoiceQrCode
              value={qrValue}
              label="Quét mã VietQR để thanh toán"
              size={112}
            />
          </div>
        )}
      </div>

      <div className="print-invoice__footer-note">
        Cảm ơn quý khách đã mua hàng. Hẹn gặp lại!
      </div>
    </div>
  );
}

export function mapCartLinesToPrintableLines(
  lines: EnhancedCartLine[],
): PrintableInvoiceLine[] {
  return lines.map((line) => ({
    id: line.productId,
    name: line.productName,
    unit: line.unit,
    qty: line.qty,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal,
    note: line.note,
  }));
}

export function mapInvoiceItemsToPrintableLines(
  items: InvoiceItem[],
): PrintableInvoiceLine[] {
  return items.map((item) => ({
    id: item.id,
    name: item.productNameSnapshot,
    unit: item.unitSnapshot,
    qty: item.qty,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    note: item.noteSnapshot,
  }));
}
