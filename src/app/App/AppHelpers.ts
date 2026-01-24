import { ROLES } from '@shared/constants/roles';

/**
 * Get default role value
 */
export function getDefaultRole(): string {
  return (ROLES[0] && (typeof ROLES[0] === 'string' ? ROLES[0] : (ROLES[0] as any).label)) || '';
}

