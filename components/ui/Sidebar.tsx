"use client";
import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname() || '/';

  const linkClass = (path: string) =>
    cn(
      'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
      pathname === path
        ? 'bg-blue-600 text-white'
        : 'text-slate-700 hover:bg-slate-100'
    );

  return (
    <nav className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 px-4">
        <span className="text-xl font-bold text-blue-600">CTY TNHH Thiện Hiền </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          <li>
            <Link href="/" className={linkClass('/')}>Dashboard</Link>
          </li>
          <li>
            <Link href="/customers" className={linkClass('/customers')}>Khách hàng</Link>
          </li>
          <li>
            <Link href="/products" className={linkClass('/products')}>Sản phẩm</Link>
          </li>
          <li>
            <Link href="/invoices" className={linkClass('/invoices')}>Hóa đơn</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
