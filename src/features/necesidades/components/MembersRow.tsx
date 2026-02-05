import { Td } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateJornadaType as translateJornadaTypeUtil } from '@shared/utils/jornadaTranslations';
import { applyGenderToBadge, getRoleBadgeCode } from '@shared/constants/roles';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { sortTeam } from '@features/equipo/pages/EquipoTab/EquipoTabUtils';
import Chip from './Chip';
import { ConfirmModal } from './ConfirmModal';
import TextAreaAuto from './TextAreaAuto';

type MemberDropdownProps = {
  options: AnyRecord[];
  onSelect: (member: AnyRecord) => void;
  readOnly?: boolean;
  placeholder?: string;
  theme: 'dark' | 'light';
  existingList?: AnyRecord[];
  context?: 'prelight' | 'pickup' | 'mixed';
};

type DropdownState = { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean };

type JornadaDropdownCellProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  dropdownKey: string;
  dropdownState: DropdownState;
  setDropdownState: (key: string, updates: Partial<DropdownState>) => void;
  theme: 'dark' | 'light';
  focusColor: string;
  translateJornadaType: (value: string) => string;
};

function JornadaDropdownCell({
  value,
  onChange,
  readOnly,
  dropdownKey,
  dropdownState,
  setDropdownState,
  theme,
  focusColor,
  translateJornadaType,
}: JornadaDropdownCellProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownState(dropdownKey, { isOpen: false });
      }
    };

    if (dropdownState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownState.isOpen, dropdownKey, setDropdownState]);

  return (
    <div className='w-full relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => !readOnly && setDropdownState(dropdownKey, { isOpen: !dropdownState.isOpen })}
        onMouseEnter={() => !readOnly && setDropdownState(dropdownKey, { isButtonHovered: true })}
        onMouseLeave={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        onBlur={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        disabled={readOnly}
        className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg border focus:outline-none text-[9px] sm:text-[10px] md:text-xs text-left transition-colors ${
          readOnly ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          theme === 'light'
            ? 'bg-white text-gray-900'
            : 'bg-black/40 text-zinc-300'
        }`}
        style={{
          borderWidth: dropdownState.isButtonHovered ? '1.5px' : '1px',
          borderStyle: 'solid',
          borderColor: dropdownState.isButtonHovered && theme === 'light'
            ? '#0476D9'
            : (dropdownState.isButtonHovered && theme === 'dark'
              ? '#fff'
              : 'var(--border)'),
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M5 7.5L1.25 3.75h7.5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.4rem center',
          paddingRight: '1.5rem',
        }}
      >
        {value ? translateJornadaType(value) : '\u00A0'}
      </button>
      {dropdownState.isOpen && (
        <div
          className={`absolute top-full left-0 mt-0.5 sm:mt-1 w-full border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-50 overflow-y-auto max-h-48 sm:max-h-56 md:max-h-60 ${
            theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
          }`}
        >
          {JORNADA_OPTIONS.map(opt => (
            <button
              key={opt}
              type='button'
              onClick={() => {
                if (readOnly) return;
                onChange(opt);
                setDropdownState(dropdownKey, { isOpen: false, hoveredOption: null });
              }}
              disabled={readOnly}
              onMouseEnter={() => setDropdownState(dropdownKey, { hoveredOption: opt })}
              onMouseLeave={() => setDropdownState(dropdownKey, { hoveredOption: null })}
              className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs transition-colors ${
                theme === 'light'
                  ? 'text-gray-900'
                  : 'text-zinc-300'
              }`}
              style={{
                backgroundColor: dropdownState.hoveredOption === opt
                  ? (theme === 'light' ? '#A0D3F2' : focusColor)
                  : 'transparent',
                color: dropdownState.hoveredOption === opt
                  ? (theme === 'light' ? '#111827' : 'white')
                  : 'inherit',
              }}
            >
              {translateJornadaType(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberDropdown({
  options,
  onSelect,
  readOnly = false,
  placeholder = 'Buscar...',
  theme,
  existingList = [],
  context,
}: MemberDropdownProps) {
  const { i18n } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchQuery('');
      }
    };

    if (open) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        searchInputRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const filteredOptions = useMemo(() => {
    const existingKeys = new Set(
      (existingList || []).map(m => {
        const role = (m?.role || '').toString().trim().toUpperCase();
        const name = (m?.name || '').toString().trim();
        return `${role}::${name}`;
      })
    );
    const base = (options || []).filter(opt => {
      const role = (opt?.role || '').toString().trim().toUpperCase();
      const name = (opt?.name || '').toString().trim();
      const key = `${role}::${name}`;
      return role === '' || name === '' || !existingKeys.has(key);
    });
    if (!searchQuery.trim()) return base;
    const query = searchQuery.toLowerCase();
    return base.filter(opt => {
      const name = (opt?.name || '').toLowerCase();
      const role = (opt?.role || '').toLowerCase();
      return name.includes(query) || role.includes(query);
    });
  }, [options, searchQuery, existingList]);

  return (
    <div className='no-pdf w-full relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          if (!readOnly) setOpen(prev => !prev);
        }}
        disabled={readOnly}
        className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg border focus:outline-none text-[9px] sm:text-[10px] md:text-xs text-left ${
          readOnly ? 'opacity-50 cursor-not-allowed' : ''
        } ${'bg-white text-gray-900 dark:bg-black/40 dark:text-zinc-300'}`}
        style={{
          borderColor: 'var(--border)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M5 7.5L1.25 3.75h7.5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.4rem center',
          paddingRight: '1.5rem',
        }}
      >
        {placeholder}
      </button>
      {open && !readOnly && (
        <div
          className={`absolute top-full left-0 mt-0.5 sm:mt-1 w-full border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-50 overflow-hidden flex flex-col max-h-48 sm:max-h-56 md:max-h-60 ${
            'bg-white dark:bg-neutral-panel'
          }`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className='p-1.5 sm:p-2 border-b border-neutral-border'>
            <input
              ref={searchInputRef}
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Buscar...'
              className={`w-full px-2 py-1 text-[9px] sm:text-[10px] md:text-xs rounded border focus:outline-none ${
                'bg-white text-gray-900 border-gray-300 dark:bg-black/40 dark:text-zinc-300 dark:border-zinc-600'
              }`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className='overflow-y-auto flex-1'>
            {filteredOptions.length === 0 ? (
              <div className='px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-center text-gray-500 dark:text-zinc-400'>
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((opt: AnyRecord, idx: number) => (
                <button
                  key={`${opt?.role || 'role'}-${opt?.name || 'name'}-${idx}`}
                  type='button'
                  onClick={() => {
                    onSelect(opt);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className='w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs transition-colors text-gray-900 dark:text-zinc-300 hover:bg-blue-100 dark:hover:bg-zinc-700'
                >
                  {(() => {
                    const rawRole = (opt?.role || '').toString().trim().toUpperCase();
                    const name = (opt?.name || '').trim();
                    const isRefRole = rawRole === 'REF' || (rawRole.startsWith('REF') && rawRole.length > 3);
                    if (!rawRole) return `· ${name}`;
                    const gender = (opt as AnyRecord)?.gender as 'male' | 'female' | 'neutral' | undefined;
                    if (isRefRole || !context) {
                      const badge = applyGenderToBadge(getRoleBadgeCode(rawRole, i18n.language), gender);
                      return `${badge} · ${name}`;
                    }
                    if (rawRole.endsWith('P') || rawRole.endsWith('R')) {
                      const badge = applyGenderToBadge(getRoleBadgeCode(rawRole, i18n.language), gender);
                      return `${badge} · ${name}`;
                    }
                    const source = (opt as AnyRecord)?.source || '';
                    const shouldSuffix =
                      (context === 'prelight' && source === 'pre') ||
                      (context === 'pickup' && source === 'pick') ||
                      (context === 'mixed' && (source === 'pre' || source === 'pick'));
                    if (!shouldSuffix) {
                      const badge = applyGenderToBadge(getRoleBadgeCode(rawRole, i18n.language), gender);
                      return `${badge} · ${name}`;
                    }
                    const suffix = source === 'pre' ? 'P' : 'R';
                    const badge = applyGenderToBadge(getRoleBadgeCode(`${rawRole}${suffix}`, i18n.language), gender);
                    return `${badge} · ${name}`;
                  })()}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type MembersRowProps = {
  label: string;
  listKey: string;
  weekId: string;
  weekObj: AnyRecord;
  options: AnyRecord[];
  removeFromList: (weekId: string, dayIdx: number, listKey: string, idx: number) => void;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  readOnly?: boolean;
  rowKey?: string;
  isSelected?: boolean;
  toggleRowSelection?: (rowKey: string) => void;
  showSelection?: boolean;
  showSchedule?: boolean;
  jornadaKey?: string;
  startKey?: string;
  endKey?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

const JORNADA_OPTIONS = [
  'Localizar',
  'Oficina',
  'Carga',
  'Pruebas de cámara',
  'Rodaje',
  'Rodaje Festivo',
  'Travel Day',
  'Prelight',
  'Recogida',
  'Descarga',
  'Descanso',
  'Fin',
];

export function MembersRow({
  label,
  listKey,
  weekId,
  weekObj,
  options,
  removeFromList,
  setCell,
  readOnly = false,
  rowKey,
  isSelected,
  toggleRowSelection,
  showSelection = true,
  showSchedule = false,
  jornadaKey,
  startKey,
  endKey,
  collapsible = false,
  defaultCollapsed = false,
}: MembersRowProps) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });
  const [dropdownStates, setDropdownStates] = useState<Record<string, DropdownState>>({});
  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';
  const [memberToRemove, setMemberToRemove] = useState<{
    weekId: string;
    dayIdx: number;
    listKey: string;
    idx: number;
    memberName: string;
  } | null>(null);
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(
    `needs_row_${weekId}_${listKey}_collapsed`,
    defaultCollapsed
  );

  const DAYS = useMemo(() => [
    { idx: 0, key: 'mon', name: t('reports.dayNames.monday') },
    { idx: 1, key: 'tue', name: t('reports.dayNames.tuesday') },
    { idx: 2, key: 'wed', name: t('reports.dayNames.wednesday') },
    { idx: 3, key: 'thu', name: t('reports.dayNames.thursday') },
    { idx: 4, key: 'fri', name: t('reports.dayNames.friday') },
    { idx: 5, key: 'sat', name: t('reports.dayNames.saturday') },
    { idx: 6, key: 'sun', name: t('reports.dayNames.sunday') },
  ], [t]);

  const rosterGenderMap = useMemo(() => {
    const map = new Map<string, string>();
    (options || []).forEach((m: AnyRecord) => {
      const role = (m?.role || '').toString().trim().toUpperCase();
      const name = (m?.name || '').toString().trim();
      if (!role && !name) return;
      const key = `${role}::${name}`;
      if (m?.gender) map.set(key, String(m.gender));
    });
    return map;
  }, [options]);

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

    return () => {
      observer.disconnect();
    };
  }, []);

  const getDropdownState = (key: string) =>
    dropdownStates[key] || { isOpen: false, hoveredOption: null, isButtonHovered: false };

  const setDropdownState = (key: string, updates: Partial<DropdownState>) => {
    setDropdownStates(prev => ({
      ...prev,
      [key]: { ...getDropdownState(key), ...updates },
    }));
  };

  const translateJornadaType = (tipo: string): string => {
    const translateFn = (key: string, defaultValue?: string): string => {
      const translated = t(key);
      return translated === key && defaultValue ? defaultValue : translated;
    };
    return translateJornadaTypeUtil(tipo, translateFn);
  };

  const sortMemberList = (list: AnyRecord[]) =>
    sortTeam(
      (list || []).map((m: AnyRecord, idx: number) => ({
        ...m,
        seq: m?.seq ?? idx,
      }))
    );

  return (
    <>
      <tr>
        {showSelection && rowKey && toggleRowSelection && (
        <Td align='middle' className='text-center w-6 sm:w-7 md:w-8 px-0.5'>
            <div className='flex justify-center'>
              <input
                type='checkbox'
                checked={isSelected ?? true}
                onChange={() => !readOnly && toggleRowSelection(rowKey)}
                disabled={readOnly}
                title={readOnly ? t('conditions.projectClosed') : (isSelected ? t('needs.deselectForExport') : t('needs.selectForExport'))}
              className={`accent-blue-500 dark:accent-[#f59e0b] scale-90 transition ${
                readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } opacity-70 hover:opacity-100`}
              />
            </div>
          </Td>
        )}
      <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-normal break-words text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
          <div className='flex items-center gap-2'>
            {collapsible && (
              <button
                type='button'
                onClick={() => setCollapsed(v => !v)}
                className='text-[8px] sm:text-[9px] md:text-[10px] font-semibold'
                style={{ color: 'var(--text)' }}
                title={collapsed ? t('needs.open') : t('needs.close')}
              >
                {collapsed ? '+' : '−'}
              </button>
            )}
            <span>{label}</span>
          </div>
        </Td>
        {DAYS.map((d, i) => {
          const day: AnyRecord = (weekObj as AnyRecord).days?.[i] || {};
          const list = Array.isArray(day[listKey]) ? (day[listKey] as AnyRecord[]) : [];
          const jornadaValue = jornadaKey ? (day as AnyRecord)[jornadaKey] || '' : '';
          const jornadaNormalized = String(jornadaValue).trim().toLowerCase();
          const isCrewRestOrEnd =
            listKey === 'crewList' && (jornadaNormalized === 'descanso' || jornadaNormalized === 'fin');
          const isOfficeOrLocation =
            jornadaValue === 'Oficina' || jornadaValue === 'Localizar';
          const isBaseOnlyJornada =
            jornadaValue === 'Carga' ||
            jornadaValue === 'Descarga' ||
            jornadaValue === 'Pruebas de cámara' ||
            jornadaValue === 'Prelight' ||
            jornadaValue === 'Recogida';
          const roleFilteredOptions =
            listKey === 'crewList' && isOfficeOrLocation
              ? options.filter(opt => opt?.role === 'G' || opt?.role === 'BB')
              : listKey === 'crewList' && isBaseOnlyJornada
                ? options
                : options;
          const startValue = startKey ? (day as AnyRecord)[startKey] || '' : '';
          const endValue = endKey ? (day as AnyRecord)[endKey] || '' : '';
          const dropdownKey = jornadaKey ? `${weekId}_${listKey}_${jornadaKey}_${i}` : '';
          const dropdownState = dropdownKey ? getDropdownState(dropdownKey) : null;
          const chipContext = listKey === 'preList'
            ? 'prelight'
            : listKey === 'pickList'
              ? 'pickup'
              : undefined;
          const dropdownContext = listKey === 'preList'
            ? 'prelight'
            : listKey === 'pickList'
              ? 'pickup'
              : listKey === 'refList'
                ? 'mixed'
                : undefined;

          return (
            <Td key={d.key} align='middle' className='text-center'>
              {collapsible && collapsed ? (
                <div className='flex items-center justify-center min-h-[20px] sm:min-h-[24px] md:min-h-[28px]' />
              ) : (
                <>
              {showSchedule && jornadaKey && (
                <div className='mb-1'>
                  {dropdownState && (
                    <JornadaDropdownCell
                      value={jornadaValue}
                      onChange={(nextValue) => {
                        if (readOnly) return;
                        setCell(weekId, i, jornadaKey, nextValue);
                        if (listKey !== 'crewList') return;
                        if (nextValue === 'Fin') {
                          const clearKeys = [
                            'crewList',
                            'refList',
                            'preList',
                            'pickList',
                            'crewTxt',
                            'refTxt',
                            'preNote',
                            'pickNote',
                            'crewStart',
                            'crewEnd',
                            'preStart',
                            'preEnd',
                            'pickStart',
                            'pickEnd',
                            'prelightTipo',
                            'pickupTipo',
                            'loc',
                            'seq',
                          ];
                          for (let dayIdx = i; dayIdx < 7; dayIdx += 1) {
                            clearKeys.forEach(key => {
                              const emptyValue = key.endsWith('List') ? [] : '';
                              setCell(weekId, dayIdx, key, emptyValue);
                            });
                            setCell(weekId, dayIdx, 'crewTipo', 'Fin');
                          }
                          return;
                        }
                        const currentList = Array.isArray(list) ? list : [];
                        const currentJornada = String(jornadaValue || '').trim().toLowerCase();
                        const nextJornada = String(nextValue || '').trim().toLowerCase();
                        const wasRest = currentJornada === 'descanso' || currentJornada === 'fin';
                        const isEmpty = currentList.length === 0;
                        if (!wasRest && !isEmpty) return;
                        const baseTeam = (options || [])
                          .map(m => ({
                            role: (m?.role || '').toUpperCase(),
                            name: (m?.name || '').trim(),
                            gender: m?.gender,
                            source: m?.source || 'base',
                          }))
                          .filter(m => m.role || m.name);
                        const isOfficeOrLocationNext =
                          nextValue === 'Oficina' || nextValue === 'Localizar';
                        const isBaseOnlyNext =
                          nextValue === 'Carga' ||
                          nextValue === 'Descarga' ||
                          nextValue === 'Pruebas de cámara' ||
                          nextValue === 'Prelight' ||
                          nextValue === 'Recogida' ||
                          nextValue === 'Rodaje' ||
                          nextValue === 'Rodaje Festivo' ||
                          nextValue === 'Travel Day';
                        if (isOfficeOrLocationNext) {
                          const minimal = baseTeam.filter(m => m.role === 'G' || m.role === 'BB');
                          setCell(weekId, i, listKey, minimal);
                        } else if (isBaseOnlyNext) {
                          setCell(weekId, i, listKey, baseTeam);
                        }
                      }}
                      readOnly={readOnly}
                      dropdownKey={dropdownKey}
                      dropdownState={dropdownState}
                      setDropdownState={setDropdownState}
                      theme={theme}
                      focusColor={focusColor}
                      translateJornadaType={translateJornadaType}
                    />
                  )}
                </div>
              )}
              {showSchedule && startKey && endKey && !isCrewRestOrEnd && (
                <div className='mb-1 flex items-center gap-1'>
                  <input
                    type='time'
                    value={startValue}
                    onChange={(e) => !readOnly && setCell(weekId, i, startKey, e.target.value)}
                    disabled={readOnly}
                    className={`w-[48%] px-1 py-0.5 rounded border text-[9px] sm:text-[10px] md:text-xs ${
                      readOnly ? 'opacity-50 cursor-not-allowed' : ''
                    } ${'bg-white text-gray-900 dark:bg-black/40 dark:text-zinc-300'}`}
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <input
                    type='time'
                    value={endValue}
                    onChange={(e) => !readOnly && setCell(weekId, i, endKey, e.target.value)}
                    disabled={readOnly}
                    className={`w-[48%] px-1 py-0.5 rounded border text-[9px] sm:text-[10px] md:text-xs ${
                      readOnly ? 'opacity-50 cursor-not-allowed' : ''
                    } ${'bg-white text-gray-900 dark:bg-black/40 dark:text-zinc-300'}`}
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
              )}
              {!isCrewRestOrEnd && (
                <>
                  <div className='flex flex-wrap gap-0.5 sm:gap-1 md:gap-1.5 mb-0.5 sm:mb-1 md:mb-1.5 justify-center'>
                    {list.length === 0 && (
                      <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>—</span>
                    )}
                  {list.map((m, idx) => {
                  const roleKey = (m?.role || '').toString().trim().toUpperCase();
                  const nameKey = (m?.name || '').toString().trim();
                  const mapKey = `${roleKey}::${nameKey}`;
                  const gender = m?.gender || rosterGenderMap.get(mapKey);
                  return (
                      <Chip
                        key={`${m.role}-${m.name}-${idx}`}
                        role={(m as AnyRecord)?.role}
                        name={(m as AnyRecord)?.name}
                    gender={gender}
                        source={(m as AnyRecord)?.source}
                        context={chipContext}
                        onRemove={() => {
                          if (readOnly) return;
                          setMemberToRemove({
                            weekId,
                            dayIdx: i,
                            listKey,
                            idx,
                            memberName: (m as AnyRecord)?.name || t('team.thisMember')
                          });
                        }}
                        readOnly={readOnly}
                      />
                  );
                })}
                  </div>
                  <MemberDropdown
                    options={roleFilteredOptions}
                    readOnly={readOnly}
                    placeholder={t('planning.addMember')}
                    theme={theme}
                    existingList={list}
                    context={dropdownContext}
                    onSelect={(member: AnyRecord) => {
                      if (readOnly) return;
                      const current = Array.isArray(list) ? list : [];
                      const key = `${(member?.role || '').toUpperCase()}::${(member?.name || '').trim()}`;
                      const exists = current.some(m => `${(m?.role || '').toUpperCase()}::${(m?.name || '').trim()}` === key);
                      if (exists) return;
                      const next = sortMemberList([
                        ...current,
                        {
                          role: (member?.role || '').toUpperCase(),
                          name: (member?.name || '').trim(),
                          gender: member?.gender,
                          source: member?.source || 'base',
                        }
                      ]);
                      setCell(weekId, i, listKey, next);
                    }}
                  />
                  {listKey === 'crewList' && (
                    <div className='mt-1'>
                      <TextAreaAuto
                        value={String((day as AnyRecord).crewTxt || '')}
                        onChange={(val: string) => !readOnly && setCell(weekId, i, 'crewTxt', val)}
                        placeholder={t('needs.writeHere')}
                        readOnly={readOnly}
                      />
                    </div>
                  )}
                  {listKey === 'refList' && (
                    <div className='mt-1'>
                      <TextAreaAuto
                        value={String((day as AnyRecord).refTxt || '')}
                        onChange={(val: string) => !readOnly && setCell(weekId, i, 'refTxt', val)}
                        placeholder={t('needs.writeHere')}
                        readOnly={readOnly}
                      />
                    </div>
                  )}
                  {listKey === 'preList' && (
                    <div className='mt-1'>
                      <TextAreaAuto
                        value={String((day as AnyRecord).preNote || '')}
                        onChange={(val: string) => !readOnly && setCell(weekId, i, 'preNote', val)}
                        placeholder={t('needs.writeHere')}
                        readOnly={readOnly}
                      />
                    </div>
                  )}
                  {listKey === 'pickList' && (
                    <div className='mt-1'>
                      <TextAreaAuto
                        value={String((day as AnyRecord).pickNote || '')}
                        onChange={(val: string) => !readOnly && setCell(weekId, i, 'pickNote', val)}
                        placeholder={t('needs.writeHere')}
                        readOnly={readOnly}
                      />
                    </div>
                  )}
                </>
              )}
                </>
              )}
            </Td>
          );
        })}
      </tr>
      {memberToRemove && (
        <ConfirmModal
          title={t('needs.confirmDeletion')}
          message={t('needs.confirmDeleteMember', { name: memberToRemove.memberName })}
          onClose={() => setMemberToRemove(null)}
          onConfirm={() => {
            removeFromList(
              memberToRemove.weekId,
              memberToRemove.dayIdx,
              memberToRemove.listKey,
              memberToRemove.idx
            );
            setMemberToRemove(null);
          }}
        />
      )}
    </>
  );
}
