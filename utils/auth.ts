/**
 * Authentication utilities for PIN-based login
 * Uses SubtleCrypto for secure password hashing
 */

const SALT = 'pos-mvp-pin-salt-v1';

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
