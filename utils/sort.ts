/**
 * Sorting utilities with Vietnamese-friendly collation
 */

import type { Product } from '../domain/models';

/**
 * Sort field options
 */
export type SortField = 'name' | 'category' | 'updatedAt';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Vietnamese collator for case-insensitive, locale-aware sorting
 */
const viCollator = new Intl.Collator('vi', { sensitivity: 'base', numeric: true });

/**
 * Compare two strings using Vietnamese collation
 */
function compareStrings(a: string | null | undefined, b: string | null | undefined): number {
  const aStr = a ?? '';
  const bStr = b ?? '';
  return viCollator.compare(aStr, bStr);
}

/**
 * Sort products by the specified field and direction
 * Uses stable sorting with tie-breakers (name, then updatedAt desc)
 */
export function sortProducts(
  products: Product[],
  sortField: SortField,
  sortDir: SortDirection
): Product[] {
  const sorted = [...products]; // Create a copy to avoid mutating original

  sorted.sort((a, b) => {
    let result = 0;

    // Primary sort field
    switch (sortField) {
      case 'name':
        result = compareStrings(a.name, b.name);
        break;

      case 'category':
        // Null/empty categories go to bottom
        const aCat = a.category ?? '';
        const bCat = b.category ?? '';
        if (!aCat && !bCat) {
          result = 0;
        } else if (!aCat) {
          result = 1; // a goes after b
        } else if (!bCat) {
          result = -1; // b goes after a
        } else {
          result = compareStrings(aCat, bCat);
        }
        // If categories are equal, use name as tie-breaker
        if (result === 0) {
          result = compareStrings(a.name, b.name);
        }
        break;

      case 'updatedAt':
        // Numeric comparison for timestamps
        result = (a.updatedAt ?? 0) - (b.updatedAt ?? 0);
        // If updatedAt is equal, use name as tie-breaker
        if (result === 0) {
          result = compareStrings(a.name, b.name);
        }
        break;
    }

    // Apply direction
    if (sortDir === 'desc') {
      result = -result;
    }

    // Final tie-breaker: if still equal, use name (ascending)
    if (result === 0) {
      result = compareStrings(a.name, b.name);
      // If names are also equal, use updatedAt desc as final tie-breaker
      if (result === 0) {
        result = (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      }
    }

    return result;
  });

  return sorted;
}
