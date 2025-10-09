// src/shared/constants/roles.ts

export type RoleCode = 'G' | 'BB' | 'E' | 'TM' | 'FB' | 'AUX' | 'M' | 'REF';

export interface Role {
  code: RoleCode;
  label: string;
}

export interface RoleColor {
  bg: string;
  fg: string;
}

export const ROLE_ORDER: RoleCode[] = ['G', 'BB', 'E', 'TM', 'FB', 'AUX', 'M', 'REF'];

export const ROLES: Role[] = [
  { code: 'G', label: 'Gaffer' },
  { code: 'BB', label: 'Best Boy' },
  { code: 'E', label: 'Eléctrico/a' },
  { code: 'TM', label: 'Técnico de mesa' },
  { code: 'FB', label: 'Finger Boy' },
  { code: 'AUX', label: 'Auxiliar' },
  { code: 'M', label: 'Meritorio' },
  { code: 'REF', label: 'Refuerzo Eléctrico' },
];

export const ROLE_COLORS: Record<RoleCode, RoleColor> = {
  G: { bg: 'linear-gradient(135deg,#7DD3FC,#0284C7)', fg: '#0b0b0b' },
  BB: { bg: 'linear-gradient(135deg,#93C5FD,#0476D9)', fg: '#0b0b0b' },
  E: { bg: 'linear-gradient(135deg,#FDE047,#F59E0B)', fg: '#0b0b0b' },
  TM: { bg: 'linear-gradient(135deg,#A7F3D0,#10B981)', fg: '#0b0b0b' },
  FB: { bg: 'linear-gradient(135deg,#FCA5A5,#EF4444)', fg: '#0b0b0b' },
  AUX: { bg: 'linear-gradient(135deg,#E9D5FF,#7C3AED)', fg: '#0b0b0b' },
  M: { bg: 'linear-gradient(135deg,#FDE68A,#D97706)', fg: '#0b0b0b' },
  REF: { bg: 'linear-gradient(135deg,#C7D2FE,#4338CA)', fg: '#0b0b0b' },
};

export const roleRank = (r: string): number => {
  const i = ROLE_ORDER.indexOf(r as RoleCode);
  return i === -1 ? 999 : i;
};

// Útil si lo necesitas en Nómina (mapear códigos -> etiquetas)
export const ROLE_CODE_TO_LABEL: Record<RoleCode, string> = {
  G: 'Gaffer',
  BB: 'Best boy',
  E: 'Eléctrico',
  AUX: 'Auxiliar',
  M: 'Meritorio',
  TM: 'Técnico de mesa',
  FB: 'Finger boy',
  REF: 'Refuerzo',
};

export const roleLabelFromCode = (code: string): string => 
  ROLE_CODE_TO_LABEL[code as RoleCode] || code || '';
