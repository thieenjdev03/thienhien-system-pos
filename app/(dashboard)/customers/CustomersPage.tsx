"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { customerRepo } from '@/repos/customerRepo';
import { formatCurrency } from '@/utils/formatters';
import { CustomerForm } from './CustomerForm';
import { vi } from '@/shared/i18n/vi';
import type { Customer, CustomerInput } from '@/domain/models';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  // Live query for customers - reacts to DB changes
  const customers = useLiveQuery(async () => {
    const term = search.trim().toLowerCase();
    if (term) {
      const all = await db.customers.orderBy('createdAt').reverse().toArray();
      return all.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
      );
    }
    return db.customers.orderBy('createdAt').reverse().toArray();
  }, [search]);

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
      await customerRepo.update(editingCustomer.id, data);
    } else {
      await customerRepo.create(data);
    }
    setShowForm(false);
    setEditingCustomer(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(undefined);
  };

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(vi.customers.confirmDelete)) {
      await customerRepo.delete(customer.id);
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
