import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
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
import { storage } from '@shared/services/localStorage.service';
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
import { personaKey, personaRole, personaName, stripPR } from '../utils/model';
import { mondayOf, toYYYYMMDD } from '@shared/utils/date';
import { loadCondModel } from '@features/nomina/utils/cond';
import { ROLE_CODE_TO_LABEL, stripRoleSuffix, stripRefuerzoSuffix } from '@shared/constants/roles';
import { useTheme } from '../components/ReportPersonRows/useTheme';
import { getNeedsRowLabel } from '@features/necesidades/utils/rowLabels';
import { buildReportScheduleLabel } from '../utils/reportLabels';

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
  tutorialId,
}: ReportesSemanaProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const [attachmentInfoOpen, setAttachmentInfoOpen] = useState(false);
  const headerRowRef = useRef<HTMLTableRowElement | null>(null);
  const dateRowRef = useRef<HTMLTableRowElement | null>(null);
  const [stickyOffsets, setStickyOffsets] = useState({
    header: 0,
    date: 0,
  });
  
  const providedPersonas = Array.isArray(personas) ? personas : [];
  const personasWithGender = useMemo(() => {
    const projectTeam = (project as AnyRecord | undefined)?.team;
    const teamFromProject = {
      base: Array.isArray(projectTeam?.base) ? projectTeam.base : [],
      prelight: Array.isArray(projectTeam?.prelight) ? projectTeam.prelight : [],
      pickup: Array.isArray(projectTeam?.pickup) ? projectTeam.pickup : [],
      reinforcements: Array.isArray(projectTeam?.reinforcements) ? projectTeam.reinforcements : [],
    };
    const hasProjectTeam =
      teamFromProject.base.length ||
      teamFromProject.prelight.length ||
      teamFromProject.pickup.length ||
      teamFromProject.reinforcements.length;

    const keys: string[] = [];
    if (!hasProjectTeam && (project?.id || project?.nombre)) {
      const pid = project?.id || project?.nombre;
      keys.push(`team_${pid}`);
      keys.push(`setlux_equipo_${pid}`);
    }
    if (!hasProjectTeam) {
      keys.push('setlux_equipo_global_v2');
    }

    let roster: AnyRecord = teamFromProject;
    if (!hasProjectTeam) {
      let saved: AnyRecord | null = null;
      for (const k of keys) {
        try {
          const obj = storage.getJSON<AnyRecord>(k);
          if (obj) {
            saved = obj;
            break;
          }
        } catch {}
      }
      roster = saved || {};
    }
    const map = new Map<string, string>();
    const push = (m?: AnyRecord) => {
      if (!m) return;
      const role = m.roleId || m.role || '';
      const name = m.name || '';
      if (!role || !name) return;
      map.set(`${role}__${name}`, m.gender || 'neutral');
    };

    (roster.base || []).forEach(push);
    (roster.prelight || []).forEach(push);
    (roster.pickup || []).forEach(push);
    (roster.reinforcements || []).forEach(push);

    return providedPersonas.map(p => {
      const role = personaRole(p);
      const roleId = String((p as AnyRecord)?.roleId || '').trim();
      const name = personaName(p);
      const baseRole = role.startsWith('REF') ? role : stripPR(role);
      const key = `${roleId || baseRole}__${name}`;
      const gender = (p as AnyRecord)?.gender || map.get(key);
      return gender ? { ...p, gender } : p;
    });
  }, [project?.id, project?.nombre, (project as AnyRecord | undefined)?.team, providedPersonas]);
  
  const {
    safeSemana,
    findWeekAndDay,
    getPlanAllWeeks,
    weekPrelightActive,
    weekPickupActive,
    weekExtraActive,
    peopleBase,
    peoplePre,
    peoplePick,
    peopleExtra,
    extraGroups,
    safePersonas,
  } = useWeekData(project, semana, personasWithGender);

  const dietasOpciones = useDietasOpciones(mode);

  const { horarioTexto, horarioPrelight, horarioPickup, horarioExtra, horarioExtraByIndex } = createHorarioHelpers(findWeekAndDay, t);
  const reportLabels = useMemo(() => {
    const schedulePrefix = t('reports.schedulePrefix', 'Horario');
    const weekWithLabels = safeSemana
      .map(iso => findWeekAndDay(iso).week as AnyRecord | null)
      .find(week => !!week);
    const rowLabels = (weekWithLabels?.rowLabels || {}) as Record<string, string>;

    return {
      base: buildReportScheduleLabel(
        schedulePrefix,
        getNeedsRowLabel(rowLabels, 'crewList', t('needs.technicalTeam'))
      ),
      extra: buildReportScheduleLabel(
        schedulePrefix,
        getNeedsRowLabel(rowLabels, 'refList', t('needs.reinforcements'))
      ),
      pre: buildReportScheduleLabel(
        schedulePrefix,
        getNeedsRowLabel(rowLabels, 'preList', t('needs.prelight'))
      ),
      pick: buildReportScheduleLabel(
        schedulePrefix,
        getNeedsRowLabel(rowLabels, 'pickList', t('needs.pickup'))
      ),
    };
  }, [findWeekAndDay, safeSemana, t]);
  const horarioExtraByBlock = useCallback(
    (blockKey: string, iso: string) => {
      const match = String(blockKey).match(/^extra:(\d+)$/);
      if (!match) return '';
      return horarioExtraByIndex(Number(match[1]))(iso);
    },
    [horarioExtraByIndex]
  );

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

  const exportGenderMap = useMemo(() => {
    const map: Record<string, string> = {};
    (safePersonas || []).forEach(p => {
      const key = personaKey(p);
      const gender = (p as AnyRecord)?.gender;
      if (key && gender) {
        map[key] = gender;
      }
    });
    return map;
  }, [safePersonas]);

  const exportData = useMemo(
    () => ({
      ...data,
      __genderMap: exportGenderMap,
    }),
    [data, exportGenderMap]
  );

  const groupedPersonKeys = useMemo(
    () => ({
      base: peopleBase.map(personaKey),
      pre: peoplePre.map(personaKey),
      pick: peoplePick.map(personaKey),
      extraGroups: extraGroups.map(group => ({
        blockKey: group.blockKey,
        people: group.people.map(personaKey),
      })),
    }),
    [peopleBase, peoplePre, peoplePick, extraGroups]
  );

  const params = useMemo(
    () => readCondParams(project as AnyRecord, mode),
    [project?.id, project?.nombre, mode]
  );

  const materialPropioConfig = useMemo(() => {
    const model = loadCondModel(project as AnyRecord, mode);
    const priceTables = {
      base: model?.prices || {},
      pre: model?.pricesPrelight || {},
      pick: model?.pricesPickup || {},
    };

    const parseNum = (v: unknown): number => {
      if (v == null || v === '') return 0;
      const s = String(v)
        .trim()
        .replace(/\u00A0/g, '')
        .replace(/[€%]/g, '')
        .replace(/\s+/g, '');
      const t =
        s.includes(',') && s.includes('.')
          ? s.replace(/\./g, '').replace(',', '.')
          : s.replace(',', '.');
      const n = Number(t);
      return isFinite(n) ? n : 0;
    };

    const normalizeLabel = (s: unknown): string =>
      String(s == null ? '' : s)
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

    const findPersonMeta = (
      roleCode: string,
      name: string,
      block: 'base' | 'pre' | 'pick' | 'extra',
      roleId?: string
    ) => {
      const sourceList =
        block === 'pre'
          ? peoplePre
          : block === 'pick'
          ? peoplePick
          : block === 'extra'
          ? peopleExtra
          : peopleBase;
      return (
        (sourceList || []).find(person =>
          roleId
            ? String(person?.roleId || '').trim() === String(roleId || '').trim()
            : String(person?.role || '') === String(roleCode || '') &&
              String(person?.name || '') === String(name || '')
        ) || null
      );
    };

    const findRowForRole = (
      roleCode: string,
      roleId: string | undefined,
      explicitRoleLabel: string | undefined,
      block: 'base' | 'pre' | 'pick' | 'extra'
    ) => {
      const priceRows =
        block === 'pre' ? priceTables.pre : block === 'pick' ? priceTables.pick : priceTables.base;
      const rawRole = String(roleCode || '');
      let baseRole = stripRoleSuffix(rawRole);
      if (baseRole.startsWith('REF')) {
        const cleaned = stripRefuerzoSuffix(baseRole);
        baseRole = cleaned.startsWith('REF') ? cleaned.substring(3) : cleaned;
      }
      const fallbackRoleLabel = ROLE_CODE_TO_LABEL[baseRole as keyof typeof ROLE_CODE_TO_LABEL] || baseRole;
      const candidates = [roleId, explicitRoleLabel, fallbackRoleLabel, baseRole, rawRole].filter(Boolean);
      const candNorms = candidates.map(c => normalizeLabel(c));
      for (const key of Object.keys(priceRows || {})) {
        if (candNorms.includes(normalizeLabel(key))) {
          return priceRows[key];
        }
      }
      return null;
    };

    const getConfig = (
      roleCode: string,
      name: string,
      block: 'base' | 'pre' | 'pick' | 'extra',
      options?: { roleId?: string; roleLabel?: string }
    ) => {
      const personMeta = findPersonMeta(roleCode, name, block, options?.roleId);
      const row = findRowForRole(
        roleCode,
        String(options?.roleId || personMeta?.roleId || '').trim() || undefined,
        String(options?.roleLabel || personMeta?.roleLabel || '').trim() || undefined,
        block
      );
      if (!row) return null;
      const value = parseNum(row['Material propio']);
      if (!value) return null;
      const rawType = row['Material propio tipo'];
      const type = rawType === 'diario' || rawType === 'semanal'
        ? rawType
        : mode === 'diario'
        ? 'diario'
        : 'semanal';
      return { value, type };
    };

    return { getConfig };
  }, [project?.id, project?.nombre, mode, peopleBase, peoplePre, peoplePick, peopleExtra]);

  const getMaterialPropioConfig = useCallback(
    (
      role: string,
      name: string,
      block: 'base' | 'pre' | 'pick' | 'extra',
      options?: { roleId?: string; roleLabel?: string }
    ) => materialPropioConfig.getConfig(role, name, block, options),
    [materialPropioConfig]
  );

  const findPrevWorkingContext = findPrevWorkingContextFactory(
    getPlanAllWeeks,
    mondayOf,
    toYYYYMMDD
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
    getMaterialPropioConfig,
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
    horarioPrelight,
    horarioPickup,
    horarioExtraByBlock,
    reportLabels,
    groupedPersonKeys,
    data: exportData,
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

  useEffect(() => {
    const updateStickyOffsets = () => {
      const headerHeight = headerRowRef.current?.getBoundingClientRect().height ?? 0;
      setStickyOffsets({
        header: 0,
        date: headerHeight,
      });
    };

    updateStickyOffsets();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateStickyOffsets);
      return () => window.removeEventListener('resize', updateStickyOffsets);
    }

    const observer = new ResizeObserver(() => updateStickyOffsets());
    if (headerRowRef.current) observer.observe(headerRowRef.current);
    if (dateRowRef.current) observer.observe(dateRowRef.current);
    window.addEventListener('resize', updateStickyOffsets);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateStickyOffsets);
    };
  }, [open, filteredSemana.length]);

  const renderPersonRows = (list: AnyRecord[], block: 'base' | 'pre' | 'pick' | 'extra') => (
    <ReportPersonRows
      project={project as AnyRecord}
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
      getMaterialPropioConfig={getMaterialPropioConfig}
      onAttachmentClick={() => setAttachmentInfoOpen(true)}
    />
  );

  return (
    <section
      className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90'
      data-tutorial={tutorialId}
    >
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
        <div className='px-3 pb-3 sm:px-4 sm:pb-4 md:px-5 md:pb-5'>
          <div
            id={contentId}
            ref={contentRef}
            tabIndex={-1}
            className='overflow-x-auto overflow-y-auto overscroll-contain max-h-[70vh]'
            role='region'
            aria-label={t('reports.weekContent')}
          >
            <table className='report-week-table min-w-[720px] sm:min-w-[860px] md:min-w-[1100px] w-full table-fixed border-collapse text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>
              <colgroup>
                <col className='report-week-col-label' />
                {filteredSemana.map(iso => (
                  <col key={`report-col-${iso}`} />
                ))}
                <col className='report-week-col-total' />
              </colgroup>
              <ReportTableHead
                semana={[...filteredSemana]}
                dayNameFromISO={dayNameTranslator}
                DAY_NAMES={[...DAY_NAMES] as any}
                toDisplayDate={toDisplayDate}
                horarioTexto={horarioTexto}
                scheduleLabel={reportLabels.base}
                headerRowRef={headerRowRef}
                dateRowRef={dateRowRef}
                headerTop={stickyOffsets.header}
                dateTop={stickyOffsets.date}
              />

              <tbody>
                {renderPersonRows(peopleBase, 'base')}

                {extraGroups.map(group => (
                  <React.Fragment key={group.blockKey}>
                    <ReportBlockScheduleRow
                      label={reportLabels.extra}
                      semana={[...filteredSemana]}
                      valueForISO={horarioExtraByIndex(group.index)}
                    />
                    {renderPersonRows(group.people, group.blockKey as any)}
                  </React.Fragment>
                ))}

                {peoplePre.length > 0 && (
                  <ReportBlockScheduleRow
                    label={reportLabels.pre}
                    semana={[...filteredSemana]}
                    valueForISO={horarioPrelight}
                  />
                )}
                {renderPersonRows(peoplePre, 'pre')}

                {peoplePick.length > 0 && (
                  <ReportBlockScheduleRow
                    label={reportLabels.pick}
                    semana={[...filteredSemana]}
                    valueForISO={horarioPickup}
                  />
                )}
                {renderPersonRows(peoplePick, 'pick')}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {attachmentInfoOpen && (
        <div className='fixed inset-0 bg-black/60 grid place-items-center p-6 z-50'>
          <div
            className='w-full max-w-[240px] sm:max-w-[280px] md:max-w-xs rounded sm:rounded-md md:rounded-lg border border-neutral-border p-3 sm:p-4'
            style={{ backgroundColor: isDark ? 'var(--panel)' : '#ffffff' }}
          >
            <h3
              className='text-[10px] sm:text-xs md:text-sm font-semibold mb-2'
              style={{ color: isDark ? '#F27405' : '#111827' }}
            >
              {t('needs.attachmentBetaTitle')}
            </h3>
            <p
              className='text-[9px] sm:text-[10px] md:text-xs mb-3'
              style={{ color: isDark ? '#ffffff' : '#111827' }}
            >
              {t('reports.attachmentBetaMessageTicket')}
            </p>
            <div className='flex justify-center'>
              <button
                type='button'
                onClick={() => setAttachmentInfoOpen(false)}
                className='px-2 py-1 rounded-md border border-neutral-border text-[9px] sm:text-[10px] md:text-xs'
                style={{ color: isDark ? '#ffffff' : '#111827' }}
              >
                {t('needs.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
