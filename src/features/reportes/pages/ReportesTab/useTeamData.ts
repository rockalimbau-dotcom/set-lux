import { useMemo } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';

/**
 * Check if there is team data saved
 */
export function useTeamData(baseId: string) {
  const teamKey = `team_${baseId}`;
  const [teamData] = useLocalStorage<any>(teamKey, null);
  
  const hasTeam = useMemo(() => {
    try {
      if (teamData) {
        const base = Array.isArray(teamData.base) ? teamData.base : [];
        const reinforcements = Array.isArray(teamData.reinforcements) ? teamData.reinforcements : [];
        const prelight = Array.isArray(teamData.prelight) ? teamData.prelight : [];
        const pickup = Array.isArray(teamData.pickup) ? teamData.pickup : [];
        return base.length > 0 || reinforcements.length > 0 || prelight.length > 0 || pickup.length > 0;
      }
      return false;
    } catch {
      return false;
    }
  }, [teamData]);

  return { hasTeam, teamData };
}

