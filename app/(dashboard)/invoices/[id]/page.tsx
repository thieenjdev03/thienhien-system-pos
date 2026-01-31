'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { invoiceRepo, type InvoiceWithItems } from '@/repos/invoiceRepo';
import { customerRepo } from '@/repos/customerRepo';
import { formatCurrency } from '@/utils/formatters';
import { vi } from '@/shared/i18n/vi';
import type { Customer } from '@/domain/models';

import { InvoiceHeader } from './components/InvoiceHeader';
import { InvoiceItemsTable } from './components/InvoiceItemsTable';
import { InvoiceTotals } from './components/InvoiceTotals';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) {
        setError(vi.validation.invalidValue);
        setLoading(false);
        return;
      }

      try {
        const inv = await invoiceRepo.getById(id);
        if (!inv) {
          setError(vi.validation.invalidValue);
          setLoading(false);
          return;
        }

        setInvoice(inv);

        // Load customer if exists
        if (inv.customerId) {
          const cust = await customerRepo.getById(inv.customerId);
          setCustomer(cust ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : vi.validation.invalidValue);
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <p>{vi.actions.loading}</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <div className="text-red-600 bg-red-50 p-4 rounded-md border border-red-200">
            {error || vi.invoices.emptyState}
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto bg-white min-h-screen">
      <InvoiceHeader invoice={invoice} onPrint={handlePrint} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Info Column */}
        <div className="space-y-4">
             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Thông tin chung</h3>
             <div className="flex flex-col gap-2 text-sm">
                <div>
                    <span className="text-slate-500 w-24 inline-block">{vi.invoices.invoiceNo}:</span>
                    <span className="font-medium text-slate-900">{invoice.invoiceNo}</span>
                </div>
                <div>
                   <span className="text-slate-500 w-24 inline-block">{vi.invoices.createdAt}:</span>
                   <span className="font-medium text-slate-900">{new Date(invoice.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                {invoice.note && (
                   <div className="mt-2 text-slate-600 italic bg-amber-50 p-2 rounded text-xs border border-amber-100">
                      "{invoice.note}"
                   </div>
                )}
             </div>
        </div>

        {/* Customer Column */}
        <div className="space-y-4 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{vi.invoices.customer}</h3>
            {customer ? (
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-lg">
                        👤
                    </div>
                    <div>
                        <div className="text-base font-bold text-slate-900">{customer.name}</div>
                        {customer.phone && <div className="text-sm text-slate-500 mt-1">📞 {customer.phone}</div>}
                        {customer.address && <div className="text-sm text-slate-500">📍 {customer.address}</div>}
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded-md">
                   <span className="text-xl">🏪</span>
                   <span>{vi.customers.walkIn} ({vi.customers.walkInDescription})</span>
                </div>
            )}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{vi.invoices.invoiceDetail}</h3>
        <InvoiceItemsTable items={invoice.items} />
      </div>

      <InvoiceTotals invoice={invoice} />
    </div>
  );
}
