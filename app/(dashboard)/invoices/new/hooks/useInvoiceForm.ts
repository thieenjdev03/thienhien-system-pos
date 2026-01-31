'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import type { Customer, Product, PriceTier } from '@/domain/models';
import type { EnhancedCartLine, DiscountMode, RemovedItem } from '../types';

function getPriceByTier(product: Product, tier: PriceTier): number {
  const price = product[tier];
  if (price !== null) return price;
  return product.price1 ?? product.price2 ?? product.price3 ?? 0;
}

export function useInvoiceForm() {
  // Customer state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Cart state
  const [priceTier, setPriceTier] = useState<PriceTier>('price1');
  const [cartLines, setCartLines] = useState<EnhancedCartLine[]>([]);

  // Payment state
  const [discount, setDiscount] = useState(0);
  const [discountMode, setDiscountMode] = useState<DiscountMode>('amount');
  const [paid, setPaid] = useState(0);
  const [note, setNote] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Undo state
  const [removedItem, setRemovedItem] = useState<RemovedItem | null>(null);

  // Refs
  const qtyInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Calculated values
  const subtotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.lineTotal, 0),
    [cartLines]
  );

  const discountAmount = useMemo(() => {
    if (discountMode === 'percent') {
      return Math.min(subtotal, (subtotal * discount) / 100);
    }
    return Math.min(subtotal, discount);
  }, [subtotal, discount, discountMode]);

  const total = subtotal - discountAmount;
  const remaining = total - paid;
  const hasDebt = remaining > 0 && customer !== null;

  const cartProductIds = useMemo(
    () => new Set(cartLines.map((line) => line.productId)),
    [cartLines]
  );

  // Add product to cart
  const addToCart = useCallback((product: Product) => {
    const existingIndex = cartLines.findIndex(
      (line) => line.productId === product.id
    );

    if (existingIndex >= 0) {
      // Increment qty
      const updated = [...cartLines];
      const newQty = updated[existingIndex].qty + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: newQty,
        lineTotal: newQty * updated[existingIndex].unitPrice,
      };
      setCartLines(updated);
      return existingIndex;
    } else {
      // Add new line
      const tierPrice = getPriceByTier(product, priceTier);
      const newLine: EnhancedCartLine = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        unit: product.unit,
        qty: 1,
        unitPrice: tierPrice,
        lineTotal: tierPrice,
        note: product.note,
        priceTier: priceTier,
        price1: product.price1,
        price2: product.price2,
        price3: product.price3,
        isCustomPrice: false,
        originalTierPrice: tierPrice,
      };
      setCartLines([...cartLines, newLine]);
      return cartLines.length; // new index
    }
  }, [cartLines, priceTier]);

  // Update quantity
  const updateQty = useCallback((index: number, qty: number) => {
    if (qty <= 0) {
      // Remove with undo capability
      const line = cartLines[index];
      setRemovedItem({ line, index, timestamp: Date.now() });
      setCartLines(cartLines.filter((_, i) => i !== index));
      return;
    }

    const updated = [...cartLines];
    updated[index] = {
      ...updated[index],
      qty,
      lineTotal: qty * updated[index].unitPrice,
    };
    setCartLines(updated);
  }, [cartLines]);

  // Update price (marks as custom)
  const updatePrice = useCallback((index: number, price: number) => {
    if (price < 0) return;
    const updated = [...cartLines];
    const line = updated[index];
    updated[index] = {
      ...line,
      unitPrice: price,
      lineTotal: line.qty * price,
      isCustomPrice: price !== line.originalTierPrice,
    };
    setCartLines(updated);
  }, [cartLines]);

  // Reset price to tier
  const resetPriceToTier = useCallback((index: number) => {
    const updated = [...cartLines];
    const line = updated[index];
    updated[index] = {
      ...line,
      unitPrice: line.originalTierPrice,
      lineTotal: line.qty * line.originalTierPrice,
      isCustomPrice: false,
    };
    setCartLines(updated);
  }, [cartLines]);

  // Remove line
  const removeLine = useCallback((index: number) => {
    const line = cartLines[index];
    setRemovedItem({ line, index, timestamp: Date.now() });
    setCartLines(cartLines.filter((_, i) => i !== index));
  }, [cartLines]);

  // Undo remove
  const undoRemove = useCallback(() => {
    if (!removedItem) return;
    const { line, index } = removedItem;
    const updated = [...cartLines];
    updated.splice(index, 0, line);
    setCartLines(updated);
    setRemovedItem(null);
  }, [cartLines, removedItem]);

  // Change price tier (with option to apply to non-custom items)
  const changePriceTier = useCallback((tier: PriceTier, applyToCart: boolean) => {
    setPriceTier(tier);

    if (applyToCart && cartLines.length > 0) {
      const updated = cartLines.map(line => {
        if (line.isCustomPrice) return line; // Skip custom prices

        const newPrice = line[tier] ?? line.originalTierPrice;
        return {
          ...line,
          priceTier: tier,
          unitPrice: newPrice,
          lineTotal: line.qty * newPrice,
          originalTierPrice: newPrice,
        };
      });
      setCartLines(updated);
    }
  }, [cartLines]);

  // Reset form
  const resetForm = useCallback(() => {
    setCustomer(null);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setCartLines([]);
    setDiscount(0);
    setDiscountMode('amount');
    setPaid(0);
    setNote('');
    setError(null);
    setRemovedItem(null);
  }, []);

  // Register qty input ref
  const registerQtyRef = useCallback((productId: string, ref: HTMLInputElement | null) => {
    if (ref) {
      qtyInputRefs.current.set(productId, ref);
    } else {
      qtyInputRefs.current.delete(productId);
    }
  }, []);

  // Focus qty input
  const focusQtyInput = useCallback((productId: string) => {
    setTimeout(() => {
      const input = qtyInputRefs.current.get(productId);
      input?.focus();
      input?.select();
    }, 50);
  }, []);

  return {
    // Customer
    customer,
    setCustomer,
    customerSearch,
    setCustomerSearch,
    showCustomerDropdown,
    setShowCustomerDropdown,

    // Cart
    priceTier,
    changePriceTier,
    cartLines,
    cartProductIds,
    addToCart,
    updateQty,
    updatePrice,
    resetPriceToTier,
    removeLine,
    removedItem,
    undoRemove,

    // Payment
    discount,
    setDiscount,
    discountMode,
    setDiscountMode,
    paid,
    setPaid,
    note,
    setNote,

    // Calculated
    subtotal,
    discountAmount,
    total,
    remaining,
    hasDebt,

    // UI
    saving,
    setSaving,
    error,
    setError,
    resetForm,

    // Refs
    registerQtyRef,
    focusQtyInput,
  };
}
