/**
 * Authentication utilities for PIN-based login and BIN device identification
 * Uses SubtleCrypto for secure password hashing
 */

const SALT = 'pos-mvp-pin-salt-v1';
const BIN_STORAGE_KEY = 'pos_device_bin';

/**
 * Hash a PIN using SHA-256
 * @param pin - The PIN to hash (4-6 digits)
 * @returns The hashed PIN as a hex string
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a PIN against a hash
 * @param pin - The PIN to verify
 * @param hash - The stored hash to compare against
 * @returns True if the PIN matches the hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const computedHash = await hashPin(pin);
  return computedHash === hash;
}

/**
 * Validate PIN format
 * @param pin - The PIN to validate
 * @returns True if PIN is valid (4-6 digits)
 */
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/**
 * Generate a unique user ID
 * @returns A unique ID string
 */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================
// BIN (Device/POS ID) Utilities
// ============================================

/**
 * Validate BIN format
 * @param bin - The BIN to validate
 * @returns True if BIN is valid (6-12 alphanumeric characters)
 */
export function isValidBin(bin: string): boolean {
  return /^[A-Za-z0-9]{6,12}$/.test(bin);
}

/**
 * Save BIN to localStorage
 * @param bin - The BIN to save (will be uppercase)
 */
export function saveBin(bin: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(BIN_STORAGE_KEY, bin.toUpperCase());
  }
}

/**
 * Retrieve BIN from localStorage
 * @returns The stored BIN or null if not set
 */
export function getBin(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BIN_STORAGE_KEY);
}

/**
 * Clear BIN from localStorage
 */
export function clearBin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BIN_STORAGE_KEY);
  }
}
