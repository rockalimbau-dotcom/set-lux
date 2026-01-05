import { AnyRecord } from '@shared/types/common';
import { loadJSON } from '../shared';
import { DEFAULT_FESTIVOS_TEXT } from '@shared/constants/festivos';
import { getDefaultsMensual } from '../../utils/translationHelpers';

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
const getDefaultLegend = () => getDefaultsMensual().legend;
const getDefaultHorarios = () => getDefaultsMensual().horarios;
const getDefaultDietas = () => getDefaultsMensual().dietas;
const getDefaultTransportes = () => getDefaultsMensual().transportes;
const getDefaultAlojamiento = () => getDefaultsMensual().alojamiento;
const getDefaultPrepro = () => getDefaultsMensual().prepro;
const getDefaultConvenio = () => getDefaultsMensual().convenio;

export function loadOrSeed(storageKey: string): AnyRecord {
  const fallback: AnyRecord = {
    roles: ['Gaffer', 'Eléctrico'],
    prices: {},
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
  };

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

    return parsed;
  }

  return fallback;
}

export { globalDynamicFestivosText };

