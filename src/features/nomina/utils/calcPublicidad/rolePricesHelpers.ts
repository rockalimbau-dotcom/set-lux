import { ROLE_CODES_WITH_PR_SUFFIX } from '@shared/constants/roles';

/**
 * Parse number from various formats
 */
export function num(v: unknown): number {
  if (v == null || v === '') return 0;
  const s = String(v)
    .trim()
    .replace(/\u00A0/g, '')
    .replace(/[€%]/g, '')
    .replace(/\s+/g, '');
  const t =
    s.includes(',') && s.includes('.')
      ? s.replace(/\./g, '').replace(',', '.')
      : s.replace(',', '.');
  const n = Number(t);
  return isFinite(n) ? n : 0;
}

/**
 * Normalize string for comparison (remove accents, lowercase, remove P/R suffix)
 */
function normalizeStr(s: unknown): string {
  const raw = String(s == null ? '' : s);
  const upper = raw.toUpperCase();
  const withoutSuffix = ROLE_CODES_WITH_PR_SUFFIX.has(upper) ? raw : raw.replace(/[PR]$/i, '');
  return withoutSuffix
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find price row by candidate role names
 */
export function findPriceRow(priceRows: any, candidates: string[]) {
  // 1) Exactos primero
  for (const cand of candidates) {
    if (cand && priceRows[cand]) return { row: priceRows[cand], key: cand };
  }
  // 2) Match insensible a acentos/mayúsculas/sufijo P/R
  const candNorms = candidates.map(c => normalizeStr(c));
  for (const key of Object.keys(priceRows)) {
    const keyNorm = normalizeStr(key);
    for (const candNorm of candNorms) {
      if (keyNorm === candNorm) return { row: priceRows[key], key };
    }
  }
  return { row: {}, key: '' };
}

/**
 * Get numeric field from row using multiple candidate keys
 */
export function getNumField(row: any, candidates: readonly string[]): number {
  // 1) Directo
  for (const cand of candidates) {
    if (cand && row[cand] != null) {
      const val = num(row[cand]);
      if (val > 0) return val;
    }
  }
  // 2) Insensible a acentos/mayúsculas
  const candNorms = candidates.map(c => normalizeStr(c));
  for (const key of Object.keys(row)) {
    const keyNorm = normalizeStr(key);
    for (const candNorm of candNorms) {
      if (keyNorm === candNorm) {
        const val = num(row[key]);
        if (val > 0) return val;
      }
    }
  }
  return 0;
}

