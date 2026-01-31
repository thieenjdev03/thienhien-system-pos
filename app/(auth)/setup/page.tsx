"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hashPin, isValidPin, generateUserId } from '@/utils/auth';
import { db } from '@/db';
import type { User } from '@/domain/models';

type SetupStep = 'enter' | 'confirm';

export default function SetupPage() {
  const router = useRouter();
  const { isLoading, checkHasUsers, hasUsers, hasBin } = useAuth();
  const [step, setStep] = useState<SetupStep>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect to BIN setup if no BIN configured
  useEffect(() => {
    if (!isLoading && hasBin === false) {
      router.push('/bin-setup');
    }
  }, [isLoading, hasBin, router]);

  // Redirect to login if users already exist
  useEffect(() => {
    if (!isLoading && hasBin === true) {
      checkHasUsers().then((exists) => {
        if (exists) {
          router.push('/login');
        }
      });
    }
  }, [isLoading, hasBin, checkHasUsers, router]);

  const currentPin = step === 'enter' ? pin : confirmPin;
  const setCurrentPin = step === 'enter' ? setPin : setConfirmPin;

  const handleNumberClick = useCallback((num: string) => {
    if (currentPin.length < 6) {
      setCurrentPin(prev => prev + num);
      setError('');
    }
  }, [currentPin.length, setCurrentPin]);

  const handleBackspace = useCallback(() => {
    setCurrentPin(prev => prev.slice(0, -1));
    setError('');
  }, [setCurrentPin]);

  const handleClear = useCallback(() => {
    setCurrentPin('');
    setError('');
  }, [setCurrentPin]);

  const handleNext = useCallback(() => {
    if (!isValidPin(pin)) {
      setError('Mã PIN phải từ 4-6 chữ số.');
      return;
    }
    setStep('confirm');
    setError('');
  }, [pin]);

  const handleBack = useCallback(() => {
    setStep('enter');
    setConfirmPin('');
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValidPin(confirmPin)) {
      setError('Mã PIN phải từ 4-6 chữ số.');
      return;
    }

    if (pin !== confirmPin) {
      setError('Mã PIN không khớp. Vui lòng thử lại.');
      setConfirmPin('');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const pinHash = await hashPin(pin);
      const now = Date.now();
      const user: User = {
        id: generateUserId(),
        pinHash,
        displayName: 'Admin',
        role: 'admin',
        active: true,
        createdAt: now,
        updatedAt: now,
      };

      await db.users.add(user);
      router.push('/login');
    } catch (err) {
      console.error('Setup error:', err);
      setError('Đã xảy ra lỗi khi tạo tài khoản.');
      setSubmitting(false);
    }
  }, [pin, confirmPin, router]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitting) return;

      if (/^\d$/.test(e.key)) {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter' && currentPin.length >= 4) {
        if (step === 'enter') {
          handleNext();
        } else {
          handleSubmit();
        }
      } else if (e.key === 'Escape') {
        if (step === 'confirm') {
          handleBack();
        } else {
          handleClear();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPin.length, step, submitting, handleNumberClick, handleBackspace, handleNext, handleSubmit, handleBack, handleClear]);

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
      <h2 className="mb-2 text-center text-lg font-semibold text-slate-700">
        Thiết lập tài khoản
      </h2>
      <p className="mb-6 text-center text-sm text-slate-500">
        {step === 'enter'
          ? 'Tạo mã PIN để bảo vệ ứng dụng'
          : 'Nhập lại mã PIN để xác nhận'}
      </p>

      {/* PIN Display */}
      <div className="mb-6">
        <div className="flex justify-center gap-2 mb-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                i < currentPin.length
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              {i < currentPin.length ? '•' : ''}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500">
          {step === 'enter' ? 'Nhập mã PIN mới (4-6 số)' : 'Xác nhận mã PIN'}
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
            disabled={submitting || currentPin.length >= 6}
            className="h-14 rounded-lg bg-slate-100 text-xl font-semibold text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 transition-colors"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          disabled={submitting || currentPin.length === 0}
          className="h-14 rounded-lg bg-slate-100 text-sm font-medium text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 transition-colors"
        >
          Xoá
        </button>
        <button
          type="button"
          onClick={() => handleNumberClick('0')}
          disabled={submitting || currentPin.length >= 6}
          className="h-14 rounded-lg bg-slate-100 text-xl font-semibold text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 transition-colors"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          disabled={submitting || currentPin.length === 0}
          className="h-14 rounded-lg bg-slate-100 text-xl font-medium text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 transition-colors"
        >
          ←
        </button>
      </div>

      {/* Action Buttons */}
      {step === 'enter' ? (
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting || pin.length < 4}
          className="w-full h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Tiếp tục
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={submitting}
            className="flex-1 h-12 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 active:bg-slate-400 disabled:opacity-50 transition-colors"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || confirmPin.length < 4}
            className="flex-1 h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Đang tạo...' : 'Hoàn tất'}
          </button>
        </div>
      )}
    </div>
  );
}
