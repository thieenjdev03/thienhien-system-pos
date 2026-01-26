"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BackupPanel } from './BackupPanel';
import { vi } from '../shared/i18n/vi';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname() || '/';

  const navClass = (path: string) =>
    cn(
      'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-500 no-underline transition-colors hover:bg-slate-100 hover:text-slate-900',
      pathname === path && 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
    );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 flex items-center gap-6 border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="m-0 text-xl font-bold text-blue-600">{vi.appName}</h1>
        <nav className="flex flex-1 gap-2">
          <Link href="/" className={navClass('/')}>{vi.nav.home}</Link>
          <Link href="/products" className={navClass('/products')}>{vi.nav.products}</Link>
          <Link href="/customers" className={navClass('/customers')}>{vi.nav.customers}</Link>
          <Link href="/invoices" className={navClass('/invoices')}>{vi.nav.invoices}</Link>
        </nav>
        <BackupPanel />
      </header>
      <main className="mx-auto flex-1 w-full max-w-5xl px-6 py-6">{children}</main>
    </div>
  );
}
