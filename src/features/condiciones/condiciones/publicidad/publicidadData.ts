import { AnyRecord } from '@shared/types/common';
import { loadJSON } from '../shared';
import { storage } from '@shared/services/localStorage.service';
import { DEFAULT_FESTIVOS_TEXT } from '@shared/constants/festivos';
import { getDefaultsDiario } from '../../utils/translationHelpers';

// Variable global para festivos dinámicos
let globalDynamicFestivosText = DEFAULT_FESTIVOS_TEXT;

// Función para actualizar festivos dinámicos
export const updateDynamicFestivos = async () => {
  try {
    const { generateDynamicFestivosText } = await import('@shared/constants/festivos');
    globalDynamicFestivosText = await generateDynamicFestivosText();
  } catch {
    globalDynamicFestivosText = DEFAULT_FESTIVOS_TEXT;
  }
};

// Funciones de conveniencia para mantener compatibilidad con el código existente
const getDefaultLegendPubli = () => getDefaultsDiario().legend;
const getDefaultHorarios = () => getDefaultsDiario().horarios;
const getDefaultDietas = () => getDefaultsDiario().dietas;
const getDefaultTransportes = () => getDefaultsDiario().transportes;
const getDefaultAlojamiento = () => getDefaultsDiario().alojamiento;
const getDefaultConvenio = () => getDefaultsDiario().convenio;

export function loadOrSeedDiario(storageKey: string): AnyRecord {
  const fallback: AnyRecord = {
    roles: ['Gaffer', 'Eléctrico'],
    prices: {
      'Gaffer': {
        'Precio jornada': '510',
        'Precio Día extra/Festivo': '892.5',
        'Travel day': '510',
        'Horas extras': '75',
        'Carga/descarga': '225',
        'Localización técnica': '420',
      },
      'Best boy': {
        'Precio jornada': '410',
        'Precio Día extra/Festivo': '717.5',
        'Travel day': '410',
        'Horas extras': '60',
        'Carga/descarga': '180',
        'Localización técnica': '320',
      },
      'Eléctrico': {
        'Precio jornada': '310',
        'Precio Día extra/Festivo': '542.5',
        'Travel day': '310',
        'Horas extras': '45',
        'Carga/descarga': '135',
      },
      'Auxiliar': {
        'Precio jornada': '250',
        'Precio Día extra/Festivo': '437.5',
        'Travel day': '250',
        'Horas extras': '35',
        'Carga/descarga': '105',
      },
      'Técnico de mesa': {
        'Precio jornada': '350',
        'Precio Día extra/Festivo': '612.5',
        'Travel day': '350',
        'Horas extras': '50',
        'Carga/descarga': '150',
      },
      'Finger boy': {
        'Precio jornada': '350',
        'Precio Día extra/Festivo': '612.5',
        'Travel day': '350',
        'Horas extras': '50',
        'Carga/descarga': '150',
      },
    },
    legendTemplate: getDefaultLegendPubli(),
    festivosTemplate: globalDynamicFestivosText,
    horariosTemplate: getDefaultHorarios(),
    dietasTemplate: getDefaultDietas(),
    transportesTemplate: getDefaultTransportes(),
    alojamientoTemplate: getDefaultAlojamiento(),
    convenioTemplate: getDefaultConvenio(),
    params: {
      jornadaTrabajo: '10',
      jornadaComida: '1',
      factorFestivo: '1.75',
      factorHoraExtraFestiva: '1.5',
      cortesiaMin: '15',
      taDiario: '10',
      taFinde: '48',
      nocturnidadComplemento: '50',
      nocturnoIni: '02:00',
      nocturnoFin: '06:00',
      dietaDesayuno: '10',
      dietaComida: '20',
      dietaCena: '30',
      dietaSinPernocta: '50',
      dietaAlojDes: '60',
      gastosBolsillo: '10',
      kilometrajeKm: '0.40',
      transporteDia: '15',
    },
  };

  try {
    // Si no existe clave aún, persistimos el fallback para que sea "real" desde el inicio
    try {
      const exists = storage.getString(storageKey);
      if (exists == null) {
        storage.setJSON(storageKey, fallback);
      }
    } catch {}

    const parsed: AnyRecord = loadJSON(storageKey, fallback);

    // Función helper para normalizar valores numéricos (convertir comas a puntos)
    const normalizeNumeric = (val: any): string => {
      if (val == null) return '';
      const str = String(val);
      // Si contiene coma y no es una hora (no contiene :), convertir coma a punto
      if (str.includes(',') && !str.includes(':')) {
        return str.replace(',', '.');
      }
      return str;
    };

    if (parsed) {
      if (parsed.legend && !parsed.legendTemplate) {
        parsed.legendTemplate = parsed.legend;
        delete parsed.legend;
      }
      if (parsed.festivos && !parsed.festivosTemplate) {
        parsed.festivosTemplate = parsed.festivos;
        delete parsed.festivos;
      }
      if (parsed.horarios && !parsed.horariosTemplate) {
        parsed.horariosTemplate = parsed.horarios;
        delete parsed.horarios;
      }
      if (parsed.dietas && !parsed.dietasTemplate) {
        parsed.dietasTemplate = parsed.dietas;
        delete parsed.dietas;
      }
      if (parsed.transportes && !parsed.transportesTemplate) {
        parsed.transportesTemplate = parsed.transportes;
        delete parsed.transportes;
      }
      if (parsed.alojamiento && !parsed.alojamientoTemplate) {
        parsed.alojamientoTemplate = parsed.alojamiento;
        delete parsed.alojamiento;
      }
      
      if (parsed.convenio && !parsed.convenioTemplate) {
        parsed.convenioTemplate = parsed.convenio;
        delete parsed.convenio;
      }

      parsed.params = {
        jornadaTrabajo: normalizeNumeric(parsed.params?.jornadaTrabajo) || '10',
        jornadaComida: normalizeNumeric(parsed.params?.jornadaComida) || '1',
        factorFestivo: normalizeNumeric(parsed.params?.factorFestivo) || '1.75',
        factorHoraExtraFestiva: normalizeNumeric(parsed.params?.factorHoraExtraFestiva) || '1.5',
        cortesiaMin: normalizeNumeric(parsed.params?.cortesiaMin) || '15',
        taDiario: normalizeNumeric(parsed.params?.taDiario) || '10',
        taFinde: normalizeNumeric(parsed.params?.taFinde) || '48',
        nocturnidadComplemento: normalizeNumeric(parsed.params?.nocturnidadComplemento) || '50',
        nocturnoIni: parsed.params?.nocturnoIni ?? '02:00',
        nocturnoFin: parsed.params?.nocturnoFin ?? '06:00',
        dietaDesayuno: normalizeNumeric(parsed.params?.dietaDesayuno) || '10',
        dietaComida: normalizeNumeric(parsed.params?.dietaComida) || '20',
        dietaCena: normalizeNumeric(parsed.params?.dietaCena) || '30',
        dietaSinPernocta: normalizeNumeric(parsed.params?.dietaSinPernocta) || '50',
        dietaAlojDes: normalizeNumeric(parsed.params?.dietaAlojDes) || '60',
        gastosBolsillo: normalizeNumeric(parsed.params?.gastosBolsillo) || '10',
        kilometrajeKm: normalizeNumeric(parsed.params?.kilometrajeKm) || '0.40',
        transporteDia: normalizeNumeric(parsed.params?.transporteDia) || '15',
      };

      parsed.legendTemplate = parsed.legendTemplate ?? getDefaultLegendPubli();
      parsed.festivosTemplate = parsed.festivosTemplate ?? globalDynamicFestivosText;
      parsed.horariosTemplate = parsed.horariosTemplate ?? getDefaultHorarios();
      parsed.dietasTemplate = parsed.dietasTemplate ?? getDefaultDietas();
      parsed.transportesTemplate = parsed.transportesTemplate ?? getDefaultTransportes();
      parsed.alojamientoTemplate = parsed.alojamientoTemplate ?? getDefaultAlojamiento();
      parsed.convenioTemplate = parsed.convenioTemplate ?? getDefaultConvenio();

      // Asegurar que roles existe y tiene valores por defecto si está vacío
      // IMPORTANTE: Solo Gaffer y Eléctrico deben estar en roles inicialmente
      // Los demás roles (Best boy, Auxiliar, etc.) tienen precios preestablecidos pero NO están en roles
      if (!parsed.roles || !Array.isArray(parsed.roles) || parsed.roles.length === 0) {
        parsed.roles = ['Gaffer', 'Eléctrico'];
      }

      // Sincronizar roles con prices: inicializar precios vacíos para roles del equipo base que no tienen precios
      // IMPORTANTE: Esto debe ejecutarse SIEMPRE, incluso si prices ya existe pero está vacío
      // CRÍTICO: Asegurar que prices tenga entradas para Gaffer y Eléctrico desde el inicio
      parsed.prices = parsed.prices || {};
      
      // Asegurar que prices tenga entradas para todos los roles del equipo base
      // Si prices está vacío o no tiene entradas para los roles, inicializarlas
      let needsSync = false;
      const defaultRoles = ['Gaffer', 'Eléctrico'];
      
      // Primero, asegurar que los roles por defecto siempre estén en prices
      for (const role of defaultRoles) {
        if (!parsed.prices[role]) {
          // Si el rol tiene precios preestablecidos en el fallback, usarlos
          // Si no, inicializar vacío
          if (fallback.prices && fallback.prices[role]) {
            parsed.prices[role] = { ...fallback.prices[role] };
          } else {
            parsed.prices[role] = {};
          }
          needsSync = true;
        }
      }
      
      // Luego, asegurar que todos los roles del modelo también estén en prices
      for (const role of parsed.roles) {
        if (!parsed.prices[role]) {
          // Si el rol tiene precios preestablecidos en el fallback, usarlos
          if (fallback.prices && fallback.prices[role]) {
            parsed.prices[role] = { ...fallback.prices[role] };
          } else {
            parsed.prices[role] = {};
          }
          needsSync = true;
        }
      }
      
      // IMPORTANTE: Los precios preestablecidos para otros roles (Best boy, Auxiliar, etc.)
      // deben mantenerse en prices, pero NO deben estar en roles inicialmente
      // Esto permite que aparezcan en el dropdown pero no en la tabla base
      if (fallback.prices) {
        for (const role of Object.keys(fallback.prices)) {
          if (!parsed.prices[role]) {
            parsed.prices[role] = { ...fallback.prices[role] };
            needsSync = true;
          }
        }
      }
      
      // Si se hizo alguna sincronización, persistir los cambios
      if (needsSync) {
        try {
          storage.setJSON(storageKey, parsed);
        } catch {}
      }

      return parsed;
    }

    // Sincronizar roles con prices en el fallback también
    // IMPORTANTE: Solo Gaffer y Eléctrico deben estar en roles del fallback
    // Los demás roles tienen precios preestablecidos pero NO están en roles
    const syncedFallback = { ...fallback };
    syncedFallback.roles = ['Gaffer', 'Eléctrico']; // Asegurar que solo estos dos estén en roles
    syncedFallback.prices = syncedFallback.prices || {};
    
    // Asegurar que Gaffer y Eléctrico tengan entradas en prices
    for (const role of syncedFallback.roles) {
      if (!syncedFallback.prices[role]) {
        syncedFallback.prices[role] = {};
      }
    }

    return syncedFallback;
  } catch (error) {
    console.error('Error loading diario conditions:', error);
    return fallback;
  }
}

export { globalDynamicFestivosText };

