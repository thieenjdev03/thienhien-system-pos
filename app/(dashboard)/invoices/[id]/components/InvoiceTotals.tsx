'use client';

import { formatCurrency } from '@/utils/formatters';
import { vi } from '@/shared/i18n/vi';
import type { InvoiceWithItems } from '@/repos/invoiceRepo';

interface InvoiceTotalsProps {
  invoice: InvoiceWithItems;
}

export function InvoiceTotals({ invoice }: InvoiceTotalsProps) {
  // Determine if there is a debt increase or change (money back)
  // Logic: if change is negative, it means paid < total, so it's debt increase/remaining
  // We want to show POSITIVE numbers with correct labels
  
  const isOwing = invoice.change < 0;
  const changeAmount = Math.abs(invoice.change);
  
  return (
    <div className="flex flex-col gap-3 max-w-sm ml-auto">
      {/* Subtotal */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500">{vi.invoices.subtotal}:</span>
        <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
      </div>

      {/* Discount */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500">{vi.invoices.discount}:</span>
        <span className="font-medium text-slate-900">{formatCurrency(invoice.discount)}</span>
      </div>

      <div className="border-t border-slate-100 my-1"></div>

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="font-bold text-slate-700">{vi.invoices.total}:</span>
        <span className="text-xl font-bold text-blue-600">{formatCurrency(invoice.total)}</span>
      </div>

      {/* Paid */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500">{vi.invoices.paid}:</span>
        <span className="font-medium text-slate-900">{formatCurrency(invoice.paid)}</span>
      </div>

      {/* Change / Owing */}
      <div className="flex justify-between items-center text-sm">
        <span className={`font-medium ${isOwing ? 'text-red-500' : 'text-slate-500'}`}>
          {isOwing ? vi.invoices.owing : vi.invoices.change}:
        </span>
        <span className={`font-bold ${isOwing ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(changeAmount)}
        </span>
      </div>

      {/* Debt Warning (if applicable) */}
      {invoice.debtIncrease > 0 && (
         <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm">
            <div className="flex justify-between items-center">
               <span className="font-medium text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {vi.invoices.debtIncrease}:
               </span>
               <span className="font-bold text-red-700">{formatCurrency(invoice.debtIncrease)}</span>
            </div>
         </div>
      )}
    </div>
  );
}
