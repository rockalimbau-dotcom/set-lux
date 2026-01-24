// Carga el modelo de condiciones (prices/params) desde localStorage
// priorizando el modo del proyecto y con retrocompatibilidad.
import { storage } from '@shared/services/localStorage.service';

export function loadCondModel(project: { id?: string; nombre?: string; conditionsMode?: string; conditions?: { tipo?: string; mode?: string } } | null, modeOverride?: string) {
  const base = project?.id || project?.nombre || 'tmp';
  const mode = (
    modeOverride ||
    project?.conditionsMode ||
    project?.conditions?.tipo ||
    project?.conditions?.mode ||
    'semanal'
  )
    .toString()
    .toLowerCase();

  const keys = [
    `cond_${base}_${mode}`,
    `cond_${base}_mensual`,
    `cond_${base}_semanal`,
    `cond_${base}_diario`,
    `cond_${base}_publicidad`, // Compatibilidad hacia atrás
  ];
  
  const migrateCondiciones = (obj: any) => {
    if (!obj || typeof obj !== 'object') return { obj, changed: false };
    let changed = false;
    const migrateRolesList = (roles: any[]) => {
      if (!Array.isArray(roles)) return roles;
      const mapped = roles.map(r => (String(r) === 'Rigger' ? 'Rigging Eléctrico' : r));
      const unique = Array.from(new Set(mapped));
      if (unique.join('|') !== roles.join('|')) changed = true;
      return unique;
    };
    const migratePrices = (prices: Record<string, any> | undefined) => {
      if (!prices || typeof prices !== 'object') return prices;
      const next = { ...prices };
      if ('Rigger' in next) {
        if (!('Rigging Eléctrico' in next)) {
          next['Rigging Eléctrico'] = next['Rigger'];
        } else {
          next['Rigging Eléctrico'] = { ...next['Rigger'], ...next['Rigging Eléctrico'] };
        }
        delete next['Rigger'];
        changed = true;
      }
      return next;
    };
    const roles = migrateRolesList(obj.roles || []);
    const prices = migratePrices(obj.prices);
    const pricesPrelight = migratePrices(obj.pricesPrelight);
    const pricesPickup = migratePrices(obj.pricesPickup);
    return {
      obj: { ...obj, roles, prices, pricesPrelight, pricesPickup },
      changed,
    };
  };

  for (const k of keys) {
    try {
      const obj = storage.getJSON<any>(k);
      if (!obj) continue;
      // Validación extra: para diario aseguramos que prices tenga datos reales
      if (k.endsWith('_diario') || k.endsWith('_publicidad')) {
        const hasPrices = obj?.prices && Object.keys(obj.prices).length > 0;
        if (!hasPrices || !obj.prices['Gaffer'] || !obj.prices['Eléctrico']) {
          const seed = {
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
            params: obj?.params || {
              jornadaTrabajo: '10',
              jornadaComida: '1',
              factorFestivo: '1.75',
              factorHoraExtraFestiva: '1.5',
              cortesiaMin: '15',
              taDiario: '10',
              taFinde: '12',
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
          } as any;
          storage.setJSON(k, seed);
          return seed;
        }
      }
      
      // Filtrar prices para incluir solo los roles que están en roles
      // Esto asegura que si un rol fue eliminado de roles, no aparezca en prices
      if (obj?.roles && Array.isArray(obj.roles) && obj.roles.length > 0 && obj?.prices) {
        const filteredPrices: any = {};
        const rolesSet = new Set(obj.roles);
        for (const role of obj.roles) {
          if (obj.prices[role]) {
            filteredPrices[role] = obj.prices[role];
          }
        }
        // También mantener roles que están en prices pero no en roles (retrocompatibilidad)
        // pero solo si no hay roles definidos explícitamente
        if (Object.keys(filteredPrices).length === 0 && Object.keys(obj.prices).length > 0) {
          // Si no hay roles definidos pero sí hay prices, usar todos los prices
          return obj;
        }
        return { ...obj, prices: filteredPrices };
      }
      
      const migrated = migrateCondiciones(obj);
      if (migrated.changed) {
        try {
          storage.setJSON(k, migrated.obj);
        } catch {}
      }
      return migrated.obj; // { prices:{...}, params:{...} }
    } catch {}
  }

  // Si no existe nada en localStorage aún (p.ej. proyecto nuevo y no se ha abierto Condiciones),
  // sembramos valores por defecto para que Nómina funcione desde el inicio.
  try {
    const targetKey = `cond_${base}_${mode}`;
    if (mode === 'diario') {
      const seed = {
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
        params: {
          jornadaTrabajo: '10',
          jornadaComida: '1',
          factorFestivo: '1.75',
          factorHoraExtraFestiva: '1.5',
          cortesiaMin: '15',
          taDiario: '10',
          taFinde: '12',
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
      } as any;
      storage.setJSON(targetKey, seed);
      return seed;
    }
  } catch {}

  return {} as any;
}


