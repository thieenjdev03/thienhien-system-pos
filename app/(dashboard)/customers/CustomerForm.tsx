"use client";

import { useState, useEffect, useRef } from 'react';
import type { Customer, CustomerInput } from '@/domain/models';
import { vi } from '@/shared/i18n/vi';
import { Modal } from '@/components/Modal';
import { formatCurrency } from '@/utils/formatters';

interface CustomerFormProps {
  isOpen: boolean;
  customer?: Customer; // undefined = create mode, defined = edit mode
  onSave: (data: CustomerInput) => Promise<void>;
  onCancel: () => void;
}

export function CustomerForm({ isOpen, customer, onSave, onCancel }: CustomerFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [debt, setDebt] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const isEdit = !!customer;

  // Reset form whenever modal opens or customer changes
  useEffect(() => {
    if (!isOpen) return;
    setName(customer?.name ?? '');
    setPhone(customer?.phone ?? '');
    setAddress(customer?.address ?? '');
    setNote(customer?.note ?? '');
    setDebt(customer?.debt != null ? customer.debt.toString() : '0');
    setError(null);
    // Focus name input for fast entry
    requestAnimationFrame(() => {
      nameRef.current?.focus();
    });
  }, [isOpen, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(vi.validation.nameRequired);
      nameRef.current?.focus();
      return;
    }

    const debtNum = parseFloat(debt.replace(/,/g, '')) || 0;
    if (debtNum < 0) {
      setError(vi.validation.priceNonNegative);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        note: note.trim() || undefined,
        debt: debtNum,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : vi.validation.invalidValue);
    } finally {
      setLoading(false);
    }
  };

  const title = isEdit ? vi.customers.editCustomer : vi.customers.addCustomer;
  const primaryLabel = isEdit ? vi.actions.update : vi.actions.add;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {vi.actions.cancel}
          </button>
          <button
            type="submit"
            form="customer-form"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? vi.actions.saving : primaryLabel}
          </button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit}>
        {error && (
          <div className="form-error mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Row 1: name + phone */}
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label
              htmlFor="name"
              className="block text-xs font-medium uppercase tracking-wide text-slate-600"
            >
              {vi.customers.name} <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-xs font-medium uppercase tracking-wide text-slate-600"
            >
              {vi.customers.phone}
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={vi.customers.phonePlaceholder}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Address */}
        <div className="mb-4">
          <label
            htmlFor="address"
            className="block text-xs font-medium uppercase tracking-wide text-slate-600"
          >
            {vi.customers.address}
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành…"
            rows={2}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
        </div>

        {/* Row 3: debt + note */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="debt"
              className="block text-xs font-medium uppercase tracking-wide text-slate-600"
            >
              {isEdit ? vi.customers.debt : `${vi.customers.debt} ban đầu`}
            </label>
            <div className="mt-1 flex items-center rounded-md border border-slate-200 px-2">
              <span className="mr-1 text-xs text-slate-500">₫</span>
              <input
                type="number"
                id="debt"
                value={debt}
                onChange={(e) => setDebt(e.target.value)}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full border-0 bg-transparent px-1 py-1 text-sm outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {isEdit
                ? 'Điều chỉnh công nợ hiện tại nếu cần cập nhật thủ công.'
                : 'Nhập công nợ nếu khách đã nợ trước khi tạo tài khoản.'}
            </p>
            {isEdit && customer && (
              <p className="mt-1 text-[11px] text-slate-500">
                Hiện tại:&nbsp;
                <span className={customer.debt > 0 ? 'font-medium text-rose-600' : 'font-medium'}>
                  {formatCurrency(customer.debt)}
                </span>
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="note"
              className="block text-xs font-medium uppercase tracking-wide text-slate-600"
            >
              {vi.customers.note}
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách quen, thanh toán cuối tháng…"
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

