import { useMemo } from 'react';
import { getDefaultsMensual } from '../../utils/translationHelpers';

/**
 * Hook to get default values for mensual conditions
 */
export function useMensualDefaults() {
  return useMemo(() => {
    const defaults = getDefaultsMensual();
    return {
      getDefaultLegend: () => defaults.legend,
      getDefaultHorarios: () => defaults.horarios,
      getDefaultDietas: () => defaults.dietas,
      getDefaultTransportes: () => defaults.transportes,
      getDefaultAlojamiento: () => defaults.alojamiento,
      getDefaultPrepro: () => defaults.prepro,
      getDefaultConvenio: () => defaults.convenio,
    };
  }, []);
}

