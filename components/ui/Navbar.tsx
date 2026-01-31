"use client";
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from './Button';

export default function Navbar() {
  const { session, logout, bin } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <Button href="/invoices" variant="ghost">Hóa đơn</Button>
      </div>
      <div className="flex items-center gap-4">
        {session && (
          <>
            {bin && (
              <span className="px-2 py-1 text-xs font-mono bg-slate-100 text-slate-600 rounded">
                {bin}
              </span>
            )}
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
