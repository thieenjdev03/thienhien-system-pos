import Link from 'next/link';
import { useEffect } from 'react';
import { Globe } from '@/components/ui/globe';
import { vi } from '@/shared/i18n/vi';

export default function Home() {
  useEffect(() => {
    document.title = 'Dashboard - POS Thiện Hiền';
  }, []);

  return (
      <div className="page">
      <h2>{vi.dashboard}</h2>
      <p>{vi.welcome}</p>

      <div className="relative my-8 overflow-hidden rounded-xl border bg-white">
        <div className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_320px] lg:items-center">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-600">Magic UI Demo</p>
            <h3 className="text-xl font-semibold text-slate-900">
              Quick integration with the Magic UI library
            </h3>
            <p className="text-sm text-slate-600">
              Interactive Globe added via shadcn/magic-ui CLI. Drag to rotate, scroll to zoom.
            </p>
            <div className="text-xs text-slate-500">
              Source: <code>@magicui/globe</code>
            </div>
          </div>
          <div className="relative aspect-4/3">
            <Globe className="top-4" />
          </div>
        </div>
      </div>

      <div className="quick-links">
        <h3>{vi.quickActions}</h3>
        <ul>
            <li>
              <Link href="/invoices/new">+ {vi.invoices.newInvoice}</Link>
            </li>
          <li>
              <Link href="/products">{vi.nav.products}</Link>
          </li>
          <li>
              <Link href="/customers">{vi.nav.customers}</Link>
          </li>
          <li>
              <Link href="/invoices">{vi.nav.invoices}</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
