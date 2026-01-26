import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatCurrency } from '../utils/formatters';
import { vi } from '../shared/i18n/vi';
import { cn } from '@/lib/utils';
import type { Customer } from '../domain/models';

interface CustomerSelectProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
}

export function CustomerSelect({ value, onChange }: CustomerSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live query for customers filtered by search
  const customers = useLiveQuery(async () => {
    const term = search.trim().toLowerCase();
    if (term) {
      const all = await db.customers.toArray();
      return all.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
      );
    }
    return db.customers.orderBy('name').toArray();
  }, [search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: Customer | null) => {
    onChange(customer);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange(null);
    setSearch('');
  };

  // If a customer is selected, show their info
  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-100 px-3 py-2">
        <div>
          <span className="font-medium">{value.name}</span>
          {value.phone && <span className="text-slate-400"> - {value.phone}</span>}
          {value.debt > 0 && (
            <span className="block text-sm text-red-600">
              {vi.customers.debt}: {formatCurrency(value.debt)}
            </span>
          )}
        </div>
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-transparent bg-transparent text-lg leading-none text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
          onClick={handleClear}
          title={vi.actions.clear}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-blue-600"
        placeholder={vi.customers.searchPlaceholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 max-h-[250px] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          <div
            className="flex cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-2 hover:bg-slate-50"
            onClick={() => handleSelect(null)}
          >
            <strong>{vi.customers.walkIn}</strong>
            <span className="text-slate-400"> ({vi.customers.walkInDescription})</span>
          </div>

          {customers && customers.length > 0 ? (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="flex cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-2 hover:bg-slate-50"
                onClick={() => handleSelect(customer)}
              >
                <div>
                  <strong>{customer.name}</strong>
                  {customer.phone && (
                    <span className="text-slate-400"> - {customer.phone}</span>
                  )}
                </div>
                {customer.debt > 0 && (
                  <span className="text-sm text-red-600">
                    {vi.customers.debt}: {formatCurrency(customer.debt)}
                  </span>
                )}
              </div>
            ))
          ) : (
            search && (
              <div className="px-3 py-2 text-slate-400">
                {vi.customers.emptySearch}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
