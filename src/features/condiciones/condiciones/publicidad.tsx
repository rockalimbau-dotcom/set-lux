// condiciones/publicidad.tsx
import { Th, Td } from '@shared/components';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect, useMemo, useState, useRef, memo } from 'react';

import { PRICE_ROLES } from './shared.constants';
import { extractFestivosDatesForPlan, renderWithParams, visibleToTemplate, loadJSON, TextAreaAuto, InfoCard, ParamInput } from './shared';

type AnyRecord = Record<string, any>;

const defaultLegendPubli = `Precio jornada: Importe base por jornada.
Precio refuerzo: Importe para un trabajador que presta servicios en días esporádicos.
Precio día extra/festivo: Equivale al precio de jornada multiplicado por {{FACTOR_FESTIVO}}.
Travel day: Equivale al precio de jornada dividido entre {{DIV_TRAVEL}}.
Horas extras: Resultado de dividir el precio de jornada entre las horas de jornada ({{JORNADA_TRABAJO}}h + {{JORNADA_COMIDA}}h) y bonificarlo con un factor {{FACTOR_HORA_EXTRA}}×. Se considera hora extra a partir de {{CORTESIA_MIN}} minutos después del fin de la jornada pactada. A partir de la segunda hora extra no habrá cortesía de {{CORTESIA_MIN}}′. Las horas extras son voluntarias y deberán comunicarse antes del final de la jornada pactada.`;

const defaultFestivos = `La jornada y horas en días festivos tendrán un incremento del 75%. (Festivos Cataluña 2025: 1/01, 6/01, 29/03, 01/04, 01/05, 24/06, 15/08, 11/09, 12/10, 01/11, 06/12, 25/12, 26/12)`;
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

const PRICE_HEADERS_PUBLI = [
  'Precio jornada',
  'Precio refuerzo',
  'Precio Día extra/Festivo',
  'Travel day',
  'Horas extras',
];

function CondicionesPublicidad({
  project,
  onChange = () => {},
}: { project: AnyRecord | null | undefined; onChange?: (p: AnyRecord) => void }) {
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'tmp';
    return `cond_${base}_publicidad`;
  }, [project?.id, project?.nombre]);

  const [showParams, setShowParams] = useState(false);
  const paramsRef = useRef<HTMLDivElement | null>(null);
  const [model, setModel] = useLocalStorage<AnyRecord>(storageKey, () =>
    loadOrSeedPublicidad(storageKey)
  );

  const lastEmittedRef = useRef('');

  useEffect(() => {
    const festivosRendered = renderWithParams(
      model.festivosTemplate,
      model.params
    );
    const festivosDates = extractFestivosDatesForPlan(festivosRendered);

    const payload = { publicidad: { ...model, festivosDates } };

    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChange(payload);
    }
  }, [model, storageKey]);

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
    const divTravel = parseNum(params?.divTravel) || 0;
    const jTrab = parseNum(params?.jornadaTrabajo) || 0;
    const jCom = parseNum(params?.jornadaComida) || 0;
    const facHora = parseNum(params?.factorHoraExtra) || 0;

    const festivo = factorFestivo > 0 ? d * factorFestivo : NaN;
    const travel = divTravel > 0 ? d / divTravel : NaN;
    const horasTotales = jTrab + jCom;
    const extra =
      horasTotales > 0 && facHora > 0 ? (d / horasTotales) * facHora : NaN;

    return {
      'Precio Día extra/Festivo': fmt(festivo),
      'Travel day': fmt(travel),
      'Horas extras': fmt(extra),
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
          row['Horas extras'] = '';
        } else {
          const derived = computeFromDaily(value, m.params);
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

  const p: AnyRecord = model.params || {};

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

      <div className='text-xs text-zinc-400'>
        Introduce el <strong>precio jornada</strong>. El resto se calcula
        automáticamente. El <strong>precio de refuerzo</strong> es manual.
      </div>

      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 overflow-x-auto'>
        <table className='min-w-[920px] w-full border-collapse text-sm'>
          <thead>
            <tr>
              <Th>Rol / Precio</Th>
              {PRICE_HEADERS_PUBLI.map(col => (
                <Th key={col}>{col}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRICE_ROLES.map(role => (
              <tr key={role}>
                <Td className='font-semibold whitespace-nowrap'>{role}</Td>
                {PRICE_HEADERS_PUBLI.map(h => (
                  <Td key={h}>
                    <input
                      type='text'
                      value={model.prices?.[role]?.[h] ?? ''}
                      onChange={e => handlePriceChange(role, h, e.target.value)}
                      placeholder='€'
                      className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand'
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

export default memo(CondicionesPublicidad);

function loadOrSeedPublicidad(storageKey: string): AnyRecord {
  const fallback: AnyRecord = {
    prices: {},
    legendTemplate: defaultLegendPubli,
    festivosTemplate: defaultFestivos,
    horariosTemplate: defaultHorarios,
    dietasTemplate: defaultDietas,
    transportesTemplate: defaultTransportes,
    alojamientoTemplate: defaultAlojamiento,
    preproTemplate: defaultPrepro,
    convenioTemplate: defaultConvenio,
    params: {
      jornadaTrabajo: '10',
      jornadaComida: '1',
      factorFestivo: '1.75',
      factorHoraExtra: '1.5',
      divTravel: '2',
      cortesiaMin: '15',
      taDiario: '12',
      taFinde: '12',
      nocturnoIni: '22:00',
      nocturnoFin: '06:00',
      dietaComida: '12',
      dietaCena: '18',
      dietaSinPernocta: '25',
      dietaAlojDes: '35',
      gastosBolsillo: '8',
      kilometrajeKm: '0.25',
      transporteDia: '15',
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
    };

    parsed.legendTemplate = parsed.legendTemplate ?? defaultLegendPubli;
    parsed.festivosTemplate = parsed.festivosTemplate ?? defaultFestivos;
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


