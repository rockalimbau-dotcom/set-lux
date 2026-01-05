import { useEffect, useState } from 'react';
import { storage } from '@shared/services/localStorage.service';
import { syncAllWeeks } from '@features/planificacion/utils/sync';
import { Project, ProjectTeam } from './ProjectDetailTypes';
import { isEmptyTeam } from './ProjectDetailUtils';

export function useProjectSync(proj: Project | null) {
  const [loaded, setLoaded] = useState(false);

  // Marcar como cargado
  useEffect(() => {
    setLoaded(true);
  }, []);

  // Sincronizar automáticamente las semanas de planificación cuando se guarda el equipo
  // Esto permite que las semanas se autocompleten sin necesidad de entrar en planificación
  useEffect(() => {
    if (!loaded) return;
    if (!proj?.team || isEmptyTeam(proj.team)) return;

    const planKey = `plan_${proj?.id || proj?.nombre || 'tmp'}`;
    try {
      const planData = storage.getJSON<{ pre?: any[]; pro?: any[] }>(planKey);
      if (!planData || (!planData.pre?.length && !planData.pro?.length)) {
        // No hay semanas, no hay nada que sincronizar
        return;
      }

      const baseTeam = proj.team.base || [];
      const prelightTeam = proj.team.prelight || [];
      const pickupTeam = proj.team.pickup || [];
      const reinforcements = proj.team.reinforcements || [];

      // Sincronizar semanas pre y pro
      const syncedPre = syncAllWeeks(
        planData.pre || [],
        baseTeam,
        prelightTeam,
        pickupTeam,
        reinforcements
      );
      const syncedPro = syncAllWeeks(
        planData.pro || [],
        baseTeam,
        prelightTeam,
        pickupTeam,
        reinforcements
      );

      // Guardar las semanas sincronizadas
      storage.setJSON(planKey, {
        pre: syncedPre,
        pro: syncedPro,
      });
    } catch (error) {
      // Silenciar errores de sincronización
    }
  }, [proj?.team, proj?.id, proj?.nombre, loaded]);

  return { loaded };
}

