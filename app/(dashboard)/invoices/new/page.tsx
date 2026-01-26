"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { invoiceRepo } from '@/repos/invoiceRepo';
import { formatCurrency } from '@/utils/formatters';
import { ProductSearchAddPanel } from '@/components/ProductSearchAddPanel';
import { vi } from '@/shared/i18n/vi';
import type { Customer, Product, CartLine, PriceTier } from '@/domain/models';

/**
 * Get price by tier with fallback
 */
function getPriceByTier(product: Product, tier: PriceTier): number {
  const price = product[tier];
  if (price !== null) return price;
  return product.price1 ?? product.price2 ?? product.price3 ?? 0;
}

export default function InvoiceNewPage() {
  const router = useRouter();

  // Form state
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [globalPriceTier, setGlobalPriceTier] = useState<PriceTier>('price1');

  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for keyboard shortcuts
  const productSearchInputRef = useRef<HTMLInputElement>(null);

  // Customer search query
  const customers = useLiveQuery(async () => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) {
      return db.customers.orderBy('name').limit(10).toArray();
    }
    const all = await db.customers.toArray();
    return all.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term))
    ).slice(0, 10);
  }, [customerSearch]);

  // Calculated totals
  const subtotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.lineTotal, 0),
    [cartLines]
  );
  const total = subtotal - discount;
  const change = paid - total;
  const debtIncrease = Math.max(0, total - paid);
  const hasDebt = debtIncrease > 0 && selectedCustomer !== null;

  // Cart product IDs for exclusion hint
  const cartProductIds = useMemo(
    () => new Set(cartLines.map((line) => line.productId)),
    [cartLines]
  );

  const canSave = cartLines.length > 0 && !saving;

  // Save invoice handler (wrapped in useCallback for useEffect dependency)
  const handleSave = useCallback(async () => {
    setError(null);

    if (cartLines.length === 0) {
      setError(vi.validation.atLeastOneItem);
      return;
    }

    if (discount < 0) {
      setError(vi.validation.discountNonNegative);
      return;
    }

    if (paid < 0) {
      setError(vi.validation.paidNonNegative);
      return;
    }

    setSaving(true);
    try {
      const invoice = await invoiceRepo.create({
        customerId: selectedCustomer?.id ?? null,
        lines: cartLines,
        discount,
        paid,
        note: note.trim() || undefined,
      });
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : vi.validation.invalidValue);
      setSaving(false);
    }
  }, [cartLines, discount, paid, note, selectedCustomer, router]);

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
        if (canSave) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSave, handleSave]);

  // Customer handlers
  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    setCustomerSearch('');
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
  };

  // Product handlers
  const handleAddToCart = (product: Product) => {
    const existingIndex = cartLines.findIndex(
      (line) => line.productId === product.id
    );

    if (existingIndex >= 0) {
      // Increment qty
      const updated = [...cartLines];
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: updated[existingIndex].qty + 1,
        lineTotal:
          (updated[existingIndex].qty + 1) * updated[existingIndex].unitPrice,
      };
      setCartLines(updated);
    } else {
      // Add new line with global price tier
      const selectedPrice = getPriceByTier(product, globalPriceTier);
      const newLine: CartLine = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        unit: product.unit,
        qty: 1,
        unitPrice: selectedPrice,
        lineTotal: selectedPrice,
        note: product.note,
        priceTier: globalPriceTier,
        price1: product.price1,
        price2: product.price2,
        price3: product.price3,
      };
      setCartLines([...cartLines, newLine]);
    }
  };

  // Cart line handlers
  const handleQtyIncrement = (index: number) => {
    const updated = [...cartLines];
    const newQty = updated[index].qty + 1;
    updated[index] = {
      ...updated[index],
      qty: newQty,
      lineTotal: newQty * updated[index].unitPrice,
    };
    setCartLines(updated);
  };

  const handleQtyDecrement = (index: number) => {
    const updated = [...cartLines];
    const newQty = Math.max(1, updated[index].qty - 1);
    updated[index] = {
      ...updated[index],
      qty: newQty,
      lineTotal: newQty * updated[index].unitPrice,
    };
    setCartLines(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...cartLines];
    updated[index] = {
      ...updated[index],
      qty,
      lineTotal: qty * updated[index].unitPrice,
    };
    setCartLines(updated);
  };

  const handlePriceChange = (index: number, unitPrice: number) => {
    if (unitPrice < 0) return;
    const updated = [...cartLines];
    updated[index] = {
      ...updated[index],
      unitPrice,
      lineTotal: updated[index].qty * unitPrice,
      priceTier: 'price1', // Mark as custom
    };
    setCartLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    setCartLines(cartLines.filter((_, i) => i !== index));
  };

  // Get price tier badge text
  const getPriceBadgeText = (line: CartLine): string => {
    // Check if price matches any tier
    if (line.price1 !== null && line.unitPrice === line.price1) return 'Giá 1';
    if (line.price2 !== null && line.unitPrice === line.price2) return 'Giá 2';
    if (line.price3 !== null && line.unitPrice === line.price3) return 'Giá 3';
    return 'Tùy chỉnh';
  };

  const getPriceBadgeClass = (line: CartLine): string => {
    if (line.price1 !== null && line.unitPrice === line.price1) return 'badge-price1';
    if (line.price2 !== null && line.unitPrice === line.price2) return 'badge-price2';
    if (line.price3 !== null && line.unitPrice === line.price3) return 'badge-price3';
    return 'badge-custom';
  };


  return (
    <div className="invoice-new-layout">
      {/* LEFT COLUMN - Workflow Area */}
      <div className="invoice-left-column">
        {/* Header */}
        <div className="invoice-header">
          <h2>Tạo hóa đơn mới</h2>
          <Link href="/invoices" className="btn btn-secondary">
            Hủy
          </Link>
        </div>

        {error && <div className="form-error">{error}</div>}

        {/* Customer Section */}
        <section className="invoice-section">
          <h3>Khách hàng</h3>

          {selectedCustomer ? (
            <div className="customer-card">
              <div className="customer-card-info">
                <div className="customer-card-name">
                  <span className="customer-icon">👤</span>
                  {selectedCustomer.name}
                </div>
                {selectedCustomer.phone && (
                  <div className="customer-card-detail">
                    <span className="detail-icon">📞</span>
                    {selectedCustomer.phone}
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="customer-card-detail">
                    <span className="detail-icon">📍</span>
                    {selectedCustomer.address}
                  </div>
                )}
                <div className={`customer-card-debt ${selectedCustomer.debt > 0 ? 'has-debt' : ''}`}>
                  <span className="detail-icon">💳</span>
                  Công nợ hiện tại: {formatCurrency(selectedCustomer.debt)}
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
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
              />
              {showCustomerDropdown && (
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

        {/* Product Section */}
        <section className="invoice-section">
          <h3>Sản phẩm</h3>

          {/* Price Tier Selector */}
          <div className="price-tier-selector">
            <div className="tier-selector-header">
              <span className="tier-label">{vi.invoices.priceTierLabel}:</span>
              <span className="tier-hint">{vi.invoices.priceTierHint}</span>
            </div>
            <div className="tier-options">
              <label className={`tier-option ${globalPriceTier === 'price1' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="priceTier"
                  value="price1"
                  checked={globalPriceTier === 'price1'}
                  onChange={() => setGlobalPriceTier('price1')}
                />
                Giá 1
              </label>
              <label className={`tier-option ${globalPriceTier === 'price2' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="priceTier"
                  value="price2"
                  checked={globalPriceTier === 'price2'}
                  onChange={() => setGlobalPriceTier('price2')}
                />
                Giá 2
              </label>
              <label className={`tier-option ${globalPriceTier === 'price3' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="priceTier"
                  value="price3"
                  checked={globalPriceTier === 'price3'}
                  onChange={() => setGlobalPriceTier('price3')}
                />
                Giá 3
              </label>
            </div>
          </div>

          {/* Product Search & Add Panel */}
          <ProductSearchAddPanel
            onAddToCart={handleAddToCart}
            priceTier={globalPriceTier}
            cartProductIds={cartProductIds}
            searchInputRef={productSearchInputRef}
          />
        </section>

        {/* Cart Section */}
        <section className="invoice-section cart-section">
          <h3>Giỏ hàng</h3>
          <table className="cart-table-enhanced">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th style={{ width: '140px' }}>Số lượng</th>
                <th style={{ width: '150px' }}>Đơn giá</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Thành tiền</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {cartLines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="cart-empty">
                    <div className="cart-empty-content">
                      <span className="cart-empty-icon">🛒</span>
                      <span>Chưa có sản phẩm trong giỏ hàng</span>
                    </div>
                  </td>
                </tr>
              ) : (
                cartLines.map((line, index) => (
                  <tr key={line.productId}>
                    <td>
                      <div className="cart-product-info">
                        <span className="cart-product-name">{line.productName}</span>
                        <span className="cart-product-unit">{line.unit}</span>
                      </div>
                    </td>
                    <td>
                      <div className="qty-control">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => handleQtyDecrement(index)}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          className="qty-input"
                          value={line.qty}
                          onChange={(e) =>
                            handleQtyChange(index, parseInt(e.target.value) || 1)
                          }
                          min="1"
                        />
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => handleQtyIncrement(index)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="price-cell">
                        <input
                          type="number"
                          className="price-input"
                          value={line.unitPrice}
                          onChange={(e) =>
                            handlePriceChange(index, parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          step="1000"
                        />
                        <span className={`price-badge ${getPriceBadgeClass(line)}`}>
                          {getPriceBadgeText(line)}
                        </span>
                      </div>
                    </td>
                    <td className="line-total">
                      {formatCurrency(line.lineTotal)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveLine(index)}
                        title="Xóa"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Note Section */}
        <section className="invoice-section">
          <h3>Ghi chú</h3>
          <textarea
            className="invoice-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú hóa đơn (nếu có)…"
            rows={2}
          />
        </section>
      </div>

      {/* RIGHT COLUMN - Payment Summary (Sticky) */}
      <div className="invoice-right-column">
        <div className="payment-card">
          <h3>Thanh toán</h3>

          <div className="payment-rows">
            <div className="payment-row">
              <span className="payment-label">Tạm tính:</span>
              <span className="payment-value">{formatCurrency(subtotal)}</span>
            </div>

            <div className="payment-row">
              <span className="payment-label">Giảm giá:</span>
              <input
                type="number"
                className="payment-input"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                step="1000"
              />
            </div>

            <div className="payment-row payment-total">
              <span className="payment-label">TỔNG CỘNG:</span>
              <span className="payment-value total-value">{formatCurrency(total)}</span>
            </div>

            <div className="payment-row">
              <span className="payment-label">Khách đưa:</span>
              <input
                type="number"
                className="payment-input"
                value={paid}
                onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
                min="0"
                step="1000"
              />
            </div>

            <div className={`payment-row payment-change ${change >= 0 ? 'positive' : 'negative'}`}>
              <span className="payment-label">Tiền thừa:</span>
              <span className="payment-value">{formatCurrency(change)}</span>
            </div>

            {hasDebt && (
              <div className="payment-row payment-debt">
                <span className="payment-label">
                  <span className="warning-icon">⚠️</span>
                  Phát sinh công nợ:
                </span>
                <span className="payment-value debt-value">{formatCurrency(debtIncrease)}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className={`save-invoice-btn ${hasDebt ? 'has-debt' : ''}`}
            onClick={handleSave}
            disabled={!canSave}
          >
            {saving ? (
              'Đang lưu...'
            ) : hasDebt ? (
              <>⚠️ LƯU HÓA ĐƠN (CÔNG NỢ)</>
            ) : (
              <>💾 LƯU HÓA ĐƠN</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
