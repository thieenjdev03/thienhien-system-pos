/**
 * Convert number to Vietnamese words
 * Used for invoice total in words (Thành tiền viết bằng chữ)
 */

const UNITS = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const TENS_SPECIAL = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];

/**
 * Read a 3-digit group (0-999)
 */
function readGroup(num: number, showZeroHundred: boolean): string {
  if (num === 0) return '';

  const hundred = Math.floor(num / 100);
  const ten = Math.floor((num % 100) / 10);
  const unit = num % 10;

  let result = '';

  // Hundred
  if (hundred > 0) {
    result += UNITS[hundred] + ' trăm';
  } else if (showZeroHundred && (ten > 0 || unit > 0)) {
    result += 'không trăm';
  }

  // Ten
  if (ten > 0) {
    result += (result ? ' ' : '') + TENS_SPECIAL[ten];
  } else if (hundred > 0 && unit > 0) {
    result += ' lẻ';
  }

  // Unit
  if (unit > 0) {
    if (ten > 1 && unit === 1) {
      result += ' mốt';
    } else if (ten >= 1 && unit === 5) {
      result += ' lăm';
    } else if (ten > 0 && unit === 4) {
      result += ' tư';
    } else {
      result += (result && ten === 0 ? ' ' : ' ') + UNITS[unit];
    }
  }

  return result.trim();
}

/**
 * Convert number to Vietnamese words
 * @param num - Number to convert (max ~999 trillion)
 * @returns Vietnamese words representation
 */
export function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'không';
  if (num < 0) return 'âm ' + numberToVietnameseWords(-num);

  // Round to integer
  num = Math.round(num);

  const groups: { value: number; name: string }[] = [
    { value: 1_000_000_000_000, name: 'nghìn tỷ' },
    { value: 1_000_000_000, name: 'tỷ' },
    { value: 1_000_000, name: 'triệu' },
    { value: 1_000, name: 'nghìn' },
    { value: 1, name: '' },
  ];

  const parts: string[] = [];
  let remaining = num;
  let isFirstGroup = true;

  for (const group of groups) {
    const groupValue = Math.floor(remaining / group.value);
    remaining = remaining % group.value;

    if (groupValue > 0) {
      const groupText = readGroup(groupValue, !isFirstGroup);
      if (group.name) {
        parts.push(`${groupText} ${group.name}`);
      } else {
        parts.push(groupText);
      }
      isFirstGroup = false;
    }
  }

  // Capitalize first letter
  const result = parts.join(' ').trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Format number to Vietnamese words with currency suffix
 * @param num - Amount in VND
 * @returns e.g. "Một triệu hai trăm nghìn đồng"
 */
export function formatAmountInWords(num: number): string {
  if (num === 0) return 'Không đồng';
  return numberToVietnameseWords(num) + ' đồng';
}
