"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { db } from '@/db';
import { verifyPin, getBin, saveBin } from '@/utils/auth';
import type { AuthSession } from '@/domain/models';

const SESSION_KEY = 'pos_auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  hasUsers: boolean | null; // null = not checked yet
  bin: string | null; // device BIN
  hasBin: boolean | null; // null = checking, true/false
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkHasUsers: () => Promise<boolean>;
  setBinValue: (bin: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [bin, setBin] = useState<string | null>(null);
  const [hasBin, setHasBin] = useState<boolean | null>(null);

  // Check for existing session and BIN on mount
  useEffect(() => {
    // Check session
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthSession;
        if (parsed.expiresAt > Date.now()) {
          setSession(parsed);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    // Check BIN
    const storedBin = getBin();
    if (storedBin) {
      setBin(storedBin);
      setHasBin(true);
    } else {
      setHasBin(false);
    }

    setIsLoading(false);
  }, []);

  // Check if any users exist in the database
  const checkHasUsers = useCallback(async (): Promise<boolean> => {
    const count = await db.users.count();
    const result = count > 0;
    setHasUsers(result);
    return result;
  }, []);

  // Login with PIN
  const login = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Find active users and check PIN
      const users = await db.users.toArray();

      if (users.length === 0) {
        return { success: false, error: 'Không tìm thấy tài khoản.' };
      }

      // Check PIN against all active users
      for (const user of users) {
        const isValid = await verifyPin(pin, user.pinHash);
        if (isValid) {
          const newSession: AuthSession = {
            userId: user.id,
            displayName: user.displayName,
            role: user.role,
            expiresAt: Date.now() + SESSION_DURATION,
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
          setSession(newSession);
          return { success: true };
        }
      }

      return { success: false, error: 'Mã PIN không đúng.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Đã xảy ra lỗi khi đăng nhập.' };
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  // Set BIN value
  const setBinValue = useCallback((newBin: string) => {
    saveBin(newBin);
    setBin(newBin.toUpperCase());
    setHasBin(true);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      hasUsers,
      bin,
      hasBin,
      login,
      logout,
      checkHasUsers,
      setBinValue,
    }),
    [session, isLoading, hasUsers, bin, hasBin, login, logout, checkHasUsers, setBinValue]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
