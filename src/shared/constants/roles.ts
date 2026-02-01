// src/shared/constants/roles.ts

type RoleCode =
  | 'G'
  | 'BB'
  | 'RG'
  | 'RBB'
  | 'RE'
  | 'E'
  | 'TM'
  | 'FB'
  | 'AUX'
  | 'M'
  | 'TG'
  | 'CE'
  | 'EPO'
  | 'TP'
  | 'RIG'
  | 'REF';

interface Role {
  code: RoleCode;
  label: string;
}

interface RoleColor {
  bg: string;
  fg: string;
}

export const ROLE_ORDER: RoleCode[] = [
  'G',
  'BB',
  'E',
  'TM',
  'FB',
  'AUX',
  'M',
  'RG',
  'RBB',
  'RE',
  'TG',
  'CE',
  'EPO',
  'TP',
  'RIG',
  'REF',
];

export const ROLES: Role[] = [
  { code: 'G', label: 'Gaffer' },
  { code: 'BB', label: 'Best Boy Electric' },
  { code: 'E', label: 'Eléctrico/a' },
  { code: 'TM', label: 'Técnico de mesa' },
  { code: 'FB', label: 'Finger Boy' },
  { code: 'AUX', label: 'Auxiliar electric@' },
  { code: 'M', label: 'Meritorio' },
  { code: 'RG', label: 'Rigging Gaffer' },
  { code: 'RBB', label: 'Rigging Best Boy' },
  { code: 'RE', label: 'Rigging Eléctrico' },
  { code: 'TG', label: 'Grupista eléctrico' },
  { code: 'CE', label: 'Chofer eléctrico' },
  { code: 'EPO', label: 'Eléctrico de potencia' },
  { code: 'TP', label: 'Técnico de prácticos' },
  { code: 'REF', label: 'Refuerzo Eléctrico' },
];

export const ROLE_COLORS: Record<RoleCode, RoleColor> = {
  G: { bg: 'linear-gradient(135deg,#7DD3FC,#0284C7)', fg: '#0b0b0b' },
  BB: { bg: 'linear-gradient(135deg,#93C5FD,#0476D9)', fg: '#0b0b0b' },
  RG: { bg: 'linear-gradient(135deg,#F9A8D4,#DB2777)', fg: '#0b0b0b' },
  RBB: { bg: 'linear-gradient(135deg,#A5B4FC,#4F46E5)', fg: '#0b0b0b' },
  RE: { bg: 'linear-gradient(135deg,#FDE047,#F59E0B)', fg: '#0b0b0b' },
  E: { bg: 'linear-gradient(135deg,#FDE047,#F59E0B)', fg: '#0b0b0b' },
  TM: { bg: 'linear-gradient(135deg,#A7F3D0,#10B981)', fg: '#0b0b0b' },
  FB: { bg: 'linear-gradient(135deg,#FCA5A5,#EF4444)', fg: '#0b0b0b' },
  AUX: { bg: 'linear-gradient(135deg,#E9D5FF,#7C3AED)', fg: '#0b0b0b' },
  M: { bg: 'linear-gradient(135deg,#FDE68A,#D97706)', fg: '#0b0b0b' },
  TG: { bg: 'linear-gradient(135deg,#6EE7B7,#10B981)', fg: '#0b0b0b' },
  CE: { bg: 'linear-gradient(135deg,#FCA5A5,#EF4444)', fg: '#0b0b0b' },
  EPO: { bg: 'linear-gradient(135deg,#FDBA74,#EA580C)', fg: '#0b0b0b' },
  TP: { bg: 'linear-gradient(135deg,#C4B5FD,#7C3AED)', fg: '#0b0b0b' },
  REF: { bg: 'linear-gradient(135deg,#C7D2FE,#4338CA)', fg: '#0b0b0b' },
  RIG: { bg: 'linear-gradient(135deg,#FDE047,#F59E0B)', fg: '#0b0b0b' },
};

export const roleRank = (r: string): number => {
  const i = ROLE_ORDER.indexOf(r as RoleCode);
  return i === -1 ? 999 : i;
};

// Útil si lo necesitas en Nómina (mapear códigos -> etiquetas)
export const ROLE_CODE_TO_LABEL: Record<RoleCode, string> = {
  G: 'Gaffer',
  BB: 'Best boy',
  RG: 'Rigging Gaffer',
  RBB: 'Rigging Best Boy',
  RE: 'Rigging Eléctrico',
  E: 'Eléctrico',
  AUX: 'Auxiliar',
  M: 'Meritorio',
  TM: 'Técnico de mesa',
  FB: 'Finger boy',
  TG: 'Grupista eléctrico',
  CE: 'Chofer eléctrico',
  EPO: 'Eléctrico de potencia',
  TP: 'Técnico de prácticos',
  REF: 'Refuerzo',
  RIG: 'Rigging Eléctrico',
};

export const roleLabelFromCode = (code: string): string => 
  ROLE_CODE_TO_LABEL[code as RoleCode] || code || '';

export const ROLE_CODES_WITH_PR_SUFFIX = new Set(['TP']);

export const stripRoleSuffix = (role: string): string => {
  const raw = String(role || '');
  const upper = raw.toUpperCase();
  if (ROLE_CODES_WITH_PR_SUFFIX.has(upper)) return raw;
  return raw.replace(/[PR]$/i, '');
};

export const hasRoleGroupSuffix = (role: string): boolean => {
  const upper = String(role || '').toUpperCase();
  if (ROLE_CODES_WITH_PR_SUFFIX.has(upper)) return false;
  return /[PR]$/i.test(upper);
};

export const stripRefuerzoSuffix = (role: string): string => {
  let clean = String(role || '');
  while (clean.length > 3 && /[PR]$/i.test(clean)) {
    const base = clean.substring(3).toUpperCase();
    if (ROLE_CODES_WITH_PR_SUFFIX.has(base)) break;
    clean = clean.replace(/[PR]$/i, '');
  }
  return clean;
};

/**
 * Get role badge code based on language
 * In English, some roles have different badge codes
 * IMPORTANTE: Mantiene sufijos P (prelight) y R (recogida) para mostrar códigos completos
 * IMPORTANTE: Mantiene prefijo REF para refuerzos (REFG, REFGP, REFGR, etc.)
 */
export const getRoleBadgeCode = (roleCode: string, language?: string): string => {
  const lang = language || (typeof window !== 'undefined' && (window as any).i18n?.language) || 'es';
  const role = String(roleCode || '').toUpperCase();
  
  // Detectar si es un refuerzo (REFG, REFBB, REFGP, REFGR, etc.)
  const isRefuerzo = role.startsWith('REF') && role.length > 3;
  
  // Si es refuerzo, mantener el prefijo REF y procesar el resto
  // IMPORTANTE: Los refuerzos NO llevan sufijos P o R, solo el código base (REFG, REFE, REFBB, etc.)
  if (isRefuerzo) {
    const refBase = role.substring(3); // Ej: 'G' de 'REFG', 'E' de 'REFE', 'BB' de 'REFBB'
    // Los refuerzos no tienen sufijos P o R, así que refBase es directamente el código base
    const baseCode = refBase;
    
    // Mapear código base a badge
    const baseBadge = getBaseRoleBadge(baseCode, lang);
    
    // Para refuerzos, mostrar REF + código base (ej: REFG, REFE, REFBB) - SIN sufijos P o R
    return `REF${baseBadge}`;
  }
  
  // Si es REF genérico (sin código base), mostrar 'R' o 'REF' según idioma
  if (role === 'REF') {
    return lang === 'en' || lang.startsWith('en') ? 'R' : 'REF';
  }
  
  // Para roles normales, detectar si tienen sufijo P o R
  const hasSuffix = hasRoleGroupSuffix(role);
  const base = hasSuffix ? role.slice(0, -1) : role;
  
  const baseBadge = getBaseRoleBadge(base, lang);
  
  // Si tenía sufijo, mantenerlo (ej: GP, GR)
  if (hasSuffix) {
    return role.endsWith('P') ? `${baseBadge}P` : `${baseBadge}R`;
  }
  
  return baseBadge;
};

/**
 * Get base role badge code (without suffixes)
 */
function getBaseRoleBadge(base: string, lang: string): string {
  // English badge codes
  if (lang === 'en' || lang.startsWith('en')) {
    const englishBadges: Record<string, string> = {
      'E': 'SP',
      'TM': 'LCP',
      'FB': 'DBO',
      'AUX': 'A',
      'M': 'T',
      'BB': 'BBE',
      'G': 'G',
      'REF': 'R',
      'RG': 'RG',
      'RBB': 'RBB',
      'RE': 'RE',
      'TG': 'TG',
      'CE': 'CE',
      'EPO': 'EP',
      'TP': 'TP',
      'RIG': 'RE',
    };
    return englishBadges[base] || base;
  }
  
  // Spanish/Catalan badge codes (default)
  const defaultBadges: Record<string, string> = {
    'G': 'G',
    'BB': 'BB',
    'RG': 'RG',
    'RBB': 'RBB',
    'RE': 'RE',
    'E': 'E',
    'TM': 'TM',
    'FB': 'FB',
    'AUX': 'AUX',
    'M': 'M',
    'REF': 'R',
    'TG': 'TG',
    'CE': 'CE',
    'EPO': 'EP',
    'TP': 'TP',
    'RIG': 'RE',
  };
  return defaultBadges[base] || base;
}

/**
 * Apply gender-specific badge overrides (BB -> BG, FB -> FG)
 */
export const applyGenderToBadge = (badge: string, gender?: string): string => {
  if (gender !== 'female') return badge;
  return badge
    .replace(/BBE([PR])?$/, (_m, suf) => `BGE${suf || ''}`)
    .replace(/RBB([PR])?$/, (_m, suf) => `RBG${suf || ''}`)
    .replace(/BB([PR])?$/, (_m, suf) => `BG${suf || ''}`)
    .replace(/FB([PR])?$/, (_m, suf) => `FG${suf || ''}`);
};
