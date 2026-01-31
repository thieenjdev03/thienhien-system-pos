/**
 * Invoice form types for enhanced cart and payment features.
 * Extends base CartLine with custom price tracking and discount modes.
 */
import type { CartLine, Customer, PriceTier } from '@/domain/models';

/** CartLine extended with custom price tracking */
export interface EnhancedCartLine extends CartLine {
  /** True if user manually edited the unit price */
  isCustomPrice: boolean;
  /** Original price from tier when product was added */
  originalTierPrice: number;
}

/** Discount can be absolute amount or percentage */
export type DiscountMode = 'amount' | 'percent';

/** Invoice form state */
export interface InvoiceFormState {
  customer: Customer | null;
  customerSearch: string;
  showCustomerDropdown: boolean;
  priceTier: PriceTier;
  cartLines: EnhancedCartLine[];
  discount: number;
  discountMode: DiscountMode;
  paid: number;
  note: string;
  saving: boolean;
  error: string | null;
}

/** Undo state for removed cart items */
export interface RemovedItem {
  line: EnhancedCartLine;
  index: number;
  timestamp: number;
}

/** Toast notification message */
export interface ToastMessage {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}
