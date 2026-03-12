\"use client\";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isValidPin } from '@/utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, session, checkHasUsers, hasUsers, hasBin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect to BIN setup if no BIN configured
  useEffect(() => {
    if (!isLoading && hasBin === false) {
      router.push('/bin-setup');
    }
  }, [isLoading, hasBin, router]);

  // Check if users exist, redirect to setup if not
  useEffect(() => {
    if (!isLoading && hasBin === true) {
      checkHasUsers().then((exists) => {
        if (!exists) {
          router.push('/setup');
        }
      });
    }
  }, [isLoading, hasBin, checkHasUsers, router]);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && session) {
      router.push('/');
    }
  }, [isLoading, session, router]);

  const handleNumberClick = useCallback((num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  }, [pin.length]);

  const handleBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValidPin(pin)) {
      setError('Mã PIN phải từ 4-6 chữ số.');
      return;
    }

    setSubmitting(true);
    setError('');

    const result = await login(pin);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Đăng nhập thất bại.');
      setPin('');
    }
    setSubmitting(false);
  }, [pin, login, router]);

  useEffect(() => {
    document.title = 'Đăng nhập - POS Thiện Hiền';
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitting) return;

      if (/^\d$/.test(e.key)) {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter' && pin.length >= 4) {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin.length, submitting, handleNumberClick, handleBackspace, handleSubmit, handleClear]);

  if (isLoading || hasBin === null || hasUsers === null) {
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
      <h2 className="mb-6 text-center text-lg font-semibold text-slate-700">
        Đăng nhập
      </h2>

      {/* PIN Display */}
      <div className="mb-6">
        <div className="flex justify-center gap-2 mb-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                i < pin.length
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              {i < pin.length ? '•' : ''}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500">
          Nhập mã PIN (4-6 số)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleNumberClick(num)}
            disabled={submitting || pin.length >= 6}
            className="h-14 rounded-lg bg-slate-100 text-xl font-semibold text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 transition-colors"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          disabled={submitting || pin.length === 0}
          className="h-14 rounded-lg bg-slate-100 text-sm font-medium text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 transition-colors"
        >
          Xoá
        </button>
        <button
          type="button"
          onClick={() => handleNumberClick('0')}
          disabled={submitting || pin.length >= 6}
          className="h-14 rounded-lg bg-slate-100 text-xl font-semibold text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 transition-colors"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          disabled={submitting || pin.length === 0}
          className="h-14 rounded-lg bg-slate-100 text-xl font-medium text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 transition-colors"
        >
          ←
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || pin.length < 4}
        className="w-full h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </div>
  );
}
