'use client';

import { useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { invoiceRepo } from '@/repos/invoiceRepo';
import { ProductSearchAddPanel } from '@/components/ProductSearchAddPanel';
import { vi } from '@/shared/i18n/vi';
import { formatCurrency } from '@/utils/formatters';
import type { Product, Customer } from '@/domain/models';

import { useInvoiceForm } from './hooks/useInvoiceForm';
import { PriceTierSwitch } from './components/PriceTierSwitch';
import { CartTable } from './components/CartTable';
import { PaymentSummary } from './components/PaymentSummary';
import { ToastContainer, showToast } from './components/Toast';

export default function InvoiceNewPage() {
  const router = useRouter();
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const form = useInvoiceForm();

  // Customer search query (kept from original page logic)
  const customers = useLiveQuery(async () => {
    const term = form.customerSearch.trim().toLowerCase();
    if (!term) {
      return db.customers.orderBy('name').limit(10).toArray();
    }
    const all = await db.customers.toArray();
    return all.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term))
    ).slice(0, 10);
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
    <div className="invoice-new-layout">
      {/* LEFT COLUMN */}
      <div className="invoice-left-column">
        <div className="invoice-header">
          <h2>Tạo hóa đơn mới</h2>
          <Link href="/invoices" className="btn btn-secondary">Hủy</Link>
        </div>

        {form.error && <div className="form-error">{form.error}</div>}

        {/* Customer Section */}
        <section className="invoice-section">
          <h3>Khách hàng</h3>

          {form.customer ? (
            <div className="customer-card">
              <div className="customer-card-info">
                <div className="customer-card-name">
                  <span className="customer-icon">👤</span>
                  {form.customer.name}
                </div>
                {form.customer.phone && (
                  <div className="customer-card-detail">
                    <span className="detail-icon">📞</span>
                    {form.customer.phone}
                  </div>
                )}
                {form.customer.address && (
                  <div className="customer-card-detail">
                    <span className="detail-icon">📍</span>
                    {form.customer.address}
                  </div>
                )}
                <div className={`customer-card-debt ${form.customer.debt > 0 ? 'has-debt' : ''}`}>
                  <span className="detail-icon">💳</span>
                  Công nợ hiện tại: {formatCurrency(form.customer.debt)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleClearCustomer}
              >
                Đổi khách
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
                    <strong>Bán lẻ</strong>
                    <span className="text-muted">(Khách vãng lai)</span>
                  </div>
                  {customers && customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="customer-search-item"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div>
                        <strong>{customer.name}</strong>
                        {customer.phone && (
                          <span className="text-muted"> - {customer.phone}</span>
                        )}
                      </div>
                      {customer.debt > 0 && (
                        <span className="debt-badge">
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
          <h3>Sản phẩm</h3>
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
          <h3>Giỏ hàng ({form.cartLines.length})</h3>
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
          <h3>Ghi chú</h3>
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
        />
      </div>

      <ToastContainer />
    </div>
  );
}
