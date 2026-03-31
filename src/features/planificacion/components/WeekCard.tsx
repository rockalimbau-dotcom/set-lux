import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { parseYYYYMMDD, addDays, formatDDMMYYYY } from '@shared/utils/date';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from './ConfirmModal';
import { AnyRecord } from '@shared/types/common';
import { WeekCardHeader } from './WeekCard/WeekCardHeader';
import { WeekCardTable } from './WeekCard/WeekCardTable';
import { DAYS } from './WeekCard/WeekCardHelpers';

type WeekCardProps = {
  scope: 'pre' | 'pro';
  week: AnyRecord;
  duplicateWeek: (scope: 'pre' | 'pro', weekId: string) => void;
  deleteWeek: (scope: 'pre' | 'pro', weekId: string) => void;
  setWeekStart: (scope: 'pre' | 'pro', weekId: string, date: string) => void;
  setDayField: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    patch: AnyRecord
  ) => void;
  addMemberTo: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    member: AnyRecord
  ) => void;
  removeMemberFrom: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    idxInList: number
  ) => void;
  baseTeam: AnyRecord[];
  prelightTeam: AnyRecord[];
  pickupTeam: AnyRecord[];
  reinforcements: AnyRecord[];
  onExportWeek: () => void;
  onExportWeekPDF: () => void;
  btnExportCls?: string;
  btnExportStyle?: React.CSSProperties;
  teamList: AnyRecord[];
  project?: AnyRecord;
  readOnly?: boolean;
};

function WeekCard({
  scope,
  week,
  duplicateWeek,
  deleteWeek,
  setWeekStart,
  setDayField,
  addMemberTo,
  removeMemberFrom,
  baseTeam,
  prelightTeam,
  pickupTeam,
  reinforcements,
  onExportWeek,
  onExportWeekPDF,
  btnExportCls,
  btnExportStyle,
  teamList,
  project,
  readOnly = false,
}: WeekCardProps) {
  const { t } = useTranslation();
  
  // Helper function to translate week label
  const translateWeekLabel = (label: string): string => {
    if (!label) return '';
    // Match patterns like "Semana 1", "Semana -1", "Week 1", "Setmana 1", etc.
    const match = label.match(/^(Semana|Week|Setmana)\s*(-?\d+)$/i);
    if (match) {
      const number = match[2];
      if (number.startsWith('-')) {
        return t('planning.weekFormatNegative', { number: number.substring(1) });
      } else {
        return t('planning.weekFormat', { number });
      }
    }
    // If it doesn't match the pattern, return as is (might be custom label)
    return label;
  };
  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    scope: 'pre' | 'pro';
    weekId: string;
    dayIndex: number;
    listKey: 'team' | 'prelight' | 'pickup';
    idx: number;
    memberName: string;
  } | null>(null);
  
  // Detectar el tema actual
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
      }
    };

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    window.addEventListener('themechange', updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', updateTheme);
    };
  }, []);

  // Estados para los dropdowns personalizados
  const [dropdownStates, setDropdownStates] = useState<Record<string, {
    isOpen: boolean;
    hoveredOption: string | null;
    isButtonHovered: boolean;
  }>>({});

  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';

  const getDropdownState = (key: string) => {
    return dropdownStates[key] || { isOpen: false, hoveredOption: null, isButtonHovered: false };
  };

  const setDropdownState = (key: string, updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>) => {
    setDropdownStates(prev => ({
      ...prev,
      [key]: { ...getDropdownState(key), ...updates }
    }));
  };

  const weekStart = useMemo(() => parseYYYYMMDD(week.startDate as string), [week.startDate]);
  const datesRow = useMemo(() => DAYS.map((_, i) => formatDDMMYYYY(addDays(weekStart, i))), [weekStart]);
  const onChangeMonday = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    setWeekStart(scope, week.id as string, e.target.value);
  }, [scope, week.id, setWeekStart, readOnly]);

  const [open, setOpen] = useLocalStorage<boolean>(`wk_open_${week.id}`, true);
  const [preOpen, setPreOpen] = useLocalStorage<boolean>(
    `wk_pre_open_${week.id}`,
    false
  );
  const [pickOpen, setPickOpen] = useLocalStorage<boolean>(
    `wk_pick_open_${week.id}`,
    false
  );

  const pair = useCallback((m: AnyRecord) => `${m.role || ''}::${m.name || ''}`, []);
  const missingByPair = useCallback((dayList: AnyRecord[] = [], pool: AnyRecord[] = []) => {
    const present = new Set((dayList || []).map(pair));
    return (pool || []).filter(m => {
      const nm = (m?.name || '').trim();
      if (nm === '') return true;
      return !present.has(`${m.role || ''}::${nm}`);
    });
  }, [pair]);
  const uniqueByPair = useCallback((arr: AnyRecord[] = []) => {
    const seen = new Set<string>();
    const out: AnyRecord[] = [];
    for (const m of arr) {
      const key = `${m?.role || ''}::${(m?.name || '').trim()}::${m?.source || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(m);
      }
    }
    return out;
  }, []);
  const poolRefs = useCallback((reinf: AnyRecord[] = []) => (reinf || []).map(r => ({
    role: 'REF',
    name: (r?.name || '').trim(),
    source: 'ref',
  })), []);

  return (
    <div
      id={`wk-${week.id}`}
      className='wk-card rounded-2xl border border-neutral-border bg-neutral-panel/90'
    >
      <WeekCardHeader
        weekLabel={translateWeekLabel(week.label)}
        open={open}
        setOpen={setOpen}
        onExportWeekPDF={onExportWeekPDF}
        onDuplicateWeek={() => duplicateWeek(scope, week.id as string)}
        onDeleteWeek={() => setShowConfirmDelete(true)}
        btnExportCls={btnExportCls}
        btnExportStyle={btnExportStyle}
        readOnly={readOnly}
      />

      {open && (
        <WeekCardTable
          week={week}
          scope={scope}
          weekStart={weekStart}
          datesRow={datesRow}
          onChangeMonday={onChangeMonday}
          setDayField={setDayField}
          getDropdownState={getDropdownState}
          setDropdownState={setDropdownState}
          addMemberTo={addMemberTo}
          setMemberToRemove={setMemberToRemove}
          baseTeam={baseTeam}
          prelightTeam={prelightTeam}
          pickupTeam={pickupTeam}
          reinforcements={reinforcements}
          missingByPair={missingByPair}
          uniqueByPair={uniqueByPair}
          poolRefs={poolRefs}
          preOpen={preOpen}
          setPreOpen={setPreOpen}
          pickOpen={pickOpen}
          setPickOpen={setPickOpen}
          theme={theme}
          focusColor={focusColor}
          readOnly={readOnly}
        />
      )}
      {showConfirmDelete && (
        <ConfirmModal
          title={t('planning.confirmDelete')}
          message={t('planning.confirmDeleteWeek', { weekLabel: translateWeekLabel(week.label) || t('planning.thisWeek') })}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={() => {
            deleteWeek(scope, week.id as string);
          }}
        />
      )}
      {memberToRemove && (
        <ConfirmModal
          title={t('planning.confirmDelete')}
          message={t('team.confirmDeleteMember', { name: memberToRemove.memberName })}
          onClose={() => setMemberToRemove(null)}
          onConfirm={() => {
            removeMemberFrom(
              memberToRemove.scope,
              memberToRemove.weekId,
              memberToRemove.dayIndex,
              memberToRemove.listKey,
              memberToRemove.idx
            );
            setMemberToRemove(null);
          }}
        />
      )}
    </div>
  );
}

export default React.memo(WeekCard);
