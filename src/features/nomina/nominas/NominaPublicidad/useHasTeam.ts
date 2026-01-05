import { useMemo } from 'react';
import { storage } from '@shared/services/localStorage.service';

/**
 * Hook para verificar si hay equipo guardado
 * Verifica tanto en el objeto del proyecto como en localStorage
 */
export function useHasTeam(project: any, baseId: string): boolean {
  return useMemo(() => {
    try {
      // 1. Verificar si el equipo está en el objeto del proyecto directamente
      const projectTeam = project?.team;
      if (projectTeam) {
        const base = Array.isArray(projectTeam.base) ? projectTeam.base : [];
        const reinforcements = Array.isArray(projectTeam.reinforcements) ? projectTeam.reinforcements : [];
        const prelight = Array.isArray(projectTeam.prelight) ? projectTeam.prelight : [];
        const pickup = Array.isArray(projectTeam.pickup) ? projectTeam.pickup : [];
        if (base.length > 0 || reinforcements.length > 0 || prelight.length > 0 || pickup.length > 0) {
          return true;
        }
      }

      // 2. Verificar en localStorage con la clave que usa EquipoTab
      const teamKey = `team_${baseId}`;
      const teamData = storage.getJSON<any>(teamKey);
      if (teamData) {
        const base = Array.isArray(teamData.base) ? teamData.base : [];
        const reinforcements = Array.isArray(teamData.reinforcements) ? teamData.reinforcements : [];
        const prelight = Array.isArray(teamData.prelight) ? teamData.prelight : [];
        const pickup = Array.isArray(teamData.pickup) ? teamData.pickup : [];
        if (base.length > 0 || reinforcements.length > 0 || prelight.length > 0 || pickup.length > 0) {
          return true;
        }
      }

      // 3. Verificar también en la clave del proyecto completo (por si acaso)
      const projectKey = `project_${baseId}`;
      const projectData = storage.getJSON<any>(projectKey);
      if (projectData?.team) {
        const base = Array.isArray(projectData.team.base) ? projectData.team.base : [];
        const reinforcements = Array.isArray(projectData.team.reinforcements) ? projectData.team.reinforcements : [];
        const prelight = Array.isArray(projectData.team.prelight) ? projectData.team.prelight : [];
        const pickup = Array.isArray(projectData.team.pickup) ? projectData.team.pickup : [];
        if (base.length > 0 || reinforcements.length > 0 || prelight.length > 0 || pickup.length > 0) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }, [baseId, project]);
}

