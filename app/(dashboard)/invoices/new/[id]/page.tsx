"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { invoiceRepo, type InvoiceWithItems } from '@/repos/invoiceRepo';
import { customerRepo } from '@/repos/customerRepo';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { vi } from '@/shared/i18n/vi';
import type { Customer } from '@/domain/models';

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
      <div className="page invoice-detail-page">
        <p>{vi.actions.loading}</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="page invoice-detail-page">
        <div className="page-header">
          <h2>{vi.invoices.invoiceDetail}</h2>
          <Link href="/invoices" className="btn btn-secondary">
            {vi.invoices.backToList}
          </Link>
        </div>
        <div className="form-error">{error || vi.validation.invalidValue}</div>
      </div>
    );
  }

  return (
    <div className="page invoice-detail-page">
      <div className="page-header">
        <h2>{vi.invoices.invoiceNo}: {invoice.invoiceNo}</h2>
        <Link href="/invoices" className="btn btn-secondary">
          {vi.invoices.backToList}
        </Link>
      </div>

      <div className="invoice-detail">
        <section className="invoice-header-info">
          <div className="info-grid">
            <div className="info-row">
              <label>{vi.invoices.invoiceNo}:</label>
              <span><strong>{invoice.invoiceNo}</strong></span>
            </div>
            <div className="info-row">
              <label>{vi.invoices.createdAt}:</label>
              <span>{formatDateTime(invoice.createdAt)}</span>
            </div>
          </div>

          <h4>{vi.invoices.customer}</h4>
          {customer ? (
            <div className="info-grid">
              <div className="info-row">
                <label>{vi.customers.name}:</label>
                <span>{customer.name}</span>
              </div>
              {customer.phone && (
                <div className="info-row">
                  <label>{vi.customers.phone}:</label>
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="info-row">
                  <label>{vi.customers.address}:</label>
                  <span>{customer.address}</span>
                </div>
              )}
              <div className="info-row">
                <label>{vi.customers.currentDebt}:</label>
                <span className={customer.debt > 0 ? 'text-danger' : ''}>
                  {formatCurrency(customer.debt)}
                </span>
              </div>
            </div>
          ) : (
            <p>{vi.customers.walkIn} ({vi.customers.walkInDescription})</p>
          )}

          {invoice.note && (
            <div className="info-row mt-md">
              <label>{vi.invoices.note}:</label>
              <span>{invoice.note}</span>
            </div>
          )}
        </section>

        <section className="invoice-items">
          <h3>Chi tiết sản phẩm</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{vi.cart.productName}</th>
                <th>{vi.cart.category}</th>
                <th>{vi.cart.unit}</th>
                <th style={{ textAlign: 'right' }}>{vi.cart.qty}</th>
                <th style={{ textAlign: 'right' }}>{vi.cart.unitPrice}</th>
                <th style={{ textAlign: 'right' }}>{vi.cart.lineTotal}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    {item.productNameSnapshot}
                    {item.noteSnapshot && (
                      <span className="text-muted text-sm block">{item.noteSnapshot}</span>
                    )}
                  </td>
                  <td>{item.categorySnapshot || '-'}</td>
                  <td>{item.unitSnapshot}</td>
                  <td style={{ textAlign: 'right' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="invoice-totals">
          <div className="totals-grid">
            <label>{vi.invoices.subtotal}:</label>
            <span>{formatCurrency(invoice.subtotal)}</span>

            <label>{vi.invoices.discount}:</label>
            <span>{formatCurrency(invoice.discount)}</span>

            <label>{vi.invoices.total}:</label>
            <span className="total-amount">{formatCurrency(invoice.total)}</span>

            <label>{vi.invoices.paid}:</label>
            <span>{formatCurrency(invoice.paid)}</span>

            <label>{vi.invoices.change}:</label>
            <span className={invoice.change < 0 ? 'text-danger' : ''}>
              {formatCurrency(invoice.change)}
            </span>

            {invoice.debtIncrease > 0 && (
              <>
                <label className="text-danger">{vi.invoices.debtIncrease}:</label>
                <span className="text-danger">{formatCurrency(invoice.debtIncrease)}</span>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
