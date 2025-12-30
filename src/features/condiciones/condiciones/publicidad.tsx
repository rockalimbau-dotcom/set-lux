// condiciones/publicidad.tsx
import { Th, Td } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useCallback, useEffect, useMemo, useState, useRef, memo } from 'react';

import { renderWithParams, visibleToTemplate, loadJSON, TextAreaAuto, InfoCard, ParamInput } from './shared';
import { storage } from '@shared/services/localStorage.service';
import { DEFAULT_FESTIVOS_TEXT, generateDynamicFestivosText } from '@shared/constants/festivos';
import { exportCondicionesToPDF } from '../utils/exportPDF';

type AnyRecord = Record<string, any>;

const defaultLegendPubli = `Precio jornada: Importe base por jornada.
Precio día extra/festivo: Equivale al precio de jornada multiplicado por {{FACTOR_FESTIVO}}. Horas extras festivas equivale al precio de jornada multiplicado por {{FACTOR_HORA_EXTRA_FESTIVA}}.
Localización técnica: Importe por día de trabajo en localizaciones técnicas previas al rodaje. Si la localización técnica es mayor de 5h + 1h, se contará como jornada completa.
Carga/descarga: Importe por jornada de carga y descarga de material. Esto equivale a 3 horas extras.
Travel day: Equivale al precio de jornada.
Horas extras: Se considera hora extra a partir de {{CORTESIA_MIN}} minutos después del fin de la jornada pactada. A partir de la segunda hora extra no habrá cortesía de {{CORTESIA_MIN}}′. Las horas extras son voluntarias y deberán comunicarse antes del final de la jornada pactada.`;

// Variable global para festivos dinámicos
let globalDynamicFestivosText = DEFAULT_FESTIVOS_TEXT;

// Función para actualizar festivos dinámicos
const updateDynamicFestivos = async () => {
  try {
    globalDynamicFestivosText = await generateDynamicFestivosText();
  } catch {
    globalDynamicFestivosText = DEFAULT_FESTIVOS_TEXT;
  }
};
const defaultHorarios = `Turn Around: El descanso entre jornadas será de {{TA_DIARIO}}h entre días laborables y de {{TA_FINDE}}h los fines de semana. Todas las horas que no se descansen serán consideradas horas extras.
Nocturnidades: Se considerará jornada nocturna cuando el inicio o final de la jornada sea entre las {{NOCTURNO_INI}} y las {{NOCTURNO_FIN}}. Se bonificará con un complemento salarial equivalente a {{NOCTURNIDAD_COMPLEMENTO}}€. Aparte, tambien las horas nocturnas se bonificarán con un factor {{FACTOR_HORA_EXTRA_FESTIVA}} a las horas extras.`;
const defaultDietas = `Se ingresarán en nómina (importe libre de impuestos) las siguientes cantidades cuando no se disponga de manutención en el rodaje así como cuando se trabaje fuera del centro de actividades habitual. Se incrementará en un 50% fuera del territorio nacional. También se efectuará un anticipo de éstas.
Desayuno: {{DIETA_DESAYUNO}}€
Comida: {{DIETA_COMIDA}}€
Cena: {{DIETA_CENA}}€
Dieta completa sin pernocta: {{DIETA_SIN_PERNOCTA}} €
Dieta completa y desayuno: {{DIETA_ALOJ_DES}}€
Gastos de bolsillo: {{GASTOS_BOLSILLO}}€`;
const defaultTransportes = `Cuando por necesidades de rodaje, el trabajador se desplace fuera del centro habitual de trabajo, se abonará la cantidad de {{KM_EURO}}€/km más los peajes y gastos de estacionamiento pertinentes.
En caso de transportar a miembros del equipo se bonificará también con la cantidad de {{TRANSPORTE_DIA}}€/día extra.`;
const defaultAlojamiento = `En caso de tener que pernoctar fuera del domicilio habitual del trabajador, la productora deberá facilitar un hotel (mínimo 3 estrellas) con habitación individual y las dietas y gastos de bolsillo pertinentes.`;

const defaultConvenio = `También se tendrá en cuenta el convenio “Resolución de 22 de marzo de 2024, de la Dirección General de Trabajo, por la que se registra y publica el III Convenio colectivo de ámbito estatal de la industria de producción audiovisual (técnicos).`;

const PRICE_HEADERS_PUBLI = [
  'Precio jornada',
  'Precio Día extra/Festivo',
  'Localización técnica',
  'Carga/descarga',
  'Travel day',
  'Horas extras',
];

const PRICE_ROLES_PUBLI = [
  'Gaffer',
  'Best boy',
  'Eléctrico',
  'Auxiliar',
  'Técnico de mesa',
  'Finger boy',
];

function CondicionesPublicidad({
  project,
  onChange = () => {},
  onRegisterExport,
}: { 
  project: AnyRecord | null | undefined; 
  onChange?: (p: AnyRecord) => void;
  onRegisterExport?: (fn: () => void) => void;
}) {
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'tmp';
    return `cond_${base}_publicidad`;
  }, [project?.id, project?.nombre]);

  // Cargar festivos dinámicos al montar el componente
  useEffect(() => {
    updateDynamicFestivos();
  }, []);

  const [showParams, setShowParams] = useState(false);
  const paramsRef = useRef<HTMLDivElement | null>(null);
  const [model, setModel] = useLocalStorage<AnyRecord>(storageKey, () =>
    loadOrSeedPublicidad(storageKey)
  );
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  // Persistir inmediatamente el modelo inicial si no existe en localStorage,
  // para que Nómina lo reconozca sin necesidad de editar campos.
  const wroteInitialRef = useRef(false);
  useEffect(() => {
    if (wroteInitialRef.current) return;
    try {
      const existing = storage.getJSON<any>(storageKey);
      if (!existing) {
        storage.setJSON(storageKey, model);
      }
    } catch {}
    wroteInitialRef.current = true;
  }, [storageKey, model]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastEmittedRef = useRef('');

  useEffect(() => {
    const payload = { publicidad: model };
    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChangeRef.current?.(payload);
    }
  }, [model]);

  const setPrice = (role: string, header: string, value: string) =>
    setModel((m: AnyRecord) => {
      const next: AnyRecord = { ...m, prices: { ...(m.prices || {}) } };
      next.prices[role] = { ...(next.prices[role] || {}), [header]: value };
      return next;
    });

  const setText = (key: string, value: string) => setModel((m: AnyRecord) => ({ ...m, [key]: value }));

  const setParam = (key: string, value: string) =>
    setModel((m: AnyRecord) => ({
      ...m,
      params: { ...(m.params || {}), [key]: value },
    }));
  
  // Funciones para gestionar roles
  const addRole = (newRole: string) => {
    if (!newRole) return;
    
    setModel((m: AnyRecord) => {
      const currentRoles = m.roles || PRICE_ROLES_PUBLI;
      if (currentRoles.includes(newRole)) return m;
      
      // Mantener el orden de PRICE_ROLES_PUBLI
      const nextRoles: string[] = [];
      const currentSet = new Set(currentRoles);
      
      for (const role of PRICE_ROLES_PUBLI) {
        if (role === newRole) {
          nextRoles.push(newRole);
        } else if (currentSet.has(role)) {
          nextRoles.push(role);
        }
      }
      
      if (!PRICE_ROLES_PUBLI.includes(newRole)) {
        nextRoles.push(newRole);
      }
      // Autocompletar precios preestablecidos para el rol añadido si no existen
      const nextPrices = { ...(m.prices || {}) };
      if (!nextPrices[newRole]) {
        // Cargar la semilla por defecto para obtener los precios iniciales
        const seed = loadOrSeedPublicidad('__seed__');
        if (seed?.prices?.[newRole]) {
          nextPrices[newRole] = { ...seed.prices[newRole] };
        }
      }

      return { ...m, roles: nextRoles, prices: nextPrices };
    });
    setShowRoleSelect(false);
  };
  
  const removeRole = (role: string) => {
    setModel((m: AnyRecord) => {
      const roles = m.roles || PRICE_ROLES_PUBLI;
      const nextRoles = roles.filter((r: string) => r !== role);
      const nextPrices = { ...m.prices };
      delete nextPrices[role];
      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };
  
  const roles = model.roles || PRICE_ROLES_PUBLI;

  const parseNum = (x: unknown): number => {
    if (x == null) return NaN;
    let s = String(x)
      .trim()
      .replace(/[^\d.,-]/g, '');
    if (!s) return NaN;
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
      const lastComma = s.lastIndexOf(',');
      const lastDot = s.lastIndexOf('.');
      const decSep = lastComma > lastDot ? ',' : '.';
      const thouSep = decSep === ',' ? '.' : ',';
      s = s.replace(new RegExp(`\\${thouSep}`, 'g'), '');
      if (decSep === ',') s = s.replace(/,/g, '.');
    } else if (hasComma && !hasDot) {
      s = s.replace(/,/g, '.');
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const fmt = (n: number): string => {
    if (!Number.isFinite(n)) return '';
    if (Math.abs(n % 1) < 1e-9) return String(Math.round(n));
    return n.toFixed(2).replace(/\.?0+$/, '');
  };

  const computeFromDaily = (dailyStr: string, params: AnyRecord) => {
    const d = parseNum(dailyStr);
    if (!Number.isFinite(d) || d === 0) {
      return {
        'Precio Día extra/Festivo': '',
        'Travel day': '',
        'Horas extras': '',
      } as AnyRecord;
    }
    const factorFestivo = parseNum(params?.factorFestivo) || 0;
    const jTrab = parseNum(params?.jornadaTrabajo) || 0;
    const jCom = parseNum(params?.jornadaComida) || 0;
    const facHora = parseNum(params?.factorHoraExtra) || 0;

    const festivo = factorFestivo > 0 ? d * factorFestivo : NaN;
    const travel = d; // Travel day es igual al precio jornada
    const horasTotales = jTrab + jCom;
    const extra =
      horasTotales > 0 && facHora > 0 ? (d / horasTotales) * facHora : NaN;
    const cargaDescarga = extra * 3; // Equivalente a 3 horas extras

    return {
      'Precio Día extra/Festivo': fmt(festivo),
      'Travel day': fmt(travel),
      'Horas extras': fmt(extra),
      'Carga/descarga': fmt(cargaDescarga),
    } as AnyRecord;
  };

  const handlePriceChange = (role: string, header: string, value: string) => {
    if (header === 'Precio jornada') {
      setModel((m: AnyRecord) => {
        const next: AnyRecord = { ...m, prices: { ...(m.prices || {}) } };
        const row: AnyRecord = { ...(next.prices[role] || {}) };
        row['Precio jornada'] = value;

        if (value == null || String(value).trim() === '') {
          row['Precio Día extra/Festivo'] = '';
          row['Travel day'] = '';
        } else {
          const derived = computeFromDaily(value, m.params);
          row['Precio Día extra/Festivo'] = derived['Precio Día extra/Festivo'];
          row['Travel day'] = derived['Travel day'];
        }
        next.prices[role] = row;
        return next;
      });
    } else {
      setPrice(role, header, value);
    }
  };

  const p: AnyRecord = model.params || {};

  // Registrar función de exportación PDF
  const exportFunction = useCallback(async () => {
    try {
      await exportCondicionesToPDF(
        project,
        'publicidad',
        model,
        PRICE_HEADERS_PUBLI,
        roles
      );
    } catch (error) {
      console.error('Error exporting condiciones publicidad PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  }, [project, model, roles]);

  useEffect(() => {
    if (onRegisterExport) {
      onRegisterExport(exportFunction);
    }
  }, [onRegisterExport, exportFunction]);

  return (
    <div className='space-y-6'>
      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4'>
        <div className='flex items-center gap-2 mb-3'>
          <button
            onClick={() => setShowParams(v => !v)}
            className='w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-accent'
            title={showParams ? 'Contraer' : 'Desplegar'}
            aria-label='Alternar parámetros'
            aria-expanded={showParams}
            aria-controls='publicidad-params'
            type='button'
          >
            {showParams ? '−' : '+'}
          </button>
          <h4 className='text-brand font-semibold m-0'>
            Parámetros de cálculo
          </h4>
        </div>

        <div className='text-xs text-zinc-400 mb-3'>
          Los importes se calculan a partir de <strong>Precio jornada</strong>.
        </div>

        {showParams && (
          <div
            id='publicidad-params'
            ref={paramsRef}
            tabIndex={-1}
            role='region'
            aria-label='Parámetros de publicidad'
            className='grid grid-cols-1 sm:grid-cols-3 gap-3'
          >
            <ParamInput
              label='Jornada laboral'
              suffix='h'
              duo={[
                {
                  value: p.jornadaTrabajo ?? '10',
                  onChange: (v: string) => setParam('jornadaTrabajo', v),
                },
                {
                  value: p.jornadaComida ?? '1',
                  onChange: (v: string) => setParam('jornadaComida', v),
                },
              ]}
            />
            <ParamInput
              label='Día extra/Festivo (×)'
              value={p.factorFestivo ?? '1.75'}
              onChange={(v: string) => setParam('factorFestivo', v)}
            />
            <ParamInput
              label='Hora extra festivas/nocturnas (×)'
              value={p.factorHoraExtraFestiva ?? '1.5'}
              onChange={(v: string) => setParam('factorHoraExtraFestiva', v)}
            />
            <ParamInput
              label='Cortesía (min)'
              value={p.cortesiaMin ?? '15'}
              onChange={(v: string) => setParam('cortesiaMin', v)}
            />
            <ParamInput
              label='Turn Around Diario (h)'
              value={p.taDiario ?? '10'}
              onChange={(v: string) => setParam('taDiario', v)}
            />
            <ParamInput
              label='Turn Around Fin de semana (h)'
              value={p.taFinde ?? '48'}
              onChange={(v: string) => setParam('taFinde', v)}
            />
            <ParamInput
              label='Nocturnidad complemento (€)'
              value={p.nocturnidadComplemento ?? '50'}
              onChange={(v: string) => setParam('nocturnidadComplemento', v)}
            />
            <ParamInput
              label='Nocturno (inicio / fin)'
              duo={[
                {
                  value: p.nocturnoIni ?? '02:00',
                  onChange: (v: string) => setParam('nocturnoIni', v),
                },
                {
                  value: p.nocturnoFin ?? '06:00',
                  onChange: (v: string) => setParam('nocturnoFin', v),
                },
              ]}
            />
            <ParamInput
              label='Desayuno (€)'
              value={p.dietaDesayuno ?? '10'}
              onChange={(v: string) => setParam('dietaDesayuno', v)}
            />
            <ParamInput
              label='Comida (€)'
              value={p.dietaComida ?? '20'}
              onChange={(v: string) => setParam('dietaComida', v)}
            />
            <ParamInput
              label='Cena (€)'
              value={p.dietaCena ?? '30'}
              onChange={(v: string) => setParam('dietaCena', v)}
            />
            <ParamInput
              label='Dieta s/ pernocta (€)'
              value={p.dietaSinPernocta ?? '50'}
              onChange={(v: string) => setParam('dietaSinPernocta', v)}
            />
            <ParamInput
              label='Alojamiento + desayuno (€)'
              value={p.dietaAlojDes ?? '70'}
              onChange={(v: string) => setParam('dietaAlojDes', v)}
            />
            <ParamInput
              label='Gastos de bolsillo (€)'
              value={p.gastosBolsillo ?? '10'}
              onChange={(v: string) => setParam('gastosBolsillo', v)}
            />
            <ParamInput
              label='Kilometraje (€/km)'
              value={p.kilometrajeKm ?? '0,40'}
              onChange={(v: string) => setParam('kilometrajeKm', v)}
            />
            <ParamInput
              label='Transporte (€/día)'
              value={p.transporteDia ?? '12'}
              onChange={(v: string) => setParam('transporteDia', v)}
            />
          </div>
        )}
      </section>

      <div className='text-xs text-zinc-400 mb-4 flex items-center justify-between'>
        <span>
          Los precios base están preestablecidos. <strong>Precio Día extra/Festivo</strong> y <strong>Travel day</strong> se calculan automáticamente desde el precio jornada. El resto son manuales.
        </span>
        <div className='relative'>
          {PRICE_ROLES_PUBLI.filter(r => !roles.includes(r)).length === 0 ? (
            <button
              disabled
              className='px-3 py-1 text-sm bg-gray-500 text-white rounded-lg cursor-not-allowed'
            >
              ✓ Todos los roles
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowRoleSelect(!showRoleSelect)}
                className='px-3 py-1 text-sm bg-brand text-white rounded-lg hover:bg-brand/80'
              >
                + Añadir rol
              </button>
              {showRoleSelect && (
                <div 
                  className='absolute right-0 top-full mt-1 bg-blue-200 border border-blue-300 dark:bg-amber-800 dark:border-amber-600 rounded-lg shadow-lg z-10 min-w-[150px] max-h-60 overflow-y-auto'
                  tabIndex={-1}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setTimeout(() => setShowRoleSelect(false), 200);
                    }
                  }}
                >
                  {PRICE_ROLES_PUBLI.filter(r => !roles.includes(r)).map((role: string) => (
                    <button
                      key={role}
                      onClick={() => addRole(role)}
                      className='w-full text-left px-3 py-2 text-sm text-white hover:bg-blue-300 dark:hover:bg-amber-600/40 transition-colors'
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 overflow-x-auto'>
        <table className='min-w-[920px] w-full border-collapse text-sm'>
          <thead>
            <tr>
              <Th align='left'>Rol / Precio</Th>
              {PRICE_HEADERS_PUBLI.map(col => (
                <Th key={col} align='center'>{col}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role: string) => (
              <tr key={role} className='relative'>
                <Td className='font-semibold whitespace-nowrap' align='middle'>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el rol "${role}"?`)) {
                          removeRole(role);
                        }
                      }}
                      className='text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:text-amber-500 dark:hover:bg-amber-900/20 font-bold text-sm w-6 h-6 flex items-center justify-center rounded transition-all hover:scale-110'
                      title='Eliminar rol'
                    >
                      ✕
                    </button>
                    <span>{role}</span>
                  </div>
                </Td>
                {PRICE_HEADERS_PUBLI.map(h => (
                  <Td key={h} align='middle'>
                    <input
                      type='text'
                      value={model.prices?.[role]?.[h] ?? ''}
                      onChange={e => handlePriceChange(role, h, e.target.value)}
                      placeholder='€'
                      className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left'
                    />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4'>
        <h4 className='text-brand font-semibold mb-2'>Leyenda cálculos</h4>
        <TextAreaAuto
          value={renderWithParams(model.legendTemplate, model.params)}
          onChange={v =>
            setText('legendTemplate', visibleToTemplate(v, model.params))
          }
          className='min-h-[160px]'
        />
      </section>

      <InfoCard
        title='Festivos'
        value={renderWithParams(model.festivosTemplate, model.params)}
        onChange={v =>
          setText('festivosTemplate', visibleToTemplate(v, model.params))
        }
      />
      <InfoCard
        title='Horarios'
        value={renderWithParams(model.horariosTemplate, model.params)}
        onChange={v =>
          setText('horariosTemplate', visibleToTemplate(v, model.params))
        }
      />
      <InfoCard
        title='Dietas'
        value={renderWithParams(model.dietasTemplate, model.params)}
        onChange={v =>
          setText('dietasTemplate', visibleToTemplate(v, model.params))
        }
      />
      <InfoCard
        title='Transportes'
        value={renderWithParams(model.transportesTemplate, model.params)}
        onChange={v =>
          setText('transportesTemplate', visibleToTemplate(v, model.params))
        }
      />
      <InfoCard
        title='Alojamiento'
        value={renderWithParams(model.alojamientoTemplate, model.params)}
        onChange={v =>
          setText('alojamientoTemplate', visibleToTemplate(v, model.params))
        }
      />
      <InfoCard
        title='Convenio'
        value={renderWithParams(model.convenioTemplate, model.params)}
        onChange={v =>
          setText('convenioTemplate', visibleToTemplate(v, model.params))
        }
        rightAddon={
          <a
            href='https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-6846'
            target='_blank'
            rel='noreferrer'
            className='text-brand hover:underline text-sm'
            title='Abrir BOE'
          >
            BOE
          </a>
        }
      />
    </div>
  );
}

export default memo(CondicionesPublicidad);

function loadOrSeedPublicidad(storageKey: string): AnyRecord {
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
    legendTemplate: defaultLegendPubli,
    festivosTemplate: globalDynamicFestivosText,
    horariosTemplate: defaultHorarios,
    dietasTemplate: defaultDietas,
    transportesTemplate: defaultTransportes,
    alojamientoTemplate: defaultAlojamiento,
    convenioTemplate: defaultConvenio,
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
      jornadaTrabajo: parsed.params?.jornadaTrabajo ?? '10',
      jornadaComida: parsed.params?.jornadaComida ?? '1',
      factorFestivo: parsed.params?.factorFestivo ?? '1.75',
      factorHoraExtraFestiva: parsed.params?.factorHoraExtraFestiva ?? '1.5',
      cortesiaMin: parsed.params?.cortesiaMin ?? '15',
      taDiario: parsed.params?.taDiario ?? '10',
      taFinde: parsed.params?.taFinde ?? '48',
      nocturnidadComplemento: parsed.params?.nocturnidadComplemento ?? '50',
      nocturnoIni: parsed.params?.nocturnoIni ?? '02:00',
      nocturnoFin: parsed.params?.nocturnoFin ?? '06:00',
      dietaDesayuno: parsed.params?.dietaDesayuno ?? '10',
      dietaComida: parsed.params?.dietaComida ?? '20',
      dietaCena: parsed.params?.dietaCena ?? '30',
      dietaSinPernocta: parsed.params?.dietaSinPernocta ?? '50',
      dietaAlojDes: parsed.params?.dietaAlojDes ?? '60',
      gastosBolsillo: parsed.params?.gastosBolsillo ?? '10',
      kilometrajeKm: parsed.params?.kilometrajeKm ?? '0,40',
      transporteDia: parsed.params?.transporteDia ?? '12',
    };

    parsed.legendTemplate = parsed.legendTemplate ?? defaultLegendPubli;
    parsed.festivosTemplate = parsed.festivosTemplate ?? globalDynamicFestivosText;
    parsed.horariosTemplate = parsed.horariosTemplate ?? defaultHorarios;
    parsed.dietasTemplate = parsed.dietasTemplate ?? defaultDietas;
    parsed.transportesTemplate = parsed.transportesTemplate ?? defaultTransportes;
    parsed.alojamientoTemplate = parsed.alojamientoTemplate ?? defaultAlojamiento;
    parsed.convenioTemplate = parsed.convenioTemplate ?? defaultConvenio;

    return parsed;
    }

    return fallback;
  } catch (error) {
    console.error('Error loading publicidad conditions:', error);
    return fallback;
  }
}


