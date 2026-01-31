import { loadJSON } from '../shared';
import { storage } from '@shared/services/localStorage.service';
import { DEFAULT_FESTIVOS_TEXT } from '@shared/constants/festivos';
import { getDefaultsSemanal } from '../../utils/translationHelpers';

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
const getDefaultLegend = () => getDefaultsSemanal().legend;
const getDefaultHorarios = () => getDefaultsSemanal().horarios;
const getDefaultDietas = () => getDefaultsSemanal().dietas;
const getDefaultTransportes = () => getDefaultsSemanal().transportes;
const getDefaultAlojamiento = () => getDefaultsSemanal().alojamiento;
const getDefaultPrepro = () => getDefaultsSemanal().prepro;
const getDefaultConvenio = () => getDefaultsSemanal().convenio;

export function loadOrSeed(storageKey: string) {
  const fallback = {
    roles: ['Gaffer', 'Eléctrico'],
    prices: {
      'Gaffer': {},
      'Eléctrico': {},
    },
    legendTemplate: getDefaultLegend(),
    festivosTemplate: globalDynamicFestivosText,
    horariosTemplate: getDefaultHorarios(),
    dietasTemplate: getDefaultDietas(),
    transportesTemplate: getDefaultTransportes(),
    alojamientoTemplate: getDefaultAlojamiento(),
    preproTemplate: getDefaultPrepro(),
    convenioTemplate: getDefaultConvenio(),
    params: {
      jornadaTrabajo: '9',
      jornadaComida: '1',
      diasJornada: '5',
      diasDiario: '7',
      semanasMes: '4',
      horasSemana: '45',
      factorFestivo: '1.75',
      factorHoraExtra: '1.5',
      divTravel: '2',
      cortesiaMin: '15',
      taDiario: '12',
      taFinde: '48',
      nocturnoIni: '22:00',
      nocturnoFin: '06:00',
      dietaComida: '14.02',
      dietaCena: '16.36',
      dietaSinPernocta: '30.38',
      dietaAlojDes: '51.39',
      gastosBolsillo: '8.81',
      kilometrajeKm: '0.26',
      transporteDia: '12',
    },
  } as any;

  // Si no existe clave aún, persistimos el fallback para que sea "real" desde el inicio
  // Esto es como funciona en diario y asegura que prices tenga valores desde el inicio
  try {
    const exists = storage.getString(storageKey);
    if (exists == null) {
      storage.setJSON(storageKey, fallback);
    }
  } catch {}

  const parsed = loadJSON(storageKey, fallback);

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
    if (parsed.prepro && !parsed.preproTemplate) {
      parsed.preproTemplate = parsed.prepro;
      delete parsed.prepro;
    }
    if (parsed.convenio && !parsed.convenioTemplate) {
      parsed.convenioTemplate = parsed.convenio;
      delete parsed.convenio;
    }

    parsed.params = {
      jornadaTrabajo: normalizeNumeric(parsed.params?.jornadaTrabajo) || '9',
      jornadaComida: normalizeNumeric(parsed.params?.jornadaComida) || '1',
      diasJornada: normalizeNumeric(parsed.params?.diasJornada) || '5',
      diasDiario: normalizeNumeric(parsed.params?.diasDiario) || '7',
      semanasMes: normalizeNumeric(parsed.params?.semanasMes) || '4',
      horasSemana: normalizeNumeric(parsed.params?.horasSemana) || '45',
      factorFestivo: normalizeNumeric(parsed.params?.factorFestivo) || '1.75',
      factorHoraExtra: normalizeNumeric(parsed.params?.factorHoraExtra) || '1.5',
      divTravel: normalizeNumeric(parsed.params?.divTravel) || '2',
      cortesiaMin: normalizeNumeric(parsed.params?.cortesiaMin) || '15',
      taDiario: normalizeNumeric(parsed.params?.taDiario) || '12',
      taFinde: normalizeNumeric(parsed.params?.taFinde) || '48',
      nocturnoIni: parsed.params?.nocturnoIni ?? '22:00',
      nocturnoFin: parsed.params?.nocturnoFin ?? '06:00',
      dietaComida: normalizeNumeric(parsed.params?.dietaComida) || '14.02',
      dietaCena: normalizeNumeric(parsed.params?.dietaCena) || '16.36',
      dietaSinPernocta: normalizeNumeric(parsed.params?.dietaSinPernocta) || '30.38',
      dietaAlojDes: normalizeNumeric(parsed.params?.dietaAlojDes) || '51.39',
      gastosBolsillo: normalizeNumeric(parsed.params?.gastosBolsillo) || '8.81',
      kilometrajeKm: normalizeNumeric(parsed.params?.kilometrajeKm) || '0.26',
      transporteDia: normalizeNumeric(parsed.params?.transporteDia) || '12',
    };

    parsed.legendTemplate = parsed.legendTemplate ?? getDefaultLegend();
    parsed.festivosTemplate = parsed.festivosTemplate ?? globalDynamicFestivosText;
    parsed.horariosTemplate = parsed.horariosTemplate ?? getDefaultHorarios();
    parsed.dietasTemplate = parsed.dietasTemplate ?? getDefaultDietas();
    parsed.transportesTemplate = parsed.transportesTemplate ?? getDefaultTransportes();
    parsed.alojamientoTemplate = parsed.alojamientoTemplate ?? getDefaultAlojamiento();
    parsed.preproTemplate = parsed.preproTemplate ?? getDefaultPrepro();
    parsed.convenioTemplate = parsed.convenioTemplate ?? getDefaultConvenio();

    // Asegurar que roles existe y tiene valores por defecto si está vacío
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
        parsed.prices[role] = {};
        needsSync = true;
      }
    }
    
    // Luego, asegurar que todos los roles del modelo también estén en prices
    for (const role of parsed.roles) {
      if (!parsed.prices[role]) {
        parsed.prices[role] = {};
        needsSync = true;
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
  // IMPORTANTE: Asegurar que prices tenga entradas vacías para todos los roles del equipo base
  const syncedFallback = { ...fallback };
  if (syncedFallback.roles && Array.isArray(syncedFallback.roles) && syncedFallback.roles.length > 0) {
    syncedFallback.prices = syncedFallback.prices || {};
    for (const role of syncedFallback.roles) {
      if (!syncedFallback.prices[role]) {
        syncedFallback.prices[role] = {};
      }
    }
  } else {
    // Si roles no está definido, asegurar que prices tenga los roles por defecto
    syncedFallback.prices = syncedFallback.prices || {};
    if (!syncedFallback.prices['Gaffer']) {
      syncedFallback.prices['Gaffer'] = {};
    }
    if (!syncedFallback.prices['Eléctrico']) {
      syncedFallback.prices['Eléctrico'] = {};
    }
  }

  return syncedFallback;
}

export { globalDynamicFestivosText };

