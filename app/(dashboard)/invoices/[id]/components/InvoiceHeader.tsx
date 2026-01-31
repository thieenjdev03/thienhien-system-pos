'use client';

import Link from 'next/link';
import { vi } from '@/shared/i18n/vi';
import type { InvoiceWithItems } from '@/repos/invoiceRepo';

interface InvoiceHeaderProps {
  invoice: InvoiceWithItems;
  onPrint?: () => void;
}

export function InvoiceHeader({ invoice, onPrint }: InvoiceHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900 m-0">
            {vi.invoices.invoiceNo}: {invoice.invoiceNo}
          </h2>
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Hoàn thành
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onPrint}
          className="btn btn-secondary flex items-center gap-2"
          type="button"
        >
          <span>🖨️</span>
          In hóa đơn
        </button>
        <Link href="/invoices" className="btn btn-secondary">
          {vi.invoices.backToList}
        </Link>
      </div>
    </div>
  );
}
