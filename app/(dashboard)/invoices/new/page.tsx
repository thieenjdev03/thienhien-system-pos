'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { invoiceRepo } from '@/repos/invoiceRepo';
import { db } from '@/db';
import { ProductSearchAddPanel } from '@/components/ProductSearchAddPanel';
import { vi } from '@/shared/i18n/vi';
import { formatCurrency } from '@/utils/formatters';
import type { Product, Customer } from '@/domain/models';

import { useInvoiceForm } from './hooks/useInvoiceForm';
import { PriceTierSwitch } from './components/PriceTierSwitch';
import { CartTable } from './components/CartTable';
import { PaymentSummary } from './components/PaymentSummary';
import { ToastContainer, showToast } from './components/Toast';
import { PrintableInvoice, mapCartLinesToPrintableLines } from '@/components/PrintableInvoice';

// Font Awesome black & white (regular/solid/brands for full icon set)
import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import '@fortawesome/fontawesome-free/css/regular.min.css';
import '@fortawesome/fontawesome-free/css/brands.min.css';

export default function InvoiceNewPage() {
  const router = useRouter();
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const form = useInvoiceForm();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'vietqr' | 'debt'>('cash');
  const [lastInvoiceId, setLastInvoiceId] = useState<string | null>(null);

  // Customer search results from API (Prisma)
  const [customers, setCustomers] = useState<Customer[] | undefined>(undefined);

  useEffect(() => {
    document.title = 'Tạo hóa đơn mới - POS Thiện Hiền';
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchCustomers = async () => {
      try {
        const params = new URLSearchParams();
        const term = form.customerSearch.trim();
        if (term) {
          params.set('search', term);
        }
        params.set('limit', '10');

        const res = await fetch(`/api/customers?${params.toString()}`, {
          method: 'GET',
        });
        if (!res.ok) return;

        const json = await res.json();
        const apiCustomers = (json?.data ?? []) as any[];
        const mapped: Customer[] = apiCustomers.map((c) => ({
          id: String(c.id),
          name: c.name,
          phone: c.phone ?? undefined,
          address: c.address ?? undefined,
          note: c.note ?? undefined,
          debt: Number(c.debt ?? 0),
          createdAt: new Date(c.createdAt).getTime(),
          updatedAt: new Date(c.updatedAt).getTime(),
        }));

        // Đồng bộ khách hàng từ API vào Dexie để đảm bảo invoice.customerId trỏ đúng bản ghi local
        await db.customers.bulkPut(mapped);

        if (!cancelled) {
          setCustomers(mapped);
        }
      } catch {
        // swallow errors for dropdown
      }
    };

    fetchCustomers();

    return () => {
      cancelled = true;
    };
  }, [form.customerSearch]);

  // Handle add to cart + focus qty
  const handleAddToCart = useCallback((product: Product) => {
    // Determine if we need to set the price tier for the new item
    // The hook handles adding with current priceTier
    form.addToCart(product);
    form.focusQtyInput(product.id);
  }, [form]);

  // Handle remove with toast+undo
  const handleRemove = useCallback((index: number) => {
    const line = form.cartLines[index];
    form.removeLine(index);
    showToast(`Đã xoá: ${line.productName}`, {
      label: 'Hoàn tác',
      onClick: () => form.undoRemove(),
    });
  }, [form]);

  // Handle save
  const handleSave = useCallback(async () => {
    form.setError(null);

    if (form.cartLines.length === 0) {
      form.setError(vi.validation.atLeastOneItem);
      return;
    }

    form.setSaving(true);
    try {
      const invoice = await invoiceRepo.create({
        customerId: form.customer?.id ?? null,
        lines: form.cartLines,
        discount: form.discountAmount,
        paid: form.paid,
        note: form.note.trim() || undefined,
      });

      showToast(`Đã tạo hoá đơn ${invoice.invoiceNo}`);
      setLastInvoiceId(invoice.id);
      form.resetForm();
      productSearchInputRef.current?.focus();
    } catch (err) {
      form.setError(err instanceof Error ? err.message : vi.validation.invalidValue);
    } finally {
      form.setSaving(false);
    }
  }, [form, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Focus product search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        productSearchInputRef.current?.focus();
      }

      // Ctrl+Enter or Cmd+Enter: Save invoice
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (form.cartLines.length > 0 && !form.saving) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form.cartLines.length, form.saving, handleSave]);

  const canSave = form.cartLines.length > 0 && !form.saving;

  // Customer handlers
  const handleSelectCustomer = (customer: Customer | null) => {
    form.setCustomer(customer);
    form.setShowCustomerDropdown(false);
    form.setCustomerSearch('');
  };

  const handleClearCustomer = () => {
    form.setCustomer(null);
  };

  return (
    <>
      <div className="invoice-new-layout">
        {/* LEFT COLUMN */}
        <div className="invoice-left-column">
        <div className="invoice-header">
          <h2>
            <i className="fa fa-file-invoice-dollar" style={{ marginRight: 8 }} /> Tạo hóa đơn mới
          </h2>
          <Link href="/invoices" className="btn btn-secondary">
            <i className="fa fa-xmark" style={{ marginRight: 6 }} /> Hủy
          </Link>
        </div>

        {form.error && (
          <div className="form-error">
            <i className="fa fa-triangle-exclamation" style={{ marginRight: 6, color: '#e74c3c' }} /> {form.error}
          </div>
        )}

        {/* Customer Section */}
        <section className="invoice-section">
          <h3>
            <i className="fa fa-user-group" style={{ marginRight: 5 }} /> Khách hàng
          </h3>

          {form.customer ? (
            <div className="customer-card">
              <div className="customer-card-info">
                <div className="customer-card-name">
                  <span className="customer-icon">
                    <i className="fa fa-user" aria-hidden="true" />
                  </span>
                  {form.customer.name}
                </div>
                {form.customer.phone && (
                  <div className="customer-card-detail">
                    <span className="detail-icon">
                      <i className="fa fa-phone" aria-hidden="true" />
                    </span>
                    {form.customer.phone}
                  </div>
                )}
                {form.customer.address && (
                  <div className="customer-card-detail">
                    <span className="detail-icon">
                      <i className="fa fa-location-dot" aria-hidden="true" />
                    </span>
                    {form.customer.address}
                  </div>
                )}
                <div className={`customer-card-debt ${form.customer.debt > 0 ? 'has-debt' : ''}`}>
                  <span className="detail-icon">
                    <i className="fa fa-credit-card" aria-hidden="true" />
                  </span>
                  Công nợ hiện tại: {formatCurrency(form.customer.debt)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleClearCustomer}
              >
                <i className="fa fa-right-left" style={{ marginRight: 6 }} /> Đổi khách
              </button>
            </div>
          ) : (
            <div className="customer-search-container">
              <input
                type="text"
                placeholder="Nhập tên hoặc SĐT khách hàng…"
                value={form.customerSearch}
                onChange={(e) => {
                  form.setCustomerSearch(e.target.value);
                  form.setShowCustomerDropdown(true);
                }}
                onFocus={() => form.setShowCustomerDropdown(true)}
              />
              {form.showCustomerDropdown && (
                <div className="customer-search-dropdown">
                  <div
                    className="customer-search-item walk-in"
                    onClick={() => handleSelectCustomer(null)}
                  >
                    <strong>
                      <i className="fa fa-store" style={{ marginRight: 5 }} /> Bán lẻ
                    </strong>
                    <span className="text-muted">(Khách vãng lai)</span>
                  </div>
                  {customers && customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="customer-search-item"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div>
                        <strong>
                          <i className="fa fa-user" style={{ marginRight: 5 }} />
                          {customer.name}
                        </strong>
                        {customer.phone && (
                          <span className="text-muted"> - {customer.phone}</span>
                        )}
                      </div>
                      {customer.debt > 0 && (
                        <span className="debt-badge">
                          <i className="fa fa-money-bill-wave" style={{ marginRight: 2 }} />
                          Nợ: {formatCurrency(customer.debt)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Price Tier & Search */}
        <section className="invoice-section">
          <h3>
            <i className="fa fa-boxes-stacked" style={{ marginRight: 5 }} /> Sản phẩm
          </h3>
          <PriceTierSwitch
            value={form.priceTier}
            onChange={form.changePriceTier}
            hasCartItems={form.cartLines.length > 0}
          />
          <ProductSearchAddPanel
            onAddToCart={handleAddToCart}
            priceTier={form.priceTier}
            cartProductIds={form.cartProductIds}
            searchInputRef={productSearchInputRef}
          />
        </section>

        {/* Cart */}
        <section className="invoice-section cart-section">
          <h3>
            <i className="fa fa-cart-shopping" style={{ marginRight: 5 }} />
            Giỏ hàng ({form.cartLines.length})
          </h3>
          <CartTable
            lines={form.cartLines}
            onUpdateQty={form.updateQty}
            onUpdatePrice={form.updatePrice}
            onResetPrice={form.resetPriceToTier}
            onRemove={handleRemove}
            registerQtyRef={form.registerQtyRef}
          />
        </section>

        {/* Note */}
        <section className="invoice-section">
          <h3>
            <i className="fa fa-note-sticky" style={{ marginRight: 5 }} /> Ghi chú
          </h3>
          <textarea
            className="invoice-note"
            value={form.note}
            onChange={(e) => form.setNote(e.target.value)}
            placeholder="Ghi chú hóa đơn (nếu có)…"
            rows={2}
          />
        </section>
      </div>

      {/* RIGHT COLUMN */}
      <div className="invoice-right-column">
        <PaymentSummary
          subtotal={form.subtotal}
          discount={form.discount}
          discountMode={form.discountMode}
          discountAmount={form.discountAmount}
          total={form.total}
          paid={form.paid}
          remaining={form.remaining}
          hasDebt={form.hasDebt}
          hasCustomer={form.customer !== null}
          canSave={canSave}
          saving={form.saving}
          onDiscountChange={form.setDiscount}
          onDiscountModeChange={form.setDiscountMode}
          onPaidChange={form.setPaid}
          onSave={handleSave}
          invoiceId={lastInvoiceId ?? undefined}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
        />
      </div>

      <ToastContainer />
      </div>

      {/* Hidden printable layout for window.print() */}
      <div className="hidden print:block">
        <PrintableInvoice
          storeName="CTY TNHH Thiện Hiền"
          storeAddress="Địa chỉ cập nhật sau"
          storePhone=""
          storeTaxCode={undefined}
          createdAt={new Date()}
          cashierName={null}
          paymentMethodLabel={null}
          invoiceNo={lastInvoiceId ?? 'TẠM IN'}
          customer={form.customer}
          lines={mapCartLinesToPrintableLines(form.cartLines)}
          subtotal={form.subtotal}
          discount={form.discountAmount}
          total={form.total}
          paid={form.paid}
          change={form.paid - form.total}
          qrValue={''}
        />
      </div>
    </>
  );
}
