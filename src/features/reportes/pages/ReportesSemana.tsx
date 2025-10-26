import React, { useEffect, useMemo, useRef, useState } from 'react';

import ReportBlockScheduleRow from '../components/ReportBlockScheduleRow';
import ReportPersonRows from '../components/ReportPersonRows';
import ReportTableHead from '../components/ReportTableHead';
import ReportWeekHeader from '../components/ReportWeekHeader';
import { DAY_NAMES, CONCEPTS, DIETAS_OPCIONES, DIETAS_OPCIONES_PUBLICIDAD, SI_NO } from '../constants';
import useAutoCalculations from '../hooks/useAutoCalculations';
import useCollapsedState from '../hooks/useCollapsedState';
import useReportData from '../hooks/useReportData';
import {
  toDisplayDate,
  dayNameFromISO,
  mondayOf,
  toISO,
  defaultWeek,
} from '../utils/date';
import {
  collectWeekTeamWithSuffixFactory,
  buildSafePersonas,
  buildPeopleBase,
  buildPeoplePre,
  buildPeoplePick,
  collectRefNamesForBlock,
  horarioPrelightFactory,
  horarioPickupFactory,
} from '../utils/derive';
import { buildReportWeekHTML, exportReportWeekToPDF } from '../utils/export';
import { personaKey, personaRole, personaName } from '../utils/model';
import { storage } from '@shared/services/localStorage.service';
import {
  isMemberRefuerzo,
  isPersonScheduledOnBlock,
  blockKeyForPerson,
  findWeekAndDayFactory,
} from '../utils/plan';
import {
  readCondParams,
  getBlockWindow,
  buildDateTime,
  calcHorasExtraMin,
  findPrevWorkingContextFactory,
} from '../utils/runtime';
import { parseDietas, formatDietas, norm } from '../utils/text';

type AnyRecord = Record<string, any>;

type Project = { id?: string; nombre?: string };

type Props = {
  project?: Project;
  title?: string;
  semana?: string[];
  personas?: AnyRecord[];
  mode?: 'semanal' | 'mensual' | 'publicidad';
  onExportWeekHTML?: () => void;
  onExportWeekPDF?: () => void;
};

export default function ReportesSemana({
  project,
  title = '',
  semana = [],
  personas = [],
  mode = 'semanal',
  onExportWeekHTML,
  onExportWeekPDF,
}: Props) {
  console.log('[REPORTES.DEBUG] ReportesSemana initialized with mode:', mode, 'project:', project?.id, 'title:', title);
  
  const safeSemana =
    Array.isArray(semana) && semana.length === 7 ? semana : defaultWeek();
  const providedPersonas = Array.isArray(personas) ? personas : [];

  // Seleccionar opciones de dietas según el modo
  const dietasOpciones = mode === 'publicidad' ? DIETAS_OPCIONES_PUBLICIDAD : DIETAS_OPCIONES;
  console.log('[REPORTES.DEBUG] dietasOpciones selected:', dietasOpciones);

  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    const wk = safeSemana.join('_');
    const key = `reportes_${base}_${wk}`;
    console.log('[REPORTES.DEBUG] storageKey generated:', key);
    return key;
  }, [project?.id, project?.nombre, safeSemana]);

  const persistBase = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    const wk = safeSemana.join('_');
    return `repstate_${base}_${wk}`;
  }, [project?.id, project?.nombre, safeSemana]);

  const planKey = useMemo(
    () => `plan_${project?.id || project?.nombre || 'demo'}`,
    [project?.id, project?.nombre]
  );

  const getPlanAllWeeks = () => {
    try {
      const obj = storage.getJSON<any>(planKey);
      if (!obj) return { pre: [], pro: [] };
      return obj || { pre: [], pro: [] };
    } catch {
      return { pre: [], pro: [] };
    }
  };

  const findWeekAndDay = findWeekAndDayFactory(
    getPlanAllWeeks,
    mondayOf,
    toISO
  );

  const horarioTexto = (iso: string) => {
    const { day } = findWeekAndDay(iso);
    if (!day) return 'Añadelo en Planificación';
    if ((day.tipo || '') === 'Descanso') return 'DESCANSO';
    // Para "Rodaje Festivo", no mostrar el prefijo, solo el horario o "Añadelo en Planificación"
    const etiqueta = day.tipo && day.tipo !== 'Rodaje' && day.tipo !== 'Rodaje Festivo' ? `${day.tipo}: ` : '';
    if (!day.start || !day.end) return `${etiqueta}Añadelo en Planificación`;
    return `${etiqueta}${day.start}–${day.end}`;
  };

  const horarioPrelight = horarioPrelightFactory(findWeekAndDay);
  const horarioPickup = horarioPickupFactory(findWeekAndDay);

  const weekPrelightActive = useMemo(() => {
    return safeSemana.some(iso => {
      const { day } = findWeekAndDay(iso);
      return !!(
        day &&
        day.tipo !== 'Descanso' &&
        ((day.prelight || []).length > 0 ||
          day.prelightStart ||
          day.prelightEnd)
      );
    });
  }, [planKey, JSON.stringify(safeSemana)]);

  const weekPickupActive = useMemo(() => {
    return safeSemana.some(iso => {
      const { day } = findWeekAndDay(iso);
      return !!(
        day &&
        day.tipo !== 'Descanso' &&
        ((day.pickup || []).length > 0 || day.pickupStart || day.pickupEnd)
      );
    });
  }, [planKey, JSON.stringify(safeSemana)]);

  const collectWeekTeamWithSuffix = collectWeekTeamWithSuffixFactory(
    findWeekAndDay,
    [...safeSemana]
  );

  const prelightPeople = useMemo(
    () =>
      weekPrelightActive ? collectWeekTeamWithSuffix('prelight', 'P') : [],
    [weekPrelightActive, planKey, JSON.stringify(safeSemana)]
  );

  const pickupPeople = useMemo(
    () => (weekPickupActive ? collectWeekTeamWithSuffix('pickup', 'R') : []),
    [weekPickupActive, planKey, JSON.stringify(safeSemana)]
  );

  const refNamesBase = useMemo(
    () => collectRefNamesForBlock(safeSemana, findWeekAndDay, 'team'),
    [JSON.stringify(safeSemana), planKey]
  );
  const refNamesPre = useMemo(
    () => collectRefNamesForBlock(safeSemana, findWeekAndDay, 'prelight'),
    [JSON.stringify(safeSemana), planKey]
  );
  const refNamesPick = useMemo(
    () => collectRefNamesForBlock(safeSemana, findWeekAndDay, 'pickup'),
    [JSON.stringify(safeSemana), planKey]
  );

  const safePersonas = useMemo(
    () =>
      buildSafePersonas(
        providedPersonas,
        weekPrelightActive,
        prelightPeople,
        weekPickupActive,
        pickupPeople
      ),
    [
      JSON.stringify(providedPersonas),
      weekPrelightActive,
      weekPickupActive,
      JSON.stringify(prelightPeople),
      JSON.stringify(pickupPeople),
    ]
  );

  const peopleBase = useMemo(
    () => buildPeopleBase(providedPersonas, refNamesBase),
    [JSON.stringify(providedPersonas), JSON.stringify(refNamesBase)]
  );

  const peoplePre = useMemo(
    () => buildPeoplePre(weekPrelightActive, prelightPeople, refNamesPre),
    [
      weekPrelightActive,
      JSON.stringify(prelightPeople),
      JSON.stringify(refNamesPre),
    ]
  );

  const peoplePick = useMemo(
    () => buildPeoplePick(weekPickupActive, pickupPeople, refNamesPick),
    [
      weekPickupActive,
      JSON.stringify(pickupPeople),
      JSON.stringify(refNamesPick),
    ]
  );

  const { collapsed, setCollapsed } = useCollapsedState(
    persistBase,
    safePersonas
  );
  const { data, setData, setCell } = useReportData(
    storageKey,
    safePersonas,
    [...safeSemana],
    [...CONCEPTS] as any,
    (iso: string, role: string, name: string, findFn: any) => {
      const { day } = findFn(iso);
      if (!day || day.tipo === 'Descanso') return false;
      if (String(role || '') === 'REF') {
        const any = (arr: AnyRecord[]) =>
          (arr || []).some(
            m =>
              String(m?.name || '') === String(name || '') &&
              isMemberRefuerzo(m)
          );
        return any(day.team) || any(day.prelight) || any(day.pickup);
      }
      const baseRole = String(role || '').replace(/[PR]$/, '');
      const suffix = /P$/.test(role || '')
        ? 'prelight'
        : /R$/.test(role || '')
          ? 'pickup'
          : 'team';
      const list = Array.isArray(day[suffix]) ? day[suffix] : [];
      return list.some(
        (m: AnyRecord) =>
          norm(m?.name) === norm(name) &&
          (!m?.role || norm(m?.role) === norm(baseRole) || !baseRole)
      );
    },
    findWeekAndDay
  );

  const params = useMemo(
    () => readCondParams(project as AnyRecord, mode),
    [project?.id, project?.nombre, mode]
  );

  const findPrevWorkingContext = findPrevWorkingContextFactory(
    getPlanAllWeeks,
    mondayOf,
    toISO
  );

  useAutoCalculations({
    safeSemana: [...safeSemana],
    findWeekAndDay: findWeekAndDay as any,
    getBlockWindow: getBlockWindow as any,
    calcHorasExtraMin,
    buildDateTime: buildDateTime as any,
    findPrevWorkingContext,
    params,
    safePersonas,
    personaKey,
    personaRole,
    personaName,
    blockKeyForPerson,
    isPersonScheduledOnBlock,
    setData,
  });

  const [open, setOpen] = useState<boolean>(() => {
    try {
      const val = storage.getJSON<boolean>(`${persistBase}_open`);
      if (val != null) return val === true;
    } catch {}
    return true;
  });

  useEffect(() => {
    try {
      storage.setJSON(`${persistBase}_open`, open);
    } catch {}
  }, [open, persistBase]);

  const btnExportCls = 'px-3 py-2 rounded-lg text-sm font-semibold';
  const btnExportStyle = {
    background: '#0476D9',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;

  const defaultExportWeek = () => {
    const css = `body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#111;padding:20px} table{width:100%;border-collapse:collapse;font-size:12px;margin:8px 0} th,td{border:1px solid #222;padding:6px;vertical-align:top} thead th{background:#eee}`;
    const inner = buildReportWeekHTML({
      project,
      title,
      safeSemana: [...safeSemana],
      dayNameFromISO: (iso: string, index: number) => dayNameFromISO(iso, index, [...DAY_NAMES] as any),
      toDisplayDate,
      horarioTexto,
      CONCEPTS: [...CONCEPTS],
      data,
      personaKey,
      personaRole,
      personaName,
    });
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${project?.nombre || 'Proyecto'} – Reporte</title><style>${css}</style></head><body>${inner}</body></html>`);
      w.document.close();
    }
  };
  const handleExportHTML = () => {
    if (typeof onExportWeekHTML === 'function') return onExportWeekHTML();
    defaultExportWeek();
  };

  const handleExportPDF = async () => {
    if (typeof onExportWeekPDF === 'function') return onExportWeekPDF();
    const ok = await exportReportWeekToPDF({
      project,
      title,
      safeSemana: [...safeSemana],
      dayNameFromISO: (iso: string, index: number) => dayNameFromISO(iso, index, [...DAY_NAMES] as any),
      toDisplayDate,
      horarioTexto,
      CONCEPTS: [...CONCEPTS],
      data,
      personaKey,
      personaRole,
      personaName,
      orientation: 'landscape',
    });
    if (!ok) defaultExportWeek();
  };

  const contentId = 'report-week-content';
  const contentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.focus();
    }
  }, [open]);
  return (
    <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90'>
      <ReportWeekHeader
        open={open}
        title={title}
        onToggle={() => setOpen(v => !v)}
        onExportHTML={handleExportHTML}
        onExportPDF={handleExportPDF}
        btnExportCls={btnExportCls}
        btnExportStyle={btnExportStyle}
        contentId={contentId}
      />

      {open && (
        <div
          id={contentId}
          ref={contentRef}
          tabIndex={-1}
          className='px-5 pb-5 overflow-x-auto'
          role='region'
          aria-label='Contenido de la semana'
        >
          <table className='min-w-[920px] w-full border-collapse text-sm'>
            <ReportTableHead
              semana={[...safeSemana]}
              dayNameFromISO={(iso: string, i: number) => dayNameFromISO(iso, i, [...DAY_NAMES] as any) as any}
              DAY_NAMES={[...DAY_NAMES] as any}
              toDisplayDate={toDisplayDate}
              horarioTexto={horarioTexto}
            />

            <tbody>
              {(() => {
                const renderPersonRows = (list: AnyRecord[], block: 'base' | 'pre' | 'pick') => (
                  <ReportPersonRows
                    list={list}
                    block={block}
                    semana={[...safeSemana]}
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    data={data}
                    setCell={setCell}
                    findWeekAndDay={findWeekAndDay as any}
                    isPersonScheduledOnBlock={isPersonScheduledOnBlock as any}
                    CONCEPTS={[...CONCEPTS] as any}
                    DIETAS_OPCIONES={dietasOpciones as any}
                    SI_NO={SI_NO as any}
                    parseDietas={parseDietas}
                    formatDietas={formatDietas}
                  />
                );

                return (
                  <>
                    {renderPersonRows(peopleBase, 'base')}

                    {peoplePre.length > 0 && (
                      <ReportBlockScheduleRow
                        label='Horario Prelight'
                        semana={[...safeSemana]}
                        valueForISO={horarioPrelight}
                      />
                    )}
                    {renderPersonRows(peoplePre, 'pre')}

                    {peoplePick.length > 0 && (
                      <ReportBlockScheduleRow
                        label='Horario Recogida'
                        semana={[...safeSemana]}
                        valueForISO={horarioPickup}
                      />
                    )}
                    {renderPersonRows(peoplePick, 'pick')}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
