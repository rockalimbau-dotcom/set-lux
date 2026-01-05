import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import ReportBlockScheduleRow from '../components/ReportBlockScheduleRow';
import ReportPersonRows from '../components/ReportPersonRows';
import ReportTableHead from '../components/ReportTableHead';
import ReportWeekHeader from '../components/ReportWeekHeader';
import { DAY_NAMES, CONCEPTS, SI_NO } from '../constants';
import useAutoCalculations from '../hooks/useAutoCalculations';
import useCollapsedState from '../hooks/useCollapsedState';
import useReportData from '../hooks/useReportData';
import { parseDietas, formatDietas } from '../utils/text';
import { AnyRecord } from '@shared/types/common';
import { btnExport } from '@shared/utils/tailwindClasses';
import {
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
import { mondayOf, toISO } from '@shared/utils/date';

import { ReportesSemanaProps } from './ReportesSemana/ReportesSemanaTypes';
import { useDietasOpciones } from './ReportesSemana/useDietasOpciones';
import { useWeekData } from './ReportesSemana/useWeekData';
import { createHorarioHelpers } from './ReportesSemana/horarioHelpers';
import { useReportStorageKeys } from './ReportesSemana/useReportStorageKeys';
import { useFilteredSemana } from './ReportesSemana/useFilteredSemana';
import { usePersonScheduledChecker } from './ReportesSemana/usePersonScheduledChecker';
import { useDayNameTranslator } from './ReportesSemana/useDayNameTranslator';
import { useReportExport } from './ReportesSemana/useReportExport';
import { useReportCollapsible } from './ReportesSemana/useReportCollapsible';
import { toDisplayDate } from './ReportesSemana/ReportTableHeadHelpers';

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

  const filteredSemana = useFilteredSemana({
    safeSemana,
    horarioTexto,
    horarioPrelight,
    horarioPickup,
  });

  const { storageKey, persistBase } = useReportStorageKeys({
    project,
    safeSemana,
  });

  const { collapsed, setCollapsed } = useCollapsedState(
    persistBase,
    safePersonas
  );
  const isPersonScheduledOnBlockFn = usePersonScheduledChecker({
    findWeekAndDay,
  });

  const { data, setData, setCell } = useReportData(
    storageKey,
    safePersonas,
    [...safeSemana],
    [...CONCEPTS] as any,
    isPersonScheduledOnBlockFn,
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

  const { open, setOpen } = useReportCollapsible(persistBase);

  const btnExportCls = btnExport;
  const btnExportStyle = {
    background: '#0476D9',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;

  const { handleExportHTML, handleExportPDFAsync } = useReportExport({
    project,
    title,
    safeSemana,
    horarioTexto,
    data,
    onExportWeekHTML,
    onExportWeekPDF,
  });

  const dayNameTranslator = useDayNameTranslator();

  const contentId = 'report-week-content';
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef(true);
  const prevOpenRef = useRef(open);
  
  useEffect(() => {
    // Solo hacer focus si el accordion se abre manualmente (no en el montaje inicial)
    if (open && contentRef.current && !isInitialMount.current && !prevOpenRef.current) {
      // El accordion se acaba de abrir manualmente
      // Usar focus sin scroll para evitar que la página se desplace
      if (!contentRef.current.hasAttribute('tabindex')) {
        contentRef.current.setAttribute('tabindex', '-1');
      }
      // Focus sin scroll usando preventScroll si está disponible
      try {
        contentRef.current.focus({ preventScroll: true });
      } catch {
        // Fallback: no hacer focus si no se puede prevenir el scroll
        // Es mejor no hacer focus que causar scroll no deseado
      }
    }
    
    // Marcar que ya no es el montaje inicial después del primer render
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    prevOpenRef.current = open;
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
              dayNameFromISO={dayNameTranslator}
              DAY_NAMES={[...DAY_NAMES] as any}
              toDisplayDate={toDisplayDate}
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
