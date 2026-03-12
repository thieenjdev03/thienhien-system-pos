interface VietQrOptions {
  bankCode: string;
  bankAccount: string;
  bankAccountName: string;
  amount: number;
  addInfo: string;
}

export function buildVietQrUrl(opts: VietQrOptions) {
  const { bankCode, bankAccount, bankAccountName, amount, addInfo } = opts;
  const template = 'compact2';
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

