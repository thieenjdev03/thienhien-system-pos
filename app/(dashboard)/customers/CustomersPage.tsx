'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { CustomerForm } from './CustomerForm';
import { vi } from '@/shared/i18n/vi';
import type { Customer, CustomerInput } from '@/domain/models';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [customers, setCustomers] = useState<Customer[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Khách hàng - POS Thiện Hiền';
  }, []);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('search', search.trim());
      }
      params.set('limit', '500');

      const res = await fetch(`/api/customers?${params.toString()}`, {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch customers (${res.status})`);
      }

      const json = await res.json();
      const apiCustomers = (json?.data ?? []) as any[];

      const mapped: Customer[] = apiCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone ?? undefined,
        address: c.address ?? undefined,
        note: c.note ?? undefined,
        debt: Number(c.debt ?? 0),
        createdAt: new Date(c.createdAt).getTime(),
        updatedAt: new Date(c.updatedAt).getTime(),
      }));

      setCustomers(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : vi.validation.invalidValue);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAdd = () => {
    setEditingCustomer(undefined);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleSave = async (data: CustomerInput) => {
    if (editingCustomer) {
      await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          address: data.address,
          note: data.note,
          debt: data.debt ?? 0,
        }),
      });
    } else {
      await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          address: data.address,
          note: data.note,
          debt: data.debt ?? 0,
        }),
      });
    }

    await fetchCustomers();
    setShowForm(false);
    setEditingCustomer(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(undefined);
  };

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(vi.customers.confirmDelete)) {
      await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      });
      await fetchCustomers();
    }
  };

  return (
    <div className="page customers-page">
      <div className="page-header">
        <h2>{vi.customers.title}</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + {vi.customers.addCustomer}
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder={vi.customers.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>{vi.customers.name}</th>
            <th>{vi.customers.phone}</th>
            <th>{vi.customers.address}</th>
            <th>{vi.customers.debt}</th>
            <th>{vi.customers.note}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {!customers || customers.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-row">
                {search ? vi.customers.emptySearch : vi.customers.emptyState}
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.phone || '-'}</td>
                <td className="text-truncate">{customer.address || '-'}</td>
                <td className={customer.debt > 0 ? 'text-danger' : ''}>
                  {formatCurrency(customer.debt)}
                </td>
                <td className="text-truncate">{customer.note || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(customer)}
                    >
                      {vi.actions.edit}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(customer)}
                    >
                      {vi.actions.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <CustomerForm
        isOpen={showForm}
        customer={editingCustomer}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
