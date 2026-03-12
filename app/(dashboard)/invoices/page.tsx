"use client";
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { vi } from '@/shared/i18n/vi';
import { cn } from '@/lib/utils';

export default function InvoicesPage() {
  useEffect(() => {
    document.title = 'Hóa đơn - POS Thiện Hiền';
  }, []);
  const router = useRouter();

  // Live query for invoices with customer lookup
  const invoicesWithCustomers = useLiveQuery(async () => {
    const invoices = await db.invoices.orderBy('createdAt').reverse().toArray();

    // Get all unique customer IDs (excluding null)
    const customerIds = [
      ...new Set(
        invoices
          .map((inv) => inv.customerId)
          .filter((id): id is string => id !== null),
      ),
    ];

    // Fetch all customers in one query
    const customers = await db.customers.where('id').anyOf(customerIds).toArray();
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    // Attach customer info to invoices
    return invoices.map((invoice) => ({
      ...invoice,
      customerName: invoice.customerId
        ? customerMap.get(invoice.customerId)?.name ?? 'Không xác định'
        : vi.customers.walkIn,
    }));
  });

  const handleRowClick = (id: string) => {
    router.push(`/invoices/${id}`);
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{vi.invoices.title}</h2>
        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white no-underline transition-colors hover:bg-blue-700"
        >
          + {vi.invoices.newInvoice}
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.invoices.invoiceNo}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.invoices.customer}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.invoices.createdAt}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.invoices.total}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.invoices.paid}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.invoices.change}
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                {vi.invoices.debtIncrease}
              </th>
            </tr>
          </thead>
          <tbody>
            {!invoicesWithCustomers || invoicesWithCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-sm text-slate-400"
                >
                  {vi.invoices.emptyState}
                </td>
              </tr>
            ) : (
              invoicesWithCustomers.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
                  onClick={() => handleRowClick(invoice.id)}
                >
                  <td className="px-3 py-2 align-middle">
                    <strong>{invoice.invoiceNo}</strong>
                  </td>
                  <td className="px-3 py-2 align-middle">{invoice.customerName}</td>
                  <td className="px-3 py-2 align-middle">
                    {formatDateTime(invoice.createdAt)}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    {formatCurrency(invoice.paid)}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 align-middle',
                      invoice.change < 0 && 'text-red-600',
                    )}
                  >
                    {formatCurrency(invoice.change)}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 align-middle',
                      invoice.debtIncrease > 0 && 'text-red-600',
                    )}
                  >
                    {invoice.debtIncrease > 0
                      ? formatCurrency(invoice.debtIncrease)
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
