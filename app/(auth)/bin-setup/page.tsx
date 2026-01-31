"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isValidBin } from '@/utils/auth';

export default function BinSetupPage() {
  const router = useRouter();
  const { hasBin, setBinValue, isLoading, checkHasUsers } = useAuth();
  const [bin, setBin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if BIN already set
  useEffect(() => {
    if (!isLoading && hasBin === true) {
      checkHasUsers().then((exists) => {
        router.push(exists ? '/login' : '/setup');
      });
    }
  }, [isLoading, hasBin, router, checkHasUsers]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = bin.trim();

    if (!isValidBin(trimmed)) {
      setError('Mã BIN phải từ 6-12 ký tự chữ hoặc số.');
      return;
    }

    setSubmitting(true);
    setBinValue(trimmed);
    const exists = await checkHasUsers();
    router.push(exists ? '/login' : '/setup');
  }, [bin, setBinValue, checkHasUsers, router]);

  if (isLoading || hasBin === null) {
    return (
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg text-center">
        <div className="text-slate-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-center text-2xl font-bold text-blue-600">
        Quản lý bán hàng
      </h1>
      <h2 className="mb-2 text-center text-lg font-semibold text-slate-700">
        Thiết lập thiết bị
      </h2>
      <p className="mb-6 text-center text-sm text-slate-500">
        Nhập mã định danh (BIN) cho máy POS này
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={bin}
          onChange={(e) => { setBin(e.target.value.toUpperCase()); setError(''); }}
          placeholder="VD: POS001"
          maxLength={12}
          className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 text-lg font-mono uppercase focus:border-blue-500 focus:outline-none transition-colors"
          autoFocus
        />

        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || bin.length < 6}
          className="mt-4 w-full h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Đang lưu...' : 'Tiếp tục'}
        </button>
      </form>
    </div>
  );
}
