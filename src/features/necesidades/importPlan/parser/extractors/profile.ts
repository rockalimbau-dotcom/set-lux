export type PlanProfile = 'calendar' | 'plan' | 'generic';

export const detectProfile = (lines: string[]): PlanProfile => {
  const joined = lines.join(' ').toUpperCase();
  if (joined.includes('CALENDAR') || joined.includes('CALENDARIO')) return 'calendar';
  if (joined.includes('PLAN RODAJE') || joined.includes('PLAN DE RODAJE')) return 'plan';
  return 'generic';
};
