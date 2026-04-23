import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  BLOCKS,
  getDayBlockList,
} from '../utils/plan';
import {
  readCondParams,
  getBlockWindow,
  buildDateTime,
  calcHorasExtraMin,
  findPrevWorkingContextFactory,
} from '../utils/runtime';
import { personaKey, personaRole, personaName, stripPR } from '../utils/model';
import { addDays, mondayOf, toYYYYMMDD } from '@shared/utils/date';
import { loadCondModel } from '@features/nomina/utils/cond';
import { ROLE_CODE_TO_LABEL, stripRoleSuffix, stripRefuerzoSuffix } from '@shared/constants/roles';
import { useTheme } from '../components/ReportPersonRows/useTheme';
import { getNeedsRowLabel } from '@features/necesidades/utils/rowLabels';
import { buildReportScheduleLabel } from '../utils/reportLabels';
import { normalizeExtraBlocks } from '@shared/utils/extraBlocks';

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
import { getReportDayTypePalette } from '../utils/dayTypePalette';

const normalizeStoredTime = (value: unknown): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return raw;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return raw;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const normalizeReportText = (value: unknown): string =>
  String(value || '')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const parseReportPersonKey = (personKey: string) => {
  const extraMatch = String(personKey).match(/^(.*?)\.extra(?::\d+)?__(.*)$/);
  if (extraMatch) return { role: extraMatch[1] || '', name: extraMatch[2] || '' };
  const preMatch = String(personKey).match(/^(.*?)\.pre__(.*)$/);
  if (preMatch) return { role: preMatch[1] || '', name: preMatch[2] || '' };
  const pickMatch = String(personKey).match(/^(.*?)\.pick__(.*)$/);
  if (pickMatch) return { role: pickMatch[1] || '', name: pickMatch[2] || '' };
  const [rolePart, ...nameParts] = String(personKey).split('__');
  return { role: rolePart || '', name: nameParts.join('__') || '' };
};

const reportPersonMergeKey = (person: AnyRecord): string => {
  const name = normalizeReportText(person?.name || person?.nombre || person?.label);
  const personId = normalizeReportText(person?.personId);
  return name ? `name:${name}` : `id:${personId}`;
};

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
  const [autoCalculationsReady, setAutoCalculationsReady] = useState(false);
  const headerRowRef = useRef<HTMLTableRowElement | null>(null);
  const dateRowRef = useRef<HTMLTableRowElement | null>(null);
  const [stickyOffsets, setStickyOffsets] = useState({
    header: 0,
    date: 0,
    person: 0,
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

  const { horarioTexto, horarioPrelight, horarioPickup, horarioExtraByIndex } = createHorarioHelpers(findWeekAndDay, t);
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
  const scheduleForBlock = useCallback(
    (blockKey: 'base' | 'pre' | 'pick' | string, iso: string) => {
      if (blockKey === 'pre') return horarioPrelight(iso);
      if (blockKey === 'pick') return horarioPickup(iso);
      if (String(blockKey).startsWith('extra:')) return horarioExtraByBlock(String(blockKey), iso);
      return horarioTexto(iso);
    },
    [horarioExtraByBlock, horarioPickup, horarioPrelight, horarioTexto]
  );
  const filteredSemana = useFilteredSemana({
    safeSemana,
    horarioTexto,
    horarioPrelight,
    horarioPickup,
  });
  const getReportDayStyle = useCallback(
    (iso: string, block: string = 'base') => {
      try {
        const { day } = findWeekAndDay(iso);
        const palette = getReportDayTypePalette(day, block, theme);
        if (!palette) return undefined;
        return {
          '--report-jornada-bg': palette.bg,
          '--report-jornada-header-bg': palette.headerBg,
          '--report-jornada-border': palette.border,
        } as React.CSSProperties;
      } catch {
        return undefined;
      }
    },
    [findWeekAndDay, theme]
  );

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

  const scheduleWindowForBlock = useCallback(
    (blockKey: 'base' | 'pre' | 'pick' | string, iso: string, personKey: string) => {
      const { day } = findWeekAndDay(iso);
      if (!day) return { start: '', end: '', isRest: false };
      if ((day.tipo || '') === 'Descanso') {
        return { start: '', end: '', isRest: true };
      }
      const personMatchesBlock = (candidateBlock: string) => {
        const parsed = parseReportPersonKey(personKey);
        const wantedName = normalizeReportText(parsed.name);
        const wantedRole = normalizeReportText(stripRoleSuffix(parsed.role));
        if (!wantedName) return false;
        return getDayBlockList(day, candidateBlock).some((member: AnyRecord) => {
          if (normalizeReportText(member?.name) !== wantedName) return false;
          const memberRoleId = normalizeReportText(member?.roleId);
          if (memberRoleId && memberRoleId === normalizeReportText(parsed.role)) return true;
          const memberRole = normalizeReportText(stripRoleSuffix(String(member?.role || '')));
          return !wantedRole || !memberRole || memberRole === wantedRole;
        });
      };
      const resolvePersonBlock = () => {
        if (blockKey !== 'base') return String(blockKey);
        if (personMatchesBlock(BLOCKS.base)) return BLOCKS.base;
        if (personMatchesBlock(BLOCKS.pre)) return BLOCKS.pre;
        if (personMatchesBlock(BLOCKS.pick)) return BLOCKS.pick;
        const extraIndex = normalizeExtraBlocks(day).findIndex((_, index) => personMatchesBlock(`extra:${index}`));
        if (extraIndex >= 0) return `extra:${extraIndex}`;
        if (personMatchesBlock(BLOCKS.extra)) return BLOCKS.extra;
        return String(blockKey);
      };
      const resolvedBlockKey = resolvePersonBlock();
      let baseStart = '';
      let baseEnd = '';

      if (resolvedBlockKey === 'pre') {
        baseStart = normalizeStoredTime(day.prelightStart || day.preStart || '');
        baseEnd = normalizeStoredTime(day.prelightEnd || day.preEnd || '');
      } else if (resolvedBlockKey === 'pick') {
        baseStart = normalizeStoredTime(day.pickupStart || day.pickStart || '');
        baseEnd = normalizeStoredTime(day.pickupEnd || day.pickEnd || '');
      } else if (String(resolvedBlockKey).startsWith('extra:')) {
        const match = String(resolvedBlockKey).match(/^extra:(\d+)$/);
        const block = match ? normalizeExtraBlocks(day)[Number(match[1])] : null;
        baseStart = normalizeStoredTime(block?.start || '');
        baseEnd = normalizeStoredTime(block?.end || '');
      } else if (resolvedBlockKey === 'extra') {
        baseStart = normalizeStoredTime(day.refStart || '');
        baseEnd = normalizeStoredTime(day.refEnd || '');
      } else {
        baseStart = normalizeStoredTime(day.start || day.crewStart || '');
        baseEnd = normalizeStoredTime(day.end || day.crewEnd || '');
      }

      const saved = data?.__schedule__?.[personKey]?.[String(resolvedBlockKey)]?.[iso];
      return {
        start: normalizeStoredTime(saved?.start ?? baseStart),
        end: normalizeStoredTime(saved?.end ?? baseEnd),
        isRest: false,
        blockKey: resolvedBlockKey,
      };
    },
    [data, findWeekAndDay]
  );

  const resolveBlockForPersonISO = useCallback(
    (blockKey: 'base' | 'pre' | 'pick' | string, iso: string, personKey: string) =>
      scheduleWindowForBlock(blockKey, iso, personKey).blockKey || String(blockKey),
    [scheduleWindowForBlock]
  );

  const updateScheduleForBlock = useCallback(
    (
      blockKey: 'base' | 'pre' | 'pick' | string,
      iso: string,
      field: 'start' | 'end',
      value: string,
      personKey: string
    ) => {
      setData(prev => {
        const next = { ...(prev || {}) } as AnyRecord;
        const scheduleState = { ...(next.__schedule__ || {}) } as AnyRecord;
        const personState = { ...(scheduleState[personKey] || {}) } as AnyRecord;
        const blockState = { ...(personState[String(blockKey)] || {}) } as AnyRecord;
        const current = { ...(blockState[iso] || {}) } as AnyRecord;

        if (String(current[field] || '') === String(value || '')) {
          return prev;
        }

        current[field] = value;
        blockState[iso] = current;
        personState[String(blockKey)] = blockState;
        scheduleState[personKey] = personState;
        next.__schedule__ = scheduleState;
        return next;
      });
    },
    [setData]
  );

  const reportDayIsoMap = useMemo(() => {
    const map = new WeakMap<object, string>();
    const allWeeks = getPlanAllWeeks();
    [...(allWeeks?.pre || []), ...(allWeeks?.pro || [])].forEach((week: AnyRecord) => {
      const weekStart = String(week?.startDate || '').trim();
      if (!weekStart) return;
      const baseDate = new Date(`${weekStart}T00:00:00`);
      const days = Array.isArray(week?.days) ? week.days : [];
      days.forEach((day: AnyRecord, index: number) => {
        if (!day || typeof day !== 'object') return;
        const iso = toYYYYMMDD(addDays(baseDate, index));
        map.set(day, iso);
      });
    });
    return map;
  }, [getPlanAllWeeks]);

  const reportGetBlockWindow = useCallback(
    (person: AnyRecord, day: AnyRecord, block: string) => {
      const fallback = getBlockWindow(day, block as any);
      if (!day || typeof day !== 'object') return fallback;
      const iso = reportDayIsoMap.get(day as object);
      if (!iso) return fallback;
      const personKey = personaKey(person);

      const saved =
        data?.__schedule__?.[personKey]?.[String(block)]?.[iso]
        || (block === 'extra' ? data?.__schedule__?.[personKey]?.['extra:0']?.[iso] : undefined);

      if (!saved) return fallback;
      return {
        start: saved.start || fallback.start || null,
        end: saved.end || fallback.end || null,
      };
    },
    [data, reportDayIsoMap]
  );

  const renderedPeopleGroups = useMemo(() => {
    const seen = new Set<string>();
    const takeList = (list: AnyRecord[] = []) =>
      (list || []).filter(person => {
        const key = reportPersonMergeKey(person);
        if (!key || key === 'name:') return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const base = takeList(peopleBase);
    const pre = takeList(peoplePre);
    const pick = takeList(peoplePick);
    const extra = (extraGroups || [])
      .map(group => ({
        ...group,
        people: takeList(group.people || []),
      }))
      .filter(group => group.people.length > 0);

    return { base, pre, pick, extra };
  }, [peopleBase, peoplePre, peoplePick, extraGroups]);

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
      base: renderedPeopleGroups.base.map(personaKey),
      pre: renderedPeopleGroups.pre.map(personaKey),
      pick: renderedPeopleGroups.pick.map(personaKey),
      extraGroups: renderedPeopleGroups.extra.map(group => ({
        blockKey: group.blockKey,
        people: group.people.map(personaKey),
      })),
    }),
    [renderedPeopleGroups]
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

  useEffect(() => {
    setAutoCalculationsReady(false);

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const enable = () => setAutoCalculationsReady(true);

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(enable, { timeout: 250 });
    } else {
      timeoutId = window.setTimeout(enable, 32);
    }

    return () => {
      if (idleId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [storageKey, horasExtraTipo, mode]);

  useAutoCalculations({
    enabled: autoCalculationsReady,
    safeSemana: [...safeSemana],
    findWeekAndDay: findWeekAndDay as any,
    getBlockWindow: getBlockWindow as any,
    getBlockWindowForPerson: reportGetBlockWindow as any,
    calcHorasExtraMin,
    buildDateTime: buildDateTime as any,
    findPrevWorkingContext,
    params,
    safePersonas,
    personaKey,
    personaRole,
    personaName,
    blockKeyForPerson,
    isPersonScheduledOnBlock: isPersonScheduledOnBlockFn,
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
      const dateHeight = dateRowRef.current?.getBoundingClientRect().height ?? 0;
      setStickyOffsets({
        header: 0,
        date: headerHeight,
        person: headerHeight + dateHeight,
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
      personStickyTop={stickyOffsets.person}
      scheduleWindowForISO={scheduleWindowForBlock}
      resolveBlockForISO={resolveBlockForPersonISO}
      getDayStyle={getReportDayStyle}
      onScheduleChange={updateScheduleForBlock}
      semana={[...filteredSemana]}
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      data={data}
      setCell={setCell}
      findWeekAndDay={findWeekAndDay as any}
      isPersonScheduledOnBlock={isPersonScheduledOnBlockFn as any}
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
            <table className='report-week-table min-w-[1080px] sm:min-w-[1220px] md:min-w-[1360px] w-full table-fixed border-separate border-spacing-0 text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>
              <colgroup>
                <col className='report-week-col-label' />
                {filteredSemana.map(iso => (
                  <col key={`report-col-${iso}`} className='report-week-col-day' />
                ))}
                <col className='report-week-col-total' />
              </colgroup>
              <ReportTableHead
                semana={[...filteredSemana]}
                dayNameFromISO={dayNameTranslator}
                DAY_NAMES={[...DAY_NAMES] as any}
                toDisplayDate={toDisplayDate}
                headerRowRef={headerRowRef}
                dateRowRef={dateRowRef}
                headerTop={stickyOffsets.header}
                dateTop={stickyOffsets.date}
                getDayStyle={getReportDayStyle}
              />

              <tbody>
                {renderPersonRows(renderedPeopleGroups.base, 'base')}

                {renderedPeopleGroups.extra.map(group => (
                  <React.Fragment key={group.blockKey}>
                    {renderPersonRows(group.people, group.blockKey as any)}
                  </React.Fragment>
                ))}

                {renderPersonRows(renderedPeopleGroups.pre, 'pre')}

                {renderPersonRows(renderedPeopleGroups.pick, 'pick')}
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
