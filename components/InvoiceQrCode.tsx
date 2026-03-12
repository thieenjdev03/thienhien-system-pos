import React from 'react';
import QRCode from 'react-qr-code';

interface InvoiceQrCodeProps {
  value: string;
  label?: string;
  size?: number;
}

export function InvoiceQrCode({ value, label, size = 128 }: InvoiceQrCodeProps) {
  if (!value) return null;

  const isUrl = value.startsWith('http://') || value.startsWith('https://');

  return (
    <div className="print-invoice__qr">
      {isUrl ? (
        <img
          src={value}
          alt={label || 'QR code'}
          style={{ width: size, height: size }}
        />
      ) : (
        <QRCode value={value} size={size} />
      )}
      {label && <div className="print-invoice__qr-caption">{label}</div>}
    </div>
  );
}

