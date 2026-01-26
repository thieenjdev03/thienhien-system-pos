"use client";
import Link from 'next/link';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from './Button';

export default function Navbar() {
  const { session, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <Link href="/" className="text-xl font-bold text-blue-600">POS</Link>
      </div>
      <div className="flex items-center gap-4">
        <Button href="/invoices" variant="ghost">Hóa đơn</Button>
        {session && (
          <>
            <span className="text-sm text-slate-500">
              {session.displayName}
            </span>
            <Button onClick={handleLogout} variant="ghost">
              Đăng xuất
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
