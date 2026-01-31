# Phase 04: Integration & Polish

## Context Links

- [Parent Plan](./plan.md)
- [Phase 01: Foundation](./phase-01-foundation.md)
- [Phase 02: Cart Components](./phase-02-cart-components.md)
- [Phase 03: Payment UX](./phase-03-payment-ux.md)

## Overview

- **Priority:** P1
- **Status:** Pending
- **Effort:** 1h
- **Description:** Wire all components into page.tsx, connect toast, polish keyboard flow

## Key Insights

1. page.tsx drops from 577 → ~150 lines (orchestration only)
2. ProductSearchAddPanel needs minor update for auto-focus qty
3. Save flow: toast success + reset form + focus search
4. Tab order: Customer → Tier → Search → Cart → Payment → Save

## Requirements

### Functional
- All components wired together in page.tsx
- Save flow with toast and reset
- ProductSearch auto-focuses qty after add
- Tab order logical and complete

### Non-Functional
- No breaking changes
- Smooth transitions
- Console error-free

## Related Code Files

| File | Action |
|------|--------|
| `app/(dashboard)/invoices/new/page.tsx` | Rewrite |
| `components/ProductSearchAddPanel.tsx` | Minor update |
| `shared/i18n/vi.ts` | Add strings |

## Implementation Steps

### Step 4.1: Rewrite page.tsx

Replace entire page with composition of new components:

```typescript
// app/(dashboard)/invoices/new/page.tsx
'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { invoiceRepo } from '@/repos/invoiceRepo';
import { ProductSearchAddPanel } from '@/components/ProductSearchAddPanel';
import { vi } from '@/shared/i18n/vi';
import type { Product } from '@/domain/models';

import { useInvoiceForm } from './hooks/useInvoiceForm';
import { PriceTierSwitch } from './components/PriceTierSwitch';
import { CartTable } from './components/CartTable';
import { PaymentSummary } from './components/PaymentSummary';
import { ToastContainer, showToast } from './components/Toast';

export default function InvoiceNewPage() {
  const router = useRouter();
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const form = useInvoiceForm();

  // Handle add to cart + focus qty
  const handleAddToCart = useCallback((product: Product) => {
    const index = form.addToCart(product);
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
  // ... (Ctrl+K, Ctrl+Enter) same as before

  const canSave = form.cartLines.length > 0 && !form.saving;

  return (
    <div className="invoice-new-layout">
      {/* LEFT COLUMN */}
      <div className="invoice-left-column">
        <div className="invoice-header">
          <h2>Tạo hóa đơn mới</h2>
          <Link href="/invoices" className="btn btn-secondary">Hủy</Link>
        </div>

        {form.error && <div className="form-error">{form.error}</div>}

        {/* Customer Section - keep existing pattern */}
        <section className="invoice-section">
          <h3>Khách hàng</h3>
          {/* ... customer search UI unchanged ... */}
        </section>

        {/* Price Tier */}
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
```

### Step 4.2: Update ProductSearchAddPanel

Minor changes:
- Remove console.log statements
- After add: callback signals parent to focus qty

### Step 4.3: Add i18n Strings

```typescript
// shared/i18n/vi.ts - ADD to invoices section
invoices: {
  // ... existing strings ...
  tierRetail: 'Bán lẻ',
  tierWholesale: 'Sỉ',
  tierDealer: 'Đại lý',
  tierChangeConfirm: 'Áp dụng cho toàn bộ sản phẩm trong giỏ?',
  customPrice: 'Giá chỉnh tay',
  resetToTier: 'Reset về giá tier',
  itemRemoved: 'Đã xoá',
  undo: 'Hoàn tác',
  owing: 'Còn thiếu',
  change: 'Tiền thừa',
  discountAmount: 'Giảm tiền',
  discountPercent: 'Giảm %',
  invoiceCreated: 'Đã tạo hoá đơn',
}
```

## Todo List

- [ ] Rewrite `page.tsx` with component composition
- [ ] Connect toast to cart remove
- [ ] Connect toast to save success
- [ ] Update ProductSearchAddPanel (remove console.logs)
- [ ] Add i18n strings
- [ ] Verify keyboard shortcuts (Ctrl+K, Ctrl+Enter)
- [ ] Verify tab order
- [ ] Test complete flow: search → add → qty → price → payment → save

## Success Criteria

- [ ] Page renders all components correctly
- [ ] Add product → auto-focus qty input
- [ ] Remove item → toast with undo
- [ ] Save → toast with invoice number + reset form + focus search
- [ ] Discount ₫/% toggle works
- [ ] "Còn thiếu" / "Tiền thừa" labels correct
- [ ] Ctrl+K focuses search, Ctrl+Enter saves
- [ ] No console errors
- [ ] page.tsx under 200 lines

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Ref forwarding issues | Medium | Medium | Test qty focus thoroughly |
| State sync between hook and components | Low | High | Single source of truth in hook |
| Existing test breakage | Low | Low | No existing tests for this page |

## Security Considerations

- No security changes - all existing validation preserved
- Input sanitization unchanged
- No new API calls
