"use client";

import { useState, useEffect } from 'react';
import type { Customer, CustomerInput } from '@/domain/models';
import { vi } from '@/shared/i18n/vi';
import { Modal } from '@/components/Modal';

interface CustomerFormProps {
  isOpen: boolean;
  customer?: Customer; // undefined = create mode, defined = edit mode
  onSave: (data: CustomerInput) => Promise<void>;
  onCancel: () => void;
}

export function CustomerForm({ isOpen, customer, onSave, onCancel }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [note, setNote] = useState(customer?.note ?? '');
  const [debt, setDebt] = useState(customer?.debt?.toString() ?? '0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!customer;

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone ?? '');
      setAddress(customer.address ?? '');
      setNote(customer.note ?? '');
      setDebt(customer.debt?.toString() ?? '0');
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!name.trim()) {
      setError(vi.validation.nameRequired);
      return;
    }

    const debtNum = parseFloat(debt) || 0;
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={isEdit ? vi.customers.editCustomer : vi.customers.addCustomer}
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
            {loading ? vi.actions.saving : isEdit ? vi.actions.update : vi.actions.add}
          </button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">{vi.customers.name} *</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Nhập ${vi.customers.name.toLowerCase()}`}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">{vi.customers.phone}</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={vi.customers.phonePlaceholder}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">{vi.customers.address}</label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={`Nhập ${vi.customers.address.toLowerCase()}`}
            rows={2}
          />
        </div>

        <div className="form-group">
          <label htmlFor="debt">{vi.customers.debt}</label>
          <input
            type="number"
            id="debt"
            value={debt}
            onChange={(e) => setDebt(e.target.value)}
            placeholder="0"
            min="0"
            step="1000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="note">{vi.customers.note}</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Nhập ${vi.customers.note.toLowerCase()}`}
            rows={2}
          />
        </div>
      </form>
    </Modal>
  );
}
