import { useEffect, useMemo, useState, useRef, memo } from 'react';
import { Th, Td } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';

import { PRICE_HEADERS, PRICE_ROLES } from './shared.constants';
import { extractFestivosDatesForPlan, renderWithParams, visibleToTemplate, loadJSON, TextAreaAuto, InfoCard, ParamInput, restoreStrongTags } from './shared';
import { DEFAULT_FESTIVOS_TEXT, generateDynamicFestivosText } from '@shared/constants/festivos';
import { exportCondicionesToPDF } from '../utils/exportPDF';

interface CondicionesSemanalProps {
  project: { id?: string; nombre?: string };
  onChange?: (patch: any) => void;
  onRegisterExport?: (fn: () => void) => void;
  readOnly?: boolean;
}

/** Plantillas por defecto */
const defaultLegend = `<strong>Tarifa mensual:</strong> Este precio equivale al precio semana multiplicado por {{SEMANAS_MES}} semanas.
<strong>Tarifa semanal:</strong> Este precio equivale a semanas completas de {{DIAS_DIARIO}} días ({{DIAS_JORNADA}} días de trabajo de {{JORNADA_TRABAJO}}h + {{JORNADA_COMIDA}}h para el almuerzo/cena).
<strong>Precio diario:</strong> Este precio es el resultado de dividir el precio semanal entre {{DIAS_DIARIO}} días.
<strong>Precio jornada:</strong> Precio equivalente a semanas incompletas (menos de {{DIAS_DIARIO}} días) de trabajo. Equivale a dividir el precio semanal entre {{DIAS_JORNADA}}.
<strong>Precio refuerzo:</strong> Precio para el trabajador que trabaja días esporádicos.
<strong>Precio Día extra / Festivo:</strong> Es el precio equivalente al precio jornada multiplicado por {{FACTOR_FESTIVO}}.
<strong>Precio Travel Day:</strong> Es el precio equivalente al precio jornada entre {{DIV_TRAVEL}}.
<strong>Horas extras:</strong> Resultado de dividir el precio semanal entre las horas trabajadas semanales ({{HORAS_SEMANA}}) y bonificado en un {{FACTOR_HORA_EXTRA}}x. Será considerada hora extra a partir de {{CORTESIA_MIN}} minutos después del fin de la jornada pactada. A partir de la segunda hora extra no habrá cortesía de {{CORTESIA_MIN}}′. Las horas extras son de carácter voluntario y tendrán que ser comunicadas antes del final de la jornada pactada.`;

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

const defaultHorarios = `<strong>Turn around:</strong> El descanso entre jornadas será de {{TA_DIARIO}}h entre días laborables y de {{TA_FINDE}}h los fines de semana. Todas las horas que no se descansen serán consideradas horas extras.
<strong>Nocturnidad:</strong> Se considerará jornada nocturna cuando el inicio o final de la jornada sea entre las {{NOCTURNO_INI}} y las {{NOCTURNO_FIN}}. Se bonificará con un complemento salarial equivalente a una hora extra a cada miembro del equipo.`;

const defaultDietas = `Se ingresarán en nómina (importe libre de impuestos) las siguientes cantidades cuando no se disponga de manutención en el rodaje así como cuando se trabaje fuera del centro de actividades habitual. Se incrementará en un 50% fuera del territorio nacional. También se efectuará un anticipo de éstas.
<strong>Comida:</strong> {{DIETA_COMIDA}}€
<strong>Cena:</strong> {{DIETA_CENA}}€
<strong>Dieta completa sin pernocta:</strong> {{DIETA_SIN_PERNOCTA}} €
<strong>Dieta completa y desayuno:</strong> {{DIETA_ALOJ_DES}}€
<strong>Gastos de bolsillo:</strong> {{GASTOS_BOLSILLO}}€`;

const defaultTransportes = `Cuando por necesidades de rodaje, el trabajador se desplace fuera del centro habitual de trabajo, se abonará la cantidad de {{KM_EURO}}€/km más los peajes y gastos de estacionamiento pertinentes.
En caso de transportar a miembros del equipo se bonificará también con la cantidad de {{TRANSPORTE_DIA}}€/día extra.`;

const defaultAlojamiento = `En caso de tener que pernoctar fuera del domicilio habitual del trabajador, la productora deberá facilitar un hotel (mínimo 3 estrellas) con habitación individual y las dietas y gastos de bolsillo pertinentes.`;

const defaultPrepro = `El gaffer del proyecto tendrá derecho a un mínimo de 1 día de trabajo por semana de rodaje.
El best boy del proyecto tendrá derecho a un mínimo de 1 día de trabajo por cada dos semanas de rodaje.
De esta forma el gaffer y best boy serán dados de alta durante la pre producción del proyecto para trabajar en las tareas previas al inicio del rodaje (localizaciones técnicas, listas de material, calendarios, etc).`;

const defaultConvenio = `También se tendrá en cuenta el convenio “Resolución de 22 de marzo de 2024, de la Dirección General de Trabajo, por la que se registra y publica el III Convenio colectivo de ámbito estatal de la industria de producción audiovisual (técnicos).`;

function CondicionesSemanal({ project, onChange = () => {}, onRegisterExport, readOnly = false }: CondicionesSemanalProps) {
  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `cond_${base}_semanal`;
  }, [project?.id, project?.nombre]);

  // Cargar festivos dinámicos al montar el componente
  useEffect(() => {
    updateDynamicFestivos();
  }, []);

  const [showParams, setShowParams] = useState(false);
  const paramsRef = useRef<HTMLDivElement | null>(null);
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  // Estado por modo (semanal) con persistencia localStorage
  const [model, setModel] = useLocalStorage<any>(storageKey, () =>
    loadOrSeed(storageKey)
  );

  // Guarda la última versión de onChange para no depender de su identidad
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastEmittedRef = useRef('');

  useEffect(() => {
    const festivosRendered = renderWithParams(
      model.festivosTemplate,
      model.params
    );
    const festivosDates = extractFestivosDatesForPlan(festivosRendered);

    const payload = { semanal: { ...model, festivosDates } };
    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChangeRef.current?.(payload);
    }
  }, [model]);

  /* ---------- Helpers edición ---------- */
  const setPrice = (role: string, header: string, value: string) =>
    setModel((m: any) => {
      const next = { ...m, prices: { ...(m.prices || {}) } };
      next.prices[role] = { ...(next.prices[role] || {}), [header]: value };
      return next;
    });

  const setText = (key: string, value: string) => setModel((m: any) => ({ ...m, [key]: value }));

  const setParam = (key: string, value: string) =>
    setModel((m: any) => ({
      ...m,
      params: { ...(m.params || {}), [key]: value },
    }));

  // Funciones para gestionar roles
  const addRole = (newRole: string) => {
    if (!newRole) return;
    
    setModel((m: any) => {
      const currentRoles = m.roles || PRICE_ROLES;
      if (currentRoles.includes(newRole)) return m;
      
      // Mantener el orden de PRICE_ROLES
      const nextRoles: string[] = [];
      const currentSet = new Set(currentRoles);
      
      // Recorrer PRICE_ROLES en orden
      for (const role of PRICE_ROLES) {
        if (role === newRole) {
          // Si es el rol que vamos a añadir, añadirlo aquí
          nextRoles.push(newRole);
        } else if (currentSet.has(role)) {
          // Si ya estaba en la lista, añadirlo
          nextRoles.push(role);
        }
      }
      
      // Si el rol no está en PRICE_ROLES, añadirlo al final
      if (!PRICE_ROLES.includes(newRole)) {
        nextRoles.push(newRole);
      }
      
      return { ...m, roles: nextRoles };
    });
    setShowRoleSelect(false);
  };
  
  const removeRole = (role: string) => {
    setModel((m: any) => {
      const roles = m.roles || PRICE_ROLES;
      const nextRoles = roles.filter((r: string) => r !== role);
      const nextPrices = { ...m.prices };
      delete nextPrices[role];
      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };
  
  // Roles dinámicos del modelo o por defecto
  const roles = model.roles || PRICE_ROLES;

  // ====== CÁLCULOS AUTOMÁTICOS DESDE "PRECIO SEMANAL" ======
  const parseNum = (x: any) => {
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

  const fmt = (n: number) => {
    if (!Number.isFinite(n)) return '';
    if (Math.abs(n % 1) < 1e-9) return String(Math.round(n));
    return n.toFixed(2).replace(/\.?0+$/, '');
  };

  const computeFromWeekly = (weeklyStr: string, params: any) => {
    const w = parseNum(weeklyStr);
    if (!Number.isFinite(w) || w === 0) {
      return {
        'Precio mensual': '',
        'Precio diario': '',
        'Precio jornada': '',
        'Precio Día extra/Festivo': '',
        'Travel day': '',
        'Horas extras': '',
      };
    }
    const semanasMes = parseNum(params?.semanasMes) || 0;
    const diasDiario = parseNum(params?.diasDiario) || 0;
    const diasJornada = parseNum(params?.diasJornada) || 0;
    const factorFestivo = parseNum(params?.factorFestivo) || 0;
    const divTravel = parseNum(params?.divTravel) || 0;
    const horasSemana = parseNum(params?.horasSemana) || 0;
    const factorHora = parseNum(params?.factorHoraExtra) || 0;

    const mensual = semanasMes > 0 ? w * semanasMes : NaN;
    const diario = diasDiario > 0 ? w / diasDiario : NaN;
    const jornada = diasJornada > 0 ? w / diasJornada : NaN;
    const festivo = Number.isFinite(jornada) && factorFestivo > 0 ? jornada * factorFestivo : NaN;
    const travel = Number.isFinite(jornada) && divTravel > 0 ? jornada / divTravel : NaN;
    const extra = horasSemana > 0 && factorHora > 0 ? (w / horasSemana) * factorHora : NaN;

    return {
      'Precio mensual': fmt(mensual),
      'Precio diario': fmt(diario),
      'Precio jornada': fmt(jornada),
      'Precio Día extra/Festivo': fmt(festivo),
      'Travel day': fmt(travel),
      'Horas extras': fmt(extra),
    };
  };

  const handlePriceChange = (role: string, header: string, value: string) => {
    if (header === 'Precio semanal') {
      setModel((m: any) => {
        const next = { ...m, prices: { ...(m.prices || {}) } };
        const row = { ...(next.prices[role] || {}) } as Record<string, string>;
        row['Precio semanal'] = value;
        if (value == null || String(value).trim() === '') {
          row['Precio mensual'] = '';
          row['Precio diario'] = '';
          row['Precio jornada'] = '';
          row['Precio Día extra/Festivo'] = '';
          row['Travel day'] = '';
          row['Horas extras'] = '';
        } else {
          const derived = computeFromWeekly(value, m.params);
          row['Precio mensual'] = derived['Precio mensual'];
          row['Precio diario'] = derived['Precio diario'];
          row['Precio jornada'] = derived['Precio jornada'];
          row['Precio Día extra/Festivo'] = derived['Precio Día extra/Festivo'];
          row['Travel day'] = derived['Travel day'];
          row['Horas extras'] = derived['Horas extras'];
        }
        next.prices[role] = row;
        return next;
      });
    } else {
      setPrice(role, header, value);
    }
  };

  const p = (model.params || {}) as any;

  // Registrar función de exportación PDF
  useEffect(() => {
    if (onRegisterExport) {
      onRegisterExport(async () => {
        try {
          await exportCondicionesToPDF(
            project,
            'semanal',
            model,
            PRICE_HEADERS,
            roles
          );
        } catch (error) {
          console.error('Error exporting condiciones semanal PDF:', error);
          alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, project, roles]);

  return (
    <div className='space-y-6'>
      {/* Parámetros (misma estética) */}
      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4 phase-panel'>
        <div className='flex items-center gap-2 mb-3'>
          <button
            onClick={() => setShowParams(v => !v)}
            className='w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-accent'
            title={showParams ? 'Contraer' : 'Desplegar'}
            aria-label='Alternar parámetros'
            aria-expanded={showParams}
            aria-controls='semanal-params'
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
            id='semanal-params'
            ref={paramsRef}
            tabIndex={-1}
            role='region'
            aria-label='Parámetros semanales'
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
              readOnly={readOnly}
            />
            <ParamInput
              label='Días jornada'
              value={p.diasJornada ?? '5'}
              onChange={(v: string) => setParam('diasJornada', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Días diario'
              value={p.diasDiario ?? '7'}
              onChange={(v: string) => setParam('diasDiario', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Semanas por mes'
              value={p.semanasMes ?? '4'}
              onChange={(v: string) => setParam('semanasMes', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Horas semanales'
              value={p.horasSemana ?? '45'}
              onChange={(v: string) => setParam('horasSemana', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Día extra/Festivo (×)'
              value={p.factorFestivo ?? '1.75'}
              onChange={(v: string) => setParam('factorFestivo', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Hora extra (×)'
              value={p.factorHoraExtra ?? '1.5'}
              onChange={(v: string) => setParam('factorHoraExtra', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Travel day (divisor)'
              value={p.divTravel ?? '2'}
              onChange={(v: string) => setParam('divTravel', v)}
              readOnly={readOnly}
            />

            <ParamInput
              label='Cortesía (min)'
              value={p.cortesiaMin ?? '15'}
              onChange={(v: string) => setParam('cortesiaMin', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Turn Around Diario (h)'
              value={p.taDiario ?? '12'}
              onChange={(v: string) => setParam('taDiario', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Turn Around Fin de semana (h)'
              value={p.taFinde ?? '48'}
              onChange={(v: string) => setParam('taFinde', v)}
              readOnly={readOnly}
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
              readOnly={readOnly}
            />
            <ParamInput
              label='Comida (€)'
              value={p.dietaComida ?? '14.02'}
              onChange={(v: string) => setParam('dietaComida', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Cena (€)'
              value={p.dietaCena ?? '16.36'}
              onChange={(v: string) => setParam('dietaCena', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Dieta s/ pernocta (€)'
              value={p.dietaSinPernocta ?? '30.38'}
              onChange={(v: string) => setParam('dietaSinPernocta', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Alojamiento + desayuno (€)'
              value={p.dietaAlojDes ?? '51.39'}
              onChange={(v: string) => setParam('dietaAlojDes', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Gastos de bolsillo (€)'
              value={p.gastosBolsillo ?? '8.81'}
              onChange={(v: string) => setParam('gastosBolsillo', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Kilometraje (€/km)'
              value={p.kilometrajeKm ?? '0.26'}
              onChange={(v: string) => setParam('kilometrajeKm', v)}
              readOnly={readOnly}
            />
            <ParamInput
              label='Transporte (€/día)'
              value={p.transporteDia ?? '12'}
              onChange={(v: string) => setParam('transporteDia', v)}
              readOnly={readOnly}
            />
          </div>
        )}
      </section>

      {/* Tabla de precios */}
      <div className='text-xs text-zinc-400 mb-4 flex items-center justify-between'>
        <span>
          Introduce el <strong>precio semanal</strong> y el resto de importes se
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
                onClick={() => !readOnly && setShowRoleSelect(!showRoleSelect)}
                disabled={readOnly}
                className={`px-3 py-1 text-sm bg-brand text-white rounded-lg hover:bg-brand/80 btn-add-role ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={readOnly ? 'El proyecto está cerrado' : '+ Añadir rol'}
              >
                + Añadir rol
              </button>
              {showRoleSelect && (
                <div 
                  className='absolute right-0 top-full mt-1 bg-blue-200 border border-blue-300 dark:bg-amber-800 dark:border-amber-600 rounded-lg shadow-lg z-10 min-w-[150px] max-h-60 overflow-y-auto'
                  tabIndex={-1}
                  onBlur={(e) => {
                    // Solo cerrar si no estamos haciendo clic dentro del dropdown
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

      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 overflow-x-auto relative'>
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
                <Td className='font-semibold whitespace-nowrap' align='middle'>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => {
                        if (readOnly) return;
                        if (confirm(`¿Eliminar el rol "${role}"?`)) {
                          removeRole(role);
                        }
                      }}
                      disabled={readOnly}
                      className={`text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:text-amber-500 dark:hover:bg-amber-900/20 font-bold text-sm w-6 h-6 flex items-center justify-center rounded transition-all hover:scale-110 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={readOnly ? 'El proyecto está cerrado' : 'Eliminar rol'}
                    >
                      ✕
                    </button>
                    <span>{role}</span>
                  </div>
                </Td>
                {PRICE_HEADERS.map(h => {
                  const isSemanal = h === 'Precio semanal';
                  const isRefuerzo = h === 'Precio refuerzo';
                  const hasSemanalValue = model.prices?.[role]?.['Precio semanal'];
                  
                  return (
                    <Td key={h} align='center'>
                      <input
                        type='number'
                        value={model.prices?.[role]?.[h] ?? ''}
                        onChange={e => !readOnly && handlePriceChange(role, h, (e.target as HTMLInputElement).value)}
                        placeholder={isSemanal ? '€' : ''}
                        step='0.01'
                        disabled={readOnly || (!isSemanal && !isRefuerzo && !hasSemanalValue)}
                        readOnly={readOnly}
                        className={`w-full px-2 py-1 rounded-lg border border-neutral-border focus:outline-none focus:ring-1 text-center ${
                          readOnly || (!isSemanal && !isRefuerzo && !hasSemanalValue)
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-50' 
                            : 'dark:bg-transparent'
                        }`}
                      />
                    </Td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Leyenda cálculos */}
      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4'>
        <h4 className='text-brand font-semibold mb-2'>Leyenda cálculos</h4>
        <TextAreaAuto
          value={restoreStrongTags(renderWithParams(model.legendTemplate, model.params))}
          onChange={v => setText('legendTemplate', visibleToTemplate(v, model.params))}
          className='min-h-[180px]'
          readOnly={readOnly}
        />
      </section>

      {/* Bloques informativos */}
      <InfoCard
        title='Festivos'
        value={renderWithParams(model.festivosTemplate, model.params)}
        onChange={v => setText('festivosTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title='Horarios'
        value={restoreStrongTags(renderWithParams(model.horariosTemplate, model.params))}
        onChange={v => setText('horariosTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title='Dietas'
        value={restoreStrongTags(renderWithParams(model.dietasTemplate, model.params))}
        onChange={v => setText('dietasTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title='Transportes'
        value={renderWithParams(model.transportesTemplate, model.params)}
        onChange={v => setText('transportesTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title='Alojamiento'
        value={renderWithParams(model.alojamientoTemplate, model.params)}
        onChange={v => setText('alojamientoTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title='Pre producción'
        value={renderWithParams(model.preproTemplate, model.params)}
        onChange={v => setText('preproTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
      />
      <InfoCard
        title='Convenio'
        value={renderWithParams(model.convenioTemplate, model.params)}
        onChange={v => setText('convenioTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
        rightAddon={
          readOnly ? (
            <span className='text-brand text-sm opacity-50 cursor-not-allowed' title='El proyecto está cerrado'>
              BOE
            </span>
          ) : (
            <a
              href='https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-6846'
              target='_blank'
              rel='noreferrer'
              className='text-brand hover:underline text-sm'
              title='Abrir BOE'
            >
              BOE
            </a>
          )
        }
      />
    </div>
  );
}

export default memo(CondicionesSemanal);

function loadOrSeed(storageKey: string) {
  const fallback = {
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
      jornadaTrabajo: '10',
      jornadaComida: '1',
      diasJornada: '5',
      diasDiario: '5',
      semanasMes: '4.33',
      horasSemana: '50',
      factorFestivo: '1.75',
      factorHoraExtra: '1.5',
      divTravel: '2',
      cortesiaMin: '15',
      taDiario: '12',
      taFinde: '12',
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


