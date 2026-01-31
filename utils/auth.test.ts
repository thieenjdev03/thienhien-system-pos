/**
 * Unit tests for authentication utilities
 * Tests BIN validation, storage, and PIN hashing functions
 */

import { isValidBin, saveBin, getBin, clearBin, isValidPin, hashPin, verifyPin } from './auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('BIN Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isValidBin()', () => {
    test('should accept valid 6-character alphanumeric BIN', () => {
      expect(isValidBin('POS001')).toBe(true);
      expect(isValidBin('ABC123')).toBe(true);
      expect(isValidBin('ABCDEF')).toBe(true);
      expect(isValidBin('123456')).toBe(true);
    });

    test('should accept valid 12-character alphanumeric BIN', () => {
      expect(isValidBin('POS001ABC123')).toBe(true);
      expect(isValidBin('ABCDEF123456')).toBe(true);
    });

    test('should accept valid 7-11 character BINs', () => {
      expect(isValidBin('POS0012')).toBe(true);
      expect(isValidBin('POS00123')).toBe(true);
      expect(isValidBin('POS001234')).toBe(true);
      expect(isValidBin('POS0012345')).toBe(true);
      expect(isValidBin('POS00123456')).toBe(true);
    });

    test('should handle both uppercase and lowercase', () => {
      expect(isValidBin('pos001')).toBe(true);
      expect(isValidBin('Pos001')).toBe(true);
      expect(isValidBin('pOS001')).toBe(true);
    });

    test('should reject BIN shorter than 6 characters', () => {
      expect(isValidBin('POS00')).toBe(false);
      expect(isValidBin('ABC12')).toBe(false);
      expect(isValidBin('ABCDE')).toBe(false);
      expect(isValidBin('')).toBe(false);
    });

    test('should reject BIN longer than 12 characters', () => {
      expect(isValidBin('POS001ABC1234')).toBe(false);
      expect(isValidBin('ABCDEF1234567')).toBe(false);
    });

    test('should reject BIN with special characters', () => {
      expect(isValidBin('POS-001')).toBe(false);
      expect(isValidBin('POS.001')).toBe(false);
      expect(isValidBin('POS_001')).toBe(false);
      expect(isValidBin('POS@001')).toBe(false);
      expect(isValidBin('POS#001')).toBe(false);
    });

    test('should reject BIN with spaces', () => {
      expect(isValidBin('POS 001')).toBe(false);
      expect(isValidBin(' POS001')).toBe(false);
      expect(isValidBin('POS001 ')).toBe(false);
    });

    test('should reject BIN with symbols', () => {
      expect(isValidBin('POS001!')).toBe(false);
      expect(isValidBin('POS001&')).toBe(false);
      expect(isValidBin('POS001*')).toBe(false);
    });
  });

  describe('saveBin()', () => {
    test('should save BIN to localStorage', () => {
      saveBin('POS001');
      expect(localStorage.getItem('pos_device_bin')).toBe('POS001');
    });

    test('should convert BIN to uppercase when saving', () => {
      saveBin('pos001');
      expect(localStorage.getItem('pos_device_bin')).toBe('POS001');
    });

    test('should handle mixed case BIN conversion', () => {
      saveBin('Pos001');
      expect(localStorage.getItem('pos_device_bin')).toBe('POS001');
    });

    test('should overwrite existing BIN', () => {
      saveBin('POS001');
      saveBin('POS002');
      expect(localStorage.getItem('pos_device_bin')).toBe('POS002');
    });

    test('should not throw when called server-side (window undefined)', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(() => {
        saveBin('POS001');
      }).not.toThrow();
      
      global.window = originalWindow;
    });
  });

  describe('getBin()', () => {
    test('should retrieve stored BIN', () => {
      localStorage.setItem('pos_device_bin', 'POS001');
      expect(getBin()).toBe('POS001');
    });

    test('should return null when BIN not stored', () => {
      expect(getBin()).toBeNull();
    });

    test('should return null server-side (window undefined)', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      const result = getBin();
      expect(result).toBeNull();
      
      global.window = originalWindow;
    });

    test('should handle multiple retrieval calls', () => {
      saveBin('POS001');
      expect(getBin()).toBe('POS001');
      expect(getBin()).toBe('POS001');
      expect(getBin()).toBe('POS001');
    });
  });

  describe('clearBin()', () => {
    test('should remove BIN from localStorage', () => {
      saveBin('POS001');
      expect(getBin()).toBe('POS001');
      clearBin();
      expect(getBin()).toBeNull();
    });

    test('should handle clearing when no BIN stored', () => {
      expect(() => {
        clearBin();
      }).not.toThrow();
    });

    test('should not throw when called server-side (window undefined)', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(() => {
        clearBin();
      }).not.toThrow();
      
      global.window = originalWindow;
    });
  });

  describe('saveBin + getBin integration', () => {
    test('should persist and retrieve BIN correctly', () => {
      saveBin('ABC123DEF456');
      expect(getBin()).toBe('ABC123DEF456');
    });

    test('should handle round-trip with case conversion', () => {
      saveBin('abc123def456');
      expect(getBin()).toBe('ABC123DEF456');
    });
  });

  describe('saveBin + clearBin integration', () => {
    test('should clear previously saved BIN', () => {
      saveBin('POS001');
      clearBin();
      expect(getBin()).toBeNull();
    });

    test('should allow re-saving after clear', () => {
      saveBin('POS001');
      clearBin();
      saveBin('POS002');
      expect(getBin()).toBe('POS002');
    });
  });
});

describe('PIN Utilities', () => {
  describe('isValidPin()', () => {
    test('should accept valid 4-digit PIN', () => {
      expect(isValidPin('1234')).toBe(true);
      expect(isValidPin('0000')).toBe(true);
      expect(isValidPin('9999')).toBe(true);
    });

    test('should accept valid 5-digit PIN', () => {
      expect(isValidPin('12345')).toBe(true);
      expect(isValidPin('00000')).toBe(true);
    });

    test('should accept valid 6-digit PIN', () => {
      expect(isValidPin('123456')).toBe(true);
      expect(isValidPin('999999')).toBe(true);
    });

    test('should reject PIN shorter than 4 digits', () => {
      expect(isValidPin('123')).toBe(false);
      expect(isValidPin('12')).toBe(false);
      expect(isValidPin('1')).toBe(false);
      expect(isValidPin('')).toBe(false);
    });

    test('should reject PIN longer than 6 digits', () => {
      expect(isValidPin('1234567')).toBe(false);
      expect(isValidPin('12345678')).toBe(false);
    });

    test('should reject PIN with non-digit characters', () => {
      expect(isValidPin('123a')).toBe(false);
      expect(isValidPin('12-34')).toBe(false);
      expect(isValidPin('123 4')).toBe(false);
      expect(isValidPin('abcd')).toBe(false);
    });
  });

  describe('hashPin()', () => {
    test('should return consistent hash for same PIN', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('1234');
      expect(hash1).toBe(hash2);
    });

    test('should return different hash for different PINs', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('5678');
      expect(hash1).not.toBe(hash2);
    });

    test('should return hex string', async () => {
      const hash = await hashPin('1234');
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    test('should handle various PIN lengths', async () => {
      const hash4 = await hashPin('1234');
      const hash5 = await hashPin('12345');
      const hash6 = await hashPin('123456');
      
      expect(hash4).toBeTruthy();
      expect(hash5).toBeTruthy();
      expect(hash6).toBeTruthy();
      expect(hash4).not.toBe(hash5);
      expect(hash5).not.toBe(hash6);
    });
  });

  describe('verifyPin()', () => {
    test('should verify correct PIN', async () => {
      const pin = '1234';
      const hash = await hashPin(pin);
      const isValid = await verifyPin(pin, hash);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect PIN', async () => {
      const pin = '1234';
      const hash = await hashPin(pin);
      const isValid = await verifyPin('5678', hash);
      expect(isValid).toBe(false);
    });

    test('should handle various PIN lengths', async () => {
      const pin4 = '1234';
      const hash4 = await hashPin(pin4);
      expect(await verifyPin(pin4, hash4)).toBe(true);

      const pin5 = '12345';
      const hash5 = await hashPin(pin5);
      expect(await verifyPin(pin5, hash5)).toBe(true);

      const pin6 = '123456';
      const hash6 = await hashPin(pin6);
      expect(await verifyPin(pin6, hash6)).toBe(true);
    });
  });
});
