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

      return parsed;
    }

    return fallback;
  } catch (error) {
    console.error('Error loading diario conditions:', error);
    return fallback;
  }
}

export { globalDynamicFestivosText };

