"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { invoiceRepo, type InvoiceWithItems } from '@/repos/invoiceRepo';
import { customerRepo } from '@/repos/customerRepo';
import type { Customer } from '@/domain/models';
import { PrintableInvoice, mapInvoiceItemsToPrintableLines } from '@/components/PrintableInvoice';

const VIETQR_BANK_CODE =
  process.env.NEXT_PUBLIC_VIETQR_BANK_CODE || 'VCB';
const VIETQR_BANK_ACCOUNT =
  process.env.NEXT_PUBLIC_VIETQR_BANK_ACCOUNT || '0123456789';
const VIETQR_ACCOUNT_NAME =
  process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || 'TEN CUA HANG';

function buildVietQrUrl(opts: {
  bankCode: string;
  bankAccount: string;
  bankAccountName: string;
  amount: number;
  addInfo: string;
}) {
  const { bankCode, bankAccount, bankAccountName, amount, addInfo } = opts;
  const template = 'qr_only';
  const base = `https://img.vietqr.io/image/${encodeURIComponent(
    bankCode,
  )}-${encodeURIComponent(bankAccount)}-${template}.png`;
  const params = new URLSearchParams({
    amount: Math.max(0, Math.round(amount)).toString(),
    addInfo,
    accountName: bankAccountName,
  });
  return `${base}?${params.toString()}`;
}

export default function InvoicePrintPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const inv = await invoiceRepo.getById(id);
      if (!inv) return;
      setInvoice(inv);

      if (inv.customerId) {
        const cust = await customerRepo.getById(inv.customerId);
        setCustomer(cust ?? null);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (invoice) {
      document.title = `In hóa đơn ${invoice.invoiceNo} - POS Thiện Hiền`;
    }
  }, [invoice]);

  useEffect(() => {
    if (!invoice) return;

    const timeoutId = setTimeout(() => {
      window.print();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [invoice]);

  const lines = useMemo(
    () => (invoice ? mapInvoiceItemsToPrintableLines(invoice.items) : []),
    [invoice],
  );

  const qrValue = useMemo(() => {
    if (!invoice) return null;
    const addInfo = invoice.invoiceNo || invoice.id;
    return buildVietQrUrl({
      bankCode: VIETQR_BANK_CODE,
      bankAccount: VIETQR_BANK_ACCOUNT,
      bankAccountName: VIETQR_ACCOUNT_NAME,
      amount: invoice.total,
      addInfo,
    });
  }, [invoice]);

  if (!invoice) {
    return null;
  }

  return (
    <PrintableInvoice
      storeName="CTY TNHH Thiện Hiền"
      storeAddress="738/20/5a Quốc Lộ 1a, Bình Hưng Hòa B, Bình Tân, Tp.HCM"
      storePhone="0947111191 - 0903695110 - 0942959688"
      storeTaxCode={undefined}
      createdAt={invoice.createdAt}
      cashierName={null}
      paymentMethodLabel={null}
      invoiceNo={invoice.invoiceNo}
      customer={customer}
      lines={lines}
      subtotal={invoice.subtotal}
      discount={invoice.discount}
      total={invoice.total}
      paid={invoice.paid}
      change={invoice.change}
      qrValue={qrValue || undefined}
    />
  );
}

