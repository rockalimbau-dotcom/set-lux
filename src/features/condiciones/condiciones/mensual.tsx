import { Th, Td } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect, useMemo, useState, useRef, memo } from 'react';

import { PRICE_HEADERS, PRICE_ROLES } from './shared.constants';
import { renderWithParams, visibleToTemplate, loadJSON, TextAreaAuto, InfoCard, ParamInput } from './shared';
import { DEFAULT_FESTIVOS_TEXT, generateDynamicFestivosText } from '@shared/constants/festivos';
import { exportCondicionesToPDF } from '../utils/exportPDF';

type AnyRecord = Record<string, any>;

const defaultLegend = `Tarifa mensual: Este precio equivale al precio semanal multiplicado por {{SEMANAS_MES}} semanas.
Tarifa semanal: Este precio equivale a semanas completas de {{DIAS_DIARIO}} días ({{DIAS_JORNADA}} días de trabajo de {{JORNADA_TRABAJO}}h + {{JORNADA_COMIDA}}h para el almuerzo/cena).
Precio diario: Es el resultado de dividir el precio mensual entre 30 días.
Precio jornada: Precio equivalente a semanas incompletas (menos de {{DIAS_DIARIO}} días) de trabajo. Se calcula dividiendo el precio mensual entre el resultado de {{DIAS_JORNADA}} × {{SEMANAS_MES}}.
Precio refuerzo: Precio para el trabajador que trabaja días esporádicos.
Precio día extra/festivo: Es el precio equivalente al de jornada multiplicado por {{FACTOR_FESTIVO}}.
Travel day: Es el precio equivalente al de jornada dividido entre {{DIV_TRAVEL}}.
Horas extras: Resultado de dividir el precio mensual entre ({{HORAS_SEMANA}} × {{SEMANAS_MES}}) y aplicar un factor {{FACTOR_HORA_EXTRA}}×. Se considera hora extra a partir de {{CORTESIA_MIN}} minutos después del fin de la jornada pactada. A partir de la segunda hora extra no habrá cortesía de {{CORTESIA_MIN}}′. Las horas extras son voluntarias y deberán comunicarse antes del final de la jornada pactada.`;

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

const defaultHorarios = `TURN AROUND: El descanso entre jornadas será de {{TA_DIARIO}}h entre días laborables y de {{TA_FINDE}}h los fines de semana. Todas las horas que no se descansen serán consideradas horas extras.
NOCTURNIDADES: Se considerará jornada nocturna cuando el inicio o final de la jornada sea entre las {{NOCTURNO_INI}} y las {{NOCTURNO_FIN}}. Se bonificará con un complemento salarial equivalente a una hora extra a cada miembro del equipo.`;

const defaultDietas = `Se ingresarán en nómina (importe libre de impuestos) las siguientes cantidades cuando no se disponga de manutención en el rodaje así como cuando se trabaje fuera del centro de actividades habitual. Se incrementará en un 50% fuera del territorio nacional. También se efectuará un anticipo de éstas.
Comida: {{DIETA_COMIDA}}€
Cena: {{DIETA_CENA}}€
Dieta completa sin pernocta: {{DIETA_SIN_PERNOCTA}} €
Dieta completa y desayuno: {{DIETA_ALOJ_DES}}€
Gastos de bolsillo: {{GASTOS_BOLSILLO}}€`;

const defaultTransportes = `Cuando por necesidades de rodaje, el trabajador se desplace fuera del centro habitual de trabajo, se abonará la cantidad de {{KM_EURO}}€/km más los peajes y gastos de estacionamiento pertinentes.
En caso de transportar a miembros del equipo se bonificará también con la cantidad de {{TRANSPORTE_DIA}}€/día extra.`;

const defaultAlojamiento = `En caso de tener que pernoctar fuera del domicilio habitual del trabajador, la productora deberá facilitar un hotel (mínimo 3 estrellas) con habitación individual y las dietas y gastos de bolsillo pertinentes.`;

const defaultPrepro = `El gaffer del proyecto tendrá derecho a un mínimo de 1 día de trabajo por semana de rodaje.
El best boy del proyecto tendrá derecho a un mínimo de 1 día de trabajo por cada dos semanas de rodaje.
De esta forma el gaffer y best boy serán dados de alta durante la pre producción del proyecto para trabajar en las tareas previas al inicio del rodaje (localizaciones técnicas, listas de material, calendarios, etc).`;

const defaultConvenio = `También se tendrá en cuenta el convenio “Resolución de 22 de marzo de 2024, de la Dirección General de Trabajo, por la que se registra y publica el III Convenio colectivo de ámbito estatal de la industria de producción audiovisual (técnicos).`;

function parseNum(input: unknown): number {
  if (input == null) return NaN;
  let s = String(input)
    .trim()
    .replace(/\u00A0/g, '')
    .replace(/[€%]/g, '')
    .replace(/\s+/g, '');
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}

function fmtMoney(n: number): string {
  if (!isFinite(n)) return '';
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(2).replace('.', ',');
}

interface CondicionesMensualProps {
  project: AnyRecord | null | undefined;
  onChange?: (payload: AnyRecord) => void;
  onRegisterExport?: (fn: () => void) => void;
}

function CondicionesMensual({ project, onChange = () => {}, onRegisterExport }: CondicionesMensualProps) {
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'tmp';
    return `cond_${base}_mensual`;
  }, [project?.id, project?.nombre]);

  // Cargar festivos dinámicos al montar el componente
  useEffect(() => {
    updateDynamicFestivos();
  }, []);

  const [showParams, setShowParams] = useState(false);
  const paramsRef = useRef<HTMLDivElement | null>(null);
  const [model, setModel] = useLocalStorage<AnyRecord>(storageKey, () =>
    loadOrSeed(storageKey)
  );
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastEmittedRef = useRef('');

  useEffect(() => {
    const payload = { mensual: model };
    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChangeRef.current?.(payload);
    }
  }, [model]);


  const setText = (key: string, value: string) => setModel((m: AnyRecord) => ({ ...m, [key]: value }));
  const setParam = (key: string, value: string) =>
    setModel((m: AnyRecord) => ({ ...m, params: { ...(m.params || {}), [key]: value } }));

  // Funciones para gestionar roles
  const addRole = (newRole: string) => {
    if (!newRole) return;
    
    setModel((m: AnyRecord) => {
      const currentRoles = m.roles || PRICE_ROLES;
      if (currentRoles.includes(newRole)) return m;
      
      // Mantener el orden de PRICE_ROLES
      const nextRoles: string[] = [];
      const currentSet = new Set(currentRoles);
      
      for (const role of PRICE_ROLES) {
        if (role === newRole) {
          nextRoles.push(newRole);
        } else if (currentSet.has(role)) {
          nextRoles.push(role);
        }
      }
      
      if (!PRICE_ROLES.includes(newRole)) {
        nextRoles.push(newRole);
      }
      
      return { ...m, roles: nextRoles };
    });
    setShowRoleSelect(false);
  };
  
  const removeRole = (role: string) => {
    setModel((m: AnyRecord) => {
      const roles = m.roles || PRICE_ROLES;
      const nextRoles = roles.filter((r: string) => r !== role);
      const nextPrices = { ...m.prices };
      delete nextPrices[role];
      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };
  
  const roles = model.roles || PRICE_ROLES;

  //

  const p: AnyRecord = model.params || {};

  const handleRoleChange = (role: string, header: string, rawVal: string) => {
    const val = rawVal;
    setModel((m: AnyRecord) => {
      const next: AnyRecord = { ...m, prices: { ...(m.prices || {}) } };
      const row: AnyRecord = { ...(next.prices[role] || {}) };
      row[header] = val;

      if (header === 'Precio mensual') {
        const pm = parseNum(val);
        const semanasMes = parseNum(p.semanasMes ?? '4');
        const diasJornada = parseNum(p.diasJornada ?? '5');
        const factorFestivo = parseNum(p.factorFestivo ?? '1.75');
        const divTravel = parseNum(p.divTravel ?? '2');
        const horasSemana = parseNum(p.horasSemana ?? '45');
        const factorHoraExtra = parseNum(p.factorHoraExtra ?? '1.5');

        const mensualOk = isFinite(pm) ? pm : NaN;
        const semOk = isFinite(semanasMes) && semanasMes > 0 ? semanasMes : NaN;
        const djOk = isFinite(diasJornada) && diasJornada > 0 ? diasJornada : NaN;
        const divTravelOk = isFinite(divTravel) && divTravel > 0 ? divTravel : NaN;
        const hsOk = isFinite(horasSemana) && horasSemana > 0 ? horasSemana : NaN;
        const ffOk = isFinite(factorFestivo) ? factorFestivo : NaN;
        const fheOk = isFinite(factorHoraExtra) ? factorHoraExtra : NaN;

        const semanal = isFinite(mensualOk / semOk) ? mensualOk / semOk : NaN;
        const diario = isFinite(mensualOk / 30) ? mensualOk / 30 : NaN;
        const jornada = isFinite(mensualOk / (djOk * semOk))
          ? mensualOk / (djOk * semOk)
          : NaN;
        const festivo = isFinite(jornada * ffOk) ? jornada * ffOk : NaN;
        const travel = isFinite(jornada / divTravelOk)
          ? jornada / divTravelOk
          : NaN;
        const baseHora = isFinite(mensualOk / (hsOk * semOk))
          ? mensualOk / (hsOk * semOk)
          : NaN;
        const horaExtra = isFinite(baseHora * fheOk) ? baseHora * fheOk : NaN;

        row['Precio semanal'] = isFinite(semanal) ? fmtMoney(semanal) : '';
        row['Precio diario'] = isFinite(diario) ? fmtMoney(diario) : '';
        row['Precio jornada'] = isFinite(jornada) ? fmtMoney(jornada) : '';
        row['Precio Día extra/Festivo'] = isFinite(festivo) ? fmtMoney(festivo) : '';
        row['Travel day'] = isFinite(travel) ? fmtMoney(travel) : '';
        row['Horas extras'] = isFinite(horaExtra) ? fmtMoney(horaExtra) : '';
      }

      next.prices[role] = row;
      return next;
    });
  };

  // Registrar función de exportación PDF
  useEffect(() => {
    if (onRegisterExport) {
      onRegisterExport(async () => {
        try {
          await exportCondicionesToPDF(
            project,
            'mensual',
            model,
            PRICE_HEADERS,
            roles
          );
        } catch (error) {
          console.error('Error exporting condiciones mensual PDF:', error);
          alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, project]);

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
            aria-controls='mensual-params'
            type='button'
          >
            {showParams ? '−' : '+'}
          </button>
          <h4 className='text-brand font-semibold m-0'>
            Parámetros de cálculo
          </h4>
        </div>

        <div className='text-xs text-zinc-400 mb-3'>
          Ajusta aquí los parámetros que alimentan los textos y cálculos de esta
          sección.
        </div>

        {showParams && (
          <div
            id='mensual-params'
            ref={paramsRef}
            tabIndex={-1}
            role='region'
            aria-label='Parámetros mensuales'
            className='grid grid-cols-1 sm:grid-cols-3 gap-3'
          >
            <ParamInput
              label='Jornada laboral'
              suffix='h'
              duo={[
                {
                  value: p.jornadaTrabajo ?? '9',
                  onChange: (v: string) => setParam('jornadaTrabajo', v),
                },
                {
                  value: p.jornadaComida ?? '1',
                  onChange: (v: string) => setParam('jornadaComida', v),
                },
              ]}
            />
            <ParamInput
              label='Días jornada'
              value={p.diasJornada ?? '5'}
              onChange={(v: string) => setParam('diasJornada', v)}
            />
            <ParamInput
              label='Días diario'
              value={p.diasDiario ?? '7'}
              onChange={(v: string) => setParam('diasDiario', v)}
            />
            <ParamInput
              label='Semanas por mes'
              value={p.semanasMes ?? '4'}
              onChange={(v: string) => setParam('semanasMes', v)}
            />
            <ParamInput
              label='Horas semanales'
              value={p.horasSemana ?? '45'}
              onChange={(v: string) => setParam('horasSemana', v)}
            />
            <ParamInput
              label='Día extra/Festivo (×)'
              value={p.factorFestivo ?? '1.75'}
              onChange={(v: string) => setParam('factorFestivo', v)}
            />
            <ParamInput
              label='Hora extra (×)'
              value={p.factorHoraExtra ?? '1.5'}
              onChange={(v: string) => setParam('factorHoraExtra', v)}
            />
            <ParamInput
              label='Contab. H. extra (día ini / fin)'
              duo={[
                {
                  value: (p.heCierreIni ?? '').toString(),
                  onChange: (v: string) => setParam('heCierreIni', v),
                },
                {
                  value: (p.heCierreFin ?? '').toString(),
                  onChange: (v: string) => setParam('heCierreFin', v),
                },
              ]}
            />
            <ParamInput
              label='Travel day (divisor)'
              value={p.divTravel ?? '2'}
              onChange={(v: string) => setParam('divTravel', v)}
            />
            <ParamInput
              label='Cortesía (min)'
              value={p.cortesiaMin ?? '15'}
              onChange={(v: string) => setParam('cortesiaMin', v)}
            />
            <ParamInput
              label='Turn Around Diario (h)'
              value={p.taDiario ?? '12'}
              onChange={(v: string) => setParam('taDiario', v)}
            />
            <ParamInput
              label='Turn Around Fin de semana (h)'
              value={p.taFinde ?? '48'}
              onChange={(v: string) => setParam('taFinde', v)}
            />
            <ParamInput
              label='Nocturno (inicio / fin)'
              duo={[
                {
                  value: p.nocturnoIni ?? '22:00',
                  onChange: (v: string) => setParam('nocturnoIni', v),
                },
                {
                  value: p.nocturnoFin ?? '06:00',
                  onChange: (v: string) => setParam('nocturnoFin', v),
                },
              ]}
            />
            <ParamInput
              label='Comida (€)'
              value={p.dietaComida ?? '14,02'}
              onChange={(v: string) => setParam('dietaComida', v)}
            />
            <ParamInput
              label='Cena (€)'
              value={p.dietaCena ?? '16,36'}
              onChange={(v: string) => setParam('dietaCena', v)}
            />
            <ParamInput
              label='Dieta s/ pernocta (€)'
              value={p.dietaSinPernocta ?? '30,38'}
              onChange={(v: string) => setParam('dietaSinPernocta', v)}
            />
            <ParamInput
              label='Alojamiento + desayuno (€)'
              value={p.dietaAlojDes ?? '51,39'}
              onChange={(v: string) => setParam('dietaAlojDes', v)}
            />
            <ParamInput
              label='Gastos de bolsillo (€)'
              value={p.gastosBolsillo ?? '8,81'}
              onChange={(v: string) => setParam('gastosBolsillo', v)}
            />
            <ParamInput
              label='Kilometraje (€/km)'
              value={p.kilometrajeKm ?? '0,26'}
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
          Introduce el <strong>precio mensual</strong> y el resto de importes se
          calcularán automáticamente. Solo tendrás que indicar manualmente el{' '}
          <strong>precio de refuerzo</strong>.
        </span>
        <div className='relative'>
          {PRICE_ROLES.filter(r => !roles.includes(r)).length === 0 ? (
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
                  {PRICE_ROLES.filter(r => !roles.includes(r)).map((role: string) => (
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
              {PRICE_HEADERS.map(col => (
                <Th key={col} align='center'>{col}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role: string) => (
              <tr key={role} className='relative'>
                <Td className='font-semibold whitespace-nowrap' align='top'>
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
                {PRICE_HEADERS.map(h => (
                  <Td key={h} align='top'>
                    <input
                      type='text'
                      value={model.prices?.[role]?.[h] ?? ''}
                      onChange={e => handleRoleChange(role, h, e.target.value)}
                      placeholder='€'
                      className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-center'
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
          className='min-h-[180px]'
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
        title='Pre producción'
        value={renderWithParams(model.preproTemplate, model.params)}
        onChange={v =>
          setText('preproTemplate', visibleToTemplate(v, model.params))
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

export default memo(CondicionesMensual);

function loadOrSeed(storageKey: string): AnyRecord {
  const fallback: AnyRecord = {
    roles: ['Gaffer', 'Eléctrico'],
    prices: {},
    legendTemplate: defaultLegend,
    festivosTemplate: globalDynamicFestivosText,
    horariosTemplate: defaultHorarios,
    dietasTemplate: defaultDietas,
    transportesTemplate: defaultTransportes,
    alojamientoTemplate: defaultAlojamiento,
    preproTemplate: defaultPrepro,
    convenioTemplate: defaultConvenio,
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
      dietaComida: '14,02',
      dietaCena: '16,36',
      dietaSinPernocta: '30,38',
      dietaAlojDes: '51,39',
      gastosBolsillo: '8,81',
      kilometrajeKm: '0,26',
      transporteDia: '12',
      heCierreIni: '',
      heCierreFin: '',
    },
  };

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
    if (parsed.prepro && !parsed.preproTemplate) {
      parsed.preproTemplate = parsed.prepro;
      delete parsed.prepro;
    }
    if (parsed.convenio && !parsed.convenioTemplate) {
      parsed.convenioTemplate = parsed.convenio;
      delete parsed.convenio;
    }

    parsed.params = {
      jornadaTrabajo: parsed.params?.jornadaTrabajo ?? '9',
      jornadaComida: parsed.params?.jornadaComida ?? '1',
      diasJornada: parsed.params?.diasJornada ?? '5',
      diasDiario: parsed.params?.diasDiario ?? '7',
      semanasMes: parsed.params?.semanasMes ?? '4',
      horasSemana: parsed.params?.horasSemana ?? '45',
      factorFestivo: parsed.params?.factorFestivo ?? '1.75',
      factorHoraExtra: parsed.params?.factorHoraExtra ?? '1.5',
      divTravel: parsed.params?.divTravel ?? '2',
      cortesiaMin: parsed.params?.cortesiaMin ?? '15',
      taDiario: parsed.params?.taDiario ?? '12',
      taFinde: parsed.params?.taFinde ?? '48',
      nocturnoIni: parsed.params?.nocturnoIni ?? '22:00',
      nocturnoFin: parsed.params?.nocturnoFin ?? '06:00',
      dietaComida: parsed.params?.dietaComida ?? '14,02',
      dietaCena: parsed.params?.dietaCena ?? '16,36',
      dietaSinPernocta: parsed.params?.dietaSinPernocta ?? '30,38',
      dietaAlojDes: parsed.params?.dietaAlojDes ?? '51,39',
      gastosBolsillo: parsed.params?.gastosBolsillo ?? '8,81',
      kilometrajeKm: parsed.params?.kilometrajeKm ?? '0,26',
      transporteDia: parsed.params?.transporteDia ?? '12',
      heCierreIni: parsed.params?.heCierreIni ?? '',
      heCierreFin: parsed.params?.heCierreFin ?? '',
    };

    parsed.legendTemplate = parsed.legendTemplate ?? defaultLegend;
    parsed.festivosTemplate = parsed.festivosTemplate ?? globalDynamicFestivosText;
    parsed.horariosTemplate = parsed.horariosTemplate ?? defaultHorarios;
    parsed.dietasTemplate = parsed.dietasTemplate ?? defaultDietas;
    parsed.transportesTemplate = parsed.transportesTemplate ?? defaultTransportes;
    parsed.alojamientoTemplate = parsed.alojamientoTemplate ?? defaultAlojamiento;
    parsed.preproTemplate = parsed.preproTemplate ?? defaultPrepro;
    parsed.convenioTemplate = parsed.convenioTemplate ?? defaultConvenio;

    return parsed;
  }

  return fallback;
}


