import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ReportBlockScheduleRow from '../components/ReportBlockScheduleRow';
import ReportPersonRows from '../components/ReportPersonRows';
import ReportTableHead from '../components/ReportTableHead';
import ReportWeekHeader from '../components/ReportWeekHeader';
import { DAY_NAMES, CONCEPTS, SI_NO } from '../constants';
import useAutoCalculations from '../hooks/useAutoCalculations';
import useCollapsedState from '../hooks/useCollapsedState';
import useReportData from '../hooks/useReportData';
import { dayNameFromISO } from '@shared/utils/date';
import { parseDietas, formatDietas, norm } from '../utils/text';
import { AnyRecord } from '@shared/types/common';
import { btnExport } from '@shared/utils/tailwindClasses';
import {
  isMemberRefuerzo,
  isPersonScheduledOnBlock,
  blockKeyForPerson,
} from '../utils/plan';
import {
  readCondParams,
  getBlockWindow,
  buildDateTime,
  calcHorasExtraMin,
  findPrevWorkingContextFactory,
} from '../utils/runtime';
import { personaKey, personaRole, personaName } from '../utils/model';
import { storage } from '@shared/services/localStorage.service';
import { mondayOf, toISO } from '@shared/utils/date';

import { ReportesSemanaProps } from './ReportesSemana/ReportesSemanaTypes';
import { useDietasOpciones } from './ReportesSemana/useDietasOpciones';
import { useWeekData } from './ReportesSemana/useWeekData';
import { createHorarioHelpers, isWeekend } from './ReportesSemana/horarioHelpers';
import { defaultExportWeek, handleExportPDF } from './ReportesSemana/exportHelpers';

export default function ReportesSemana({
  project,
  title = '',
  semana = [],
  personas = [],
  mode = 'semanal',
  horasExtraTipo = 'Hora Extra - Normal',
  readOnly = false,
  onExportWeekHTML,
  onExportWeekPDF,
}: ReportesSemanaProps) {
  const { t } = useTranslation();
  
  const providedPersonas = Array.isArray(personas) ? personas : [];
  
  const {
    safeSemana,
    findWeekAndDay,
    getPlanAllWeeks,
    weekPrelightActive,
    weekPickupActive,
    peopleBase,
    peoplePre,
    peoplePick,
    safePersonas,
  } = useWeekData(project, semana, providedPersonas);

  const dietasOpciones = useDietasOpciones(mode);

  const { horarioTexto, horarioPrelight, horarioPickup } = createHorarioHelpers(findWeekAndDay, t);

  const filteredSemana = useMemo(() => {
    return safeSemana.filter(iso => {
      const dayLabel = horarioTexto(iso);
      if (dayLabel === 'DESCANSO' && isWeekend(iso)) {
        const hasPrelight = horarioPrelight(iso) !== '—';
        const hasPickup = horarioPickup(iso) !== '—';
        if (!hasPrelight && !hasPickup) {
          return false;
        }
      }
      return true;
    });
  }, [safeSemana, horarioTexto, horarioPrelight, horarioPickup]);

  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    const wk = safeSemana.join('_');
    return `reportes_${base}_${wk}`;
  }, [project?.id, project?.nombre, safeSemana]);

  const persistBase = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    const wk = safeSemana.join('_');
    return `repstate_${base}_${wk}`;
  }, [project?.id, project?.nombre, safeSemana]);

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
    horasExtraTipo,
    currentData: data,
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

  const btnExportCls = btnExport;
  const btnExportStyle = {
    background: '#0476D9',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;

  const handleExportHTML = () => {
    if (typeof onExportWeekHTML === 'function') return onExportWeekHTML();
    defaultExportWeek(
      project,
      title,
      safeSemana,
      (iso: string, index: number) => dayNameFromISO(iso, index, [...DAY_NAMES] as any),
      horarioTexto,
      data
    );
  };

  const handleExportPDFAsync = async () => {
    await handleExportPDF(
      project,
      title,
      safeSemana,
      (iso: string, index: number) => dayNameFromISO(iso, index, [...DAY_NAMES] as any),
      horarioTexto,
      data,
      onExportWeekPDF,
      () => defaultExportWeek(
        project,
        title,
        safeSemana,
        (iso: string, index: number) => dayNameFromISO(iso, index, [...DAY_NAMES] as any),
        horarioTexto,
        data
      )
    );
  };

  const contentId = 'report-week-content';
  const contentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.focus();
    }
  }, [open]);

  const renderPersonRows = (list: AnyRecord[], block: 'base' | 'pre' | 'pick') => (
    <ReportPersonRows
      list={list}
      block={block}
      semana={[...filteredSemana]}
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
      horasExtraTipo={horasExtraTipo}
      readOnly={readOnly}
    />
  );

  return (
    <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90'>
      <ReportWeekHeader
        open={open}
        title={title}
        onToggle={() => !readOnly && setOpen(v => !v)}
        onExportHTML={handleExportHTML}
        onExportPDF={handleExportPDFAsync}
        btnExportCls={btnExportCls}
        btnExportStyle={btnExportStyle}
        contentId={contentId}
        readOnly={readOnly}
      />

      {open && (
        <div
          id={contentId}
          ref={contentRef}
          tabIndex={-1}
          className='px-5 pb-5 overflow-x-auto'
          role='region'
          aria-label={t('reports.weekContent')}
        >
          <table className='min-w-[920px] w-full border-collapse text-sm'>
            <ReportTableHead
              semana={[...filteredSemana]}
              dayNameFromISO={(iso: string, i: number) => {
                const dayIndex = dayNameFromISO(iso, i, [...DAY_NAMES] as any);
                const dayMap: Record<string, string> = {
                  'Lunes': t('reports.dayNames.monday'),
                  'Martes': t('reports.dayNames.tuesday'),
                  'Miércoles': t('reports.dayNames.wednesday'),
                  'Jueves': t('reports.dayNames.thursday'),
                  'Viernes': t('reports.dayNames.friday'),
                  'Sábado': t('reports.dayNames.saturday'),
                  'Domingo': t('reports.dayNames.sunday'),
                };
                return dayMap[dayIndex] || dayIndex;
              }}
              DAY_NAMES={[...DAY_NAMES] as any}
              toDisplayDate={(iso: string) => {
                const [y, m, d] = iso.split('-').map(Number);
                const dt = new Date(y, m - 1, d);
                const dd = String(dt.getDate()).padStart(2, '0');
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                return `${dd}/${mm}`;
              }}
              horarioTexto={horarioTexto}
            />

            <tbody>
              {renderPersonRows(peopleBase, 'base')}

              {peoplePre.length > 0 && (
                <ReportBlockScheduleRow
                  label={t('reports.prelightSchedule')}
                  semana={[...filteredSemana]}
                  valueForISO={horarioPrelight}
                />
              )}
              {renderPersonRows(peoplePre, 'pre')}

              {peoplePick.length > 0 && (
                <ReportBlockScheduleRow
                  label={t('reports.pickupSchedule')}
                  semana={[...filteredSemana]}
                  valueForISO={horarioPickup}
                />
              )}
              {renderPersonRows(peoplePick, 'pick')}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
