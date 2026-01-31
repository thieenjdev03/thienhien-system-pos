'use client';

import { formatCurrency } from '@/utils/formatters';
import { vi } from '@/shared/i18n/vi';
import type { InvoiceWithItems } from '@/repos/invoiceRepo';

interface InvoiceItemsTableProps {
  items: InvoiceWithItems['items'];
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  return (
    <div className="rounded-md border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200">
            <th className="py-3 px-4 text-left font-semibold text-slate-500 w-12">#</th>
            <th className="py-3 px-4 text-left font-semibold text-slate-500">{vi.cart.productName}</th>
            <th className="py-3 px-4 text-left font-semibold text-slate-500 w-32">{vi.cart.unit}</th>
            <th className="py-3 px-4 text-right font-semibold text-slate-500 w-24">{vi.cart.qty}</th>
            <th className="py-3 px-4 text-right font-semibold text-slate-500 w-32">{vi.cart.unitPrice}</th>
            <th className="py-3 px-4 text-right font-semibold text-slate-500 w-32">{vi.cart.lineTotal}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, index) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 text-slate-500">{index + 1}</td>
              <td className="py-3 px-4">
                <div className="font-medium text-slate-900">{item.productNameSnapshot}</div>
                {item.noteSnapshot && (
                  <div className="text-xs text-slate-400 mt-0.5">{item.noteSnapshot}</div>
                )}
              </td>
              <td className="py-3 px-4 text-slate-500">{item.unitSnapshot}</td>
              <td className="py-3 px-4 text-right font-medium">{item.qty}</td>
              <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
