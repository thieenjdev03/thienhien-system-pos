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
import { verifyPin } from '@/utils/auth';
import type { AuthSession, User } from '@/domain/models';

const SESSION_KEY = 'pos_auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  hasUsers: boolean | null; // null = not checked yet
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkHasUsers: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);

  // Check for existing session on mount
  useEffect(() => {
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
      const users = await db.users.where('active').equals(1).toArray();

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

  const value = useMemo(
    () => ({
      session,
      isLoading,
      hasUsers,
      login,
      logout,
      checkHasUsers,
    }),
    [session, isLoading, hasUsers, login, logout, checkHasUsers]
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
