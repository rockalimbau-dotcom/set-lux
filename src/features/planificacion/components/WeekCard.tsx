import { Th, Td, Row, Button } from '@shared/components';
import ChipBase from '@shared/components/Chip';
import ToggleIconButton from '@shared/components/ToggleIconButton';
import { ROLE_COLORS } from '@shared/constants/roles';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ title, message, onClose, onConfirm }: ConfirmModalProps) {
  const { t } = useTranslation();
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

    return () => {
      observer.disconnect();
    };
  }, []);

  const isLight = theme === 'light';

  return (
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
      <div 
        className='w-full max-w-md rounded-2xl border border-neutral-border p-6'
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--panel)'
        }}
      >
        <h3 
          className='text-lg font-semibold mb-4' 
          style={{
            color: isLight ? '#0476D9' : '#F27405'
          }}
        >
          {title}
        </h3>
        
        <p 
          className='text-sm mb-6' 
          style={{color: isLight ? '#111827' : '#d1d5db'}}
          dangerouslySetInnerHTML={{
            __html: message
          }}
        />

        <div className='flex justify-center gap-3'>
          <button
            onClick={onClose}
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: 'var(--border)',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
              color: isLight ? '#111827' : '#d1d5db'
            }}
            type='button'
          >
            {t('common.no')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: isLight ? '#F27405' : '#F27405',
              color: isLight ? '#F27405' : '#F27405',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
            }}
            type='button'
          >
            {t('common.yes')}
          </button>
        </div>
      </div>
    </div>
  );
}

type AnyRecord = Record<string, any>;

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

const pad2 = (n: number) => String(n).padStart(2, '0');
const toYYYYMMDD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseYYYYMMDD = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (date: Date, days: number) => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
};
const formatDDMMYYYY = (date: Date) =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;

// Helper function to get translated day name
const getDayName = (key: string, t: (key: string) => string): string => {
  const dayMap: Record<string, string> = {
    'mon': t('planning.monday'),
    'tue': t('planning.tuesday'),
    'wed': t('planning.wednesday'),
    'thu': t('planning.thursday'),
    'fri': t('planning.friday'),
    'sat': t('planning.saturday'),
    'sun': t('planning.sunday'),
  };
  return dayMap[key] || key;
};

const DAYS = [
  { idx: 0, key: 'mon', name: 'Lunes' },
  { idx: 1, key: 'tue', name: 'Martes' },
  { idx: 2, key: 'wed', name: 'Miércoles' },
  { idx: 3, key: 'thu', name: 'Jueves' },
  { idx: 4, key: 'fri', name: 'Viernes' },
  { idx: 5, key: 'sat', name: 'Sábado' },
  { idx: 6, key: 'sun', name: 'Domingo' },
];

// Componente separado para el dropdown de jornada
type JornadaDropdownProps = {
  scope: 'pre' | 'pro';
  weekId: string;
  dayIndex: number;
  day: AnyRecord;
  dropdownKey: string;
  dropdownState: { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean };
  setDropdownState: (key: string, updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>) => void;
  setDayField: (scope: 'pre' | 'pro', weekId: string, dayIdx: number, patch: AnyRecord) => void;
  theme: 'dark' | 'light';
  focusColor: string;
  readOnly?: boolean;
};

function JornadaDropdown({
  scope,
  weekId,
  dayIndex,
  day,
  dropdownKey,
  dropdownState,
  setDropdownState,
  setDayField,
  theme,
  focusColor,
  readOnly = false,
}: JornadaDropdownProps) {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const jornadaOptions = ['Rodaje', 'Oficina', 'Carga', 'Descarga', 'Localizar', 'Travel Day', 'Rodaje Festivo', 'Fin', 'Descanso'];
  
  // Helper function to translate jornada type
  const translateJornadaType = (tipo: string): string => {
    const typeMap: Record<string, string> = {
      'Rodaje': t('planning.shooting'),
      'Oficina': t('planning.office'),
      'Carga': t('planning.loading'),
      'Descarga': t('planning.unloading'),
      'Localizar': t('planning.location'),
      'Travel Day': t('planning.travelDay'),
      'Rodaje Festivo': t('planning.holidayShooting'),
      'Fin': t('planning.end'),
      'Descanso': t('planning.rest'),
    };
    return typeMap[tipo] || tipo;
  };

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
    <Td align='middle'>
      <div className='w-full relative' ref={dropdownRef}>
        <button
          type='button'
          onClick={() => !readOnly && setDropdownState(dropdownKey, { isOpen: !dropdownState.isOpen })}
          onMouseEnter={() => !readOnly && setDropdownState(dropdownKey, { isButtonHovered: true })}
          onMouseLeave={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
          onBlur={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
          disabled={readOnly}
          className={`w-full px-2 py-1 rounded-lg border focus:outline-none text-sm text-left transition-colors ${
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
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
            paddingRight: '2rem',
          }}
        >
          {day.tipo ? translateJornadaType(day.tipo) : '\u00A0'}
        </button>
        {dropdownState.isOpen && (
          <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
            theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
          }`}>
            {jornadaOptions.map(opt => {
              // Si estamos cambiando de Descanso o Fin a otro tipo, limpiar la localización
              const wasRestDay = day.tipo === 'Descanso' || day.tipo === 'Fin';
              const isNowWorkDay = opt !== 'Descanso' && opt !== 'Fin';
              
              return (
              <button
                key={opt}
                type='button'
                onClick={() => {
                  if (readOnly) return;
                  const update: AnyRecord = { tipo: opt };
                  // Si cambiamos de Descanso/Fin a un día de trabajo, limpiar localización
                  if (wasRestDay && isNowWorkDay) {
                    update.loc = '';
                  }
                  setDayField(scope, weekId, dayIndex, update);
                  setDropdownState(dropdownKey, { isOpen: false, hoveredOption: null });
                }}
                disabled={readOnly}
                onMouseEnter={() => setDropdownState(dropdownKey, { hoveredOption: opt })}
                onMouseLeave={() => setDropdownState(dropdownKey, { hoveredOption: null })}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
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
              );
            })}
          </div>
        )}
      </div>
    </Td>
  );
}

// Componente separado para el dropdown de añadir miembro al equipo
type AddMemberDropdownProps = {
  scope: 'pre' | 'pro';
  weekId: string;
  dayIndex: number;
  day: AnyRecord;
  dropdownKey: string;
  dropdownState: { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean };
  setDropdownState: (key: string, updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>) => void;
  addMemberTo: (scope: 'pre' | 'pro', weekId: string, dayIdx: number, listKey: 'team' | 'prelight' | 'pickup', member: AnyRecord) => void;
  options: AnyRecord[];
  theme: 'dark' | 'light';
  focusColor: string;
  readOnly?: boolean;
};

function AddMemberDropdown({
  scope,
  weekId,
  dayIndex,
  day,
  dropdownKey,
  dropdownState,
  setDropdownState,
  addMemberTo,
  options,
  theme,
  focusColor,
  readOnly = false,
}: AddMemberDropdownProps) {
  const { t } = useTranslation();
  // Verificar primero si debemos renderizar (optimización)
  if (day.tipo === 'Descanso' || day.tipo === 'Fin') {
    return null;
  }

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
    <div className='no-pdf w-full relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => !readOnly && setDropdownState(dropdownKey, { isOpen: !dropdownState.isOpen })}
        onMouseEnter={() => !readOnly && setDropdownState(dropdownKey, { isButtonHovered: true })}
        onMouseLeave={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        onBlur={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        disabled={readOnly}
        className={`w-full px-2 py-1 rounded-lg border focus:outline-none text-sm text-left transition-colors ${
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          paddingRight: '2rem',
        }}
      >
        {t('planning.addMember')}
      </button>
      {dropdownState.isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
          theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
        }`}>
          {options.map((p: AnyRecord, ii: number) => (
            <button
              key={`${p.role}-${p.name}-${ii}`}
              type='button'
              onClick={() => {
                if (readOnly) return;
                const [role, name] = `${p.role}::${p.name}`.split('::');
                addMemberTo(scope, weekId, dayIndex, 'team', {
                  role,
                  name,
                });
                setDropdownState(dropdownKey, { isOpen: false, hoveredOption: null });
              }}
              disabled={readOnly}
              onMouseEnter={() => setDropdownState(dropdownKey, { hoveredOption: `${p.role}::${p.name}` })}
              onMouseLeave={() => setDropdownState(dropdownKey, { hoveredOption: null })}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                theme === 'light' 
                  ? 'text-gray-900' 
                  : 'text-zinc-300'
              }`}
              style={{
                backgroundColor: dropdownState.hoveredOption === `${p.role}::${p.name}` 
                  ? (theme === 'light' ? '#A0D3F2' : focusColor)
                  : 'transparent',
                color: dropdownState.hoveredOption === `${p.role}::${p.name}` 
                  ? (theme === 'light' ? '#111827' : 'white')
                  : 'inherit',
              }}
            >
              {p.role} · {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente separado para el dropdown de añadir miembro a prelight
type AddPrelightDropdownProps = {
  scope: 'pre' | 'pro';
  weekId: string;
  dayIndex: number;
  day: AnyRecord;
  dropdownKey: string;
  dropdownState: { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean };
  setDropdownState: (key: string, updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>) => void;
  addMemberTo: (scope: 'pre' | 'pro', weekId: string, dayIdx: number, listKey: 'team' | 'prelight' | 'pickup', member: AnyRecord) => void;
  options: AnyRecord[];
  theme: 'dark' | 'light';
  focusColor: string;
  readOnly?: boolean;
};

function AddPrelightDropdown({
  scope,
  weekId,
  dayIndex,
  day,
  dropdownKey,
  dropdownState,
  setDropdownState,
  addMemberTo,
  options,
  theme,
  focusColor,
  readOnly = false,
}: AddPrelightDropdownProps) {
  const { t } = useTranslation();
  // Verificar primero si debemos renderizar (optimización)
  if (day.tipo === 'Descanso' || day.tipo === 'Fin') {
    return null;
  }

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
        disabled={readOnly}
        onMouseEnter={() => !readOnly && setDropdownState(dropdownKey, { isButtonHovered: true })}
        onMouseLeave={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        onBlur={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        className={`w-full px-2 py-1 rounded-lg border focus:outline-none text-sm text-left transition-colors ${
          theme === 'light' 
            ? 'bg-white text-gray-900' 
            : 'bg-black/40 text-zinc-300'
        } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          borderWidth: dropdownState.isButtonHovered ? '1.5px' : '1px',
          borderStyle: 'solid',
          borderColor: dropdownState.isButtonHovered && theme === 'light' 
            ? '#0476D9' 
            : (dropdownState.isButtonHovered && theme === 'dark'
              ? '#fff'
              : 'var(--border)'),
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          paddingRight: '2rem',
        }}
        title={readOnly ? t('conditions.projectClosed') : t('planning.addMember')}
      >
        {t('planning.addMember')}
      </button>
      {dropdownState.isOpen && !readOnly && (
        <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
          theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
        }`}>
          {options.map((p: AnyRecord, ii: number) => {
            const displayRole =
              p.source === 'pre' && p.role !== 'REF'
                ? `${p.role}P`
                : p.role;
            const optionValue = `${p.role}::${p.name}::pre`;
            return (
              <button
                key={`${p.role}-${p.name}-${ii}`}
                type='button'
                onClick={() => {
                  if (readOnly) return;
                  const [role, name, source] = optionValue.split('::');
                  addMemberTo(scope, weekId, dayIndex, 'prelight', {
                    role,
                    name,
                    source,
                  });
                  setDropdownState(dropdownKey, { isOpen: false, hoveredOption: null });
                }}
                disabled={readOnly}
                onMouseEnter={() => setDropdownState(dropdownKey, { hoveredOption: optionValue })}
                onMouseLeave={() => setDropdownState(dropdownKey, { hoveredOption: null })}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  theme === 'light' 
                    ? 'text-gray-900' 
                    : 'text-zinc-300'
                } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  backgroundColor: dropdownState.hoveredOption === optionValue 
                    ? (theme === 'light' ? '#A0D3F2' : focusColor)
                    : 'transparent',
                  color: dropdownState.hoveredOption === optionValue 
                    ? (theme === 'light' ? '#111827' : 'white')
                    : 'inherit',
                }}
              >
                {displayRole} · {p.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Componente separado para el dropdown de añadir miembro a recogida
type AddPickupDropdownProps = {
  scope: 'pre' | 'pro';
  weekId: string;
  dayIndex: number;
  day: AnyRecord;
  dropdownKey: string;
  dropdownState: { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean };
  setDropdownState: (key: string, updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>) => void;
  addMemberTo: (scope: 'pre' | 'pro', weekId: string, dayIdx: number, listKey: 'team' | 'prelight' | 'pickup', member: AnyRecord) => void;
  options: AnyRecord[];
  theme: 'dark' | 'light';
  focusColor: string;
  readOnly?: boolean;
};

function AddPickupDropdown({
  scope,
  weekId,
  dayIndex,
  day,
  dropdownKey,
  dropdownState,
  setDropdownState,
  addMemberTo,
  options,
  theme,
  focusColor,
  readOnly = false,
}: AddPickupDropdownProps) {
  const { t } = useTranslation();
  // Verificar primero si debemos renderizar (optimización)
  if (day.tipo === 'Descanso' || day.tipo === 'Fin') {
    return null;
  }

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
        disabled={readOnly}
        onMouseEnter={() => !readOnly && setDropdownState(dropdownKey, { isButtonHovered: true })}
        onMouseLeave={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        onBlur={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        className={`w-full px-2 py-1 rounded-lg border focus:outline-none text-sm text-left transition-colors ${
          theme === 'light' 
            ? 'bg-white text-gray-900' 
            : 'bg-black/40 text-zinc-300'
        } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          borderWidth: dropdownState.isButtonHovered ? '1.5px' : '1px',
          borderStyle: 'solid',
          borderColor: dropdownState.isButtonHovered && theme === 'light' 
            ? '#0476D9' 
            : (dropdownState.isButtonHovered && theme === 'dark'
              ? '#fff'
              : 'var(--border)'),
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          paddingRight: '2rem',
        }}
        title={readOnly ? t('conditions.projectClosed') : t('planning.addMember')}
      >
        {t('planning.addMember')}
      </button>
      {dropdownState.isOpen && !readOnly && (
        <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
          theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
        }`}>
          {options.map((p: AnyRecord, ii: number) => {
            const displayRole =
              p.source === 'pick' && p.role !== 'REF'
                ? `${p.role}R`
                : p.role;
            const optionValue = `${p.role}::${p.name}::pick`;
            return (
              <button
                key={`${p.role}-${p.name}-${ii}`}
                type='button'
                onClick={() => {
                  if (readOnly) return;
                  const [role, name, source] = optionValue.split('::');
                  addMemberTo(scope, weekId, dayIndex, 'pickup', {
                    role,
                    name,
                    source,
                  });
                  setDropdownState(dropdownKey, { isOpen: false, hoveredOption: null });
                }}
                disabled={readOnly}
                onMouseEnter={() => setDropdownState(dropdownKey, { hoveredOption: optionValue })}
                onMouseLeave={() => setDropdownState(dropdownKey, { hoveredOption: null })}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  theme === 'light' 
                    ? 'text-gray-900' 
                    : 'text-zinc-300'
                }`}
                style={{
                  backgroundColor: dropdownState.hoveredOption === optionValue 
                    ? (theme === 'light' ? '#A0D3F2' : focusColor)
                    : 'transparent',
                  color: dropdownState.hoveredOption === optionValue 
                    ? (theme === 'light' ? '#111827' : 'white')
                    : 'inherit',
                }}
              >
                {displayRole} · {p.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  const Chip = ({ role, name, source }: { role: string; name: string; source?: string }) => {
    const col = (ROLE_COLORS as AnyRecord)[role] || { bg: '#444', fg: '#fff' };
    const roleLabels: AnyRecord = {
      G: 'G',
      BB: 'BB',
      E: 'E',
      TM: 'TM',
      FB: 'FB',
      AUX: 'AUX',
      M: 'M',
      REF: 'R',
    };
    let label: string = roleLabels[role] || role;
    if (role !== 'REF') {
      if (source === 'pre') label = `${label}P`;
      if (source === 'pick') label = `${label}R`;
    }
    return (
      <ChipBase label={label} colorBg={col.bg} colorFg={col.fg} text={name} />
    );
  };

  return (
    <div
      id={`wk-${week.id}`}
      className='wk-card rounded-2xl border border-neutral-border bg-neutral-panel/90'
    >
      <div className='flex items-center justify-between gap-3 px-5 py-4'>
        <div className='flex items-center gap-3'>
          <ToggleIconButton
            isOpen={open}
            onClick={() => setOpen(v => !v)}
            className='w-8 h-8'
          />
          <div className='text-brand font-semibold'>{translateWeekLabel(week.label)}</div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='export'
            size='sm'
            className={`no-pdf ${btnExportCls || ''}`}
            style={{...btnExportStyle, background: '#f59e0b'}}
            onClick={onExportWeekPDF}
            title={t('planning.exportWeekPDF')}
          >
            PDF
          </Button>
          <Button
            variant='duplicate'
            size='sm'
            className={`no-pdf ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !readOnly && duplicateWeek(scope, week.id as string)}
            disabled={readOnly}
            title={readOnly ? t('conditions.projectClosed') : t('planning.duplicateWeek')}
            type='button'
          >
            {t('planning.duplicate')}
          </Button>
          <Button
            variant='danger'
            size='sm'
            className={`no-pdf ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !readOnly && setShowConfirmDelete(true)}
            disabled={readOnly}
            title={readOnly ? t('conditions.projectClosed') : t('planning.deleteWeek')}
            type='button'
          >
            🗑️
          </Button>
        </div>
      </div>

      {open && (
        <div className='overflow-x-auto'>
          <table className='plan min-w-[760px] w-full border-collapse text-sm'>
            <thead>
              <tr>
                <Th align='left'>{t('planning.row')}</Th>
                {week.days.map((d: AnyRecord, i: number) => (
                  <Th key={i} align='center'>{getDayName(d.key || DAYS[i]?.key || '', t)}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label={t('planning.date')}>
                {DAYS.map((d, i) => (
                  <Td key={i} align='middle'>
                    <div className='text-center flex items-center justify-center h-full'>
                    {i === 0 ? (
                      <input
                        type='date'
                        value={week.startDate}
                        onChange={onChangeMonday}
                        disabled={readOnly}
                        className={`w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={readOnly ? t('conditions.projectClosed') : t('planning.changeMonday')}
                      />
                    ) : (
                      datesRow[i]
                    )}
                    </div>
                  </Td>
                ))}
              </Row>

              <Row label={t('planning.dayType')}>
                {week.days.map((day: AnyRecord, i: number) => {
                  const dropdownKey = `jornada_${week.id}_${i}`;
                  const dropdownState = getDropdownState(dropdownKey);

                  return (
                    <JornadaDropdown
                      key={i}
                      scope={scope}
                      weekId={week.id as string}
                      dayIndex={i}
                      day={day}
                      dropdownKey={dropdownKey}
                      dropdownState={dropdownState}
                      setDropdownState={setDropdownState}
                      setDayField={setDayField}
                      theme={theme}
                      focusColor={focusColor}
                      readOnly={readOnly}
                    />
                  );
                })}
              </Row>

              <Row label={t('planning.schedule')}>
                {week.days.map((day: AnyRecord, i: number) => (
                  <Td key={i} align='middle'>
                    <div className='flex gap-2 justify-center'>
                      <input
                        type='time'
                        value={day.start || ''}
                        onChange={e =>
                          !readOnly && setDayField(scope, week.id as string, i, {
                            start: e.target.value,
                          })
                        }
                        className={`flex-1 px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                        readOnly={readOnly}
                        title={readOnly ? t('conditions.projectClosed') : t('planning.start')}
                      />
                      <input
                        type='time'
                        value={day.end || ''}
                        onChange={e =>
                          !readOnly && setDayField(scope, week.id as string, i, { end: e.target.value })
                        }
                        className={`flex-1 px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                        readOnly={readOnly}
                        title={readOnly ? t('conditions.projectClosed') : t('planning.end')}
                      />
                    </div>
                  </Td>
                ))}
              </Row>

              <Row label={t('planning.cutRow')}>
                {week.days.map((day: AnyRecord, i: number) => (
                  <Td key={i} align='middle'>
                    <input
                      type='time'
                      value={day.cut || ''}
                      onChange={e =>
                        !readOnly && setDayField(scope, week.id as string, i, { cut: e.target.value })
                      }
                      className={`w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                      readOnly={readOnly}
                      title={readOnly ? t('conditions.projectClosed') : t('planning.cut')}
                    />
                  </Td>
                ))}
              </Row>

              <Row label={t('planning.location')}>
                {week.days.map((day: AnyRecord, i: number) => (
                  <Td key={i} align='middle'>
                    <input
                      type='text'
                      placeholder={
                        day.tipo === 'Descanso'
                          ? t('planning.restLocation')
                          : day.tipo === 'Fin'
                          ? t('planning.endLocation')
                          : t('planning.locationPlaceholder')
                      }
                      value={
                        day.tipo === 'Descanso' && day.loc === 'DESCANSO'
                          ? t('planning.restLocation')
                          : day.tipo === 'Fin' && day.loc === 'FIN DEL RODAJE'
                          ? t('planning.endLocation')
                          : day.loc || ''
                      }
                      onChange={e =>
                        setDayField(scope, week.id as string, i, { loc: e.target.value })
                      }
                      className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left'
                      disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                    />
                  </Td>
                ))}
              </Row>

              <Row label={t('planning.team')}>
                {week.days.map((day: AnyRecord, i: number) => {
                  const basePool = (baseTeam || []).map(m => ({
                    role: m.role,
                    name: (m.name || '').trim(),
                    source: 'base',
                  }));
                  const options = missingByPair(
                    day.team,
                    uniqueByPair([...basePool, ...poolRefs(reinforcements)])
                  );
                  return (
                    <Td key={i} align='middle'>
                      <div className='flex flex-wrap gap-2 justify-center'>
                        {(day.team || []).map((m: AnyRecord, idx: number) => (
                          <span
                            key={idx}
                            className='inline-flex items-center gap-2'
                          >
                            <Chip
                              role={m.role}
                              name={m.name}
                              source={m.source}
                            />
                            <Button
                              variant='remove'
                              size='sm'
                              className={`no-pdf ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => {
                                if (readOnly) return;
                                setMemberToRemove({
                                  scope,
                                  weekId: week.id as string,
                                  dayIndex: i,
                                  listKey: 'team',
                                  idx,
                                  memberName: m.name || 'este miembro'
                                });
                              }}
                              disabled={readOnly}
                              title={readOnly ? t('conditions.projectClosed') : t('planning.remove')}
                            >
                              ×
                            </Button>
                          </span>
                        ))}
                        <AddMemberDropdown
                          scope={scope}
                          weekId={week.id as string}
                          dayIndex={i}
                          day={day}
                          dropdownKey={`equipo_${week.id}_${i}`}
                          dropdownState={getDropdownState(`equipo_${week.id}_${i}`)}
                          setDropdownState={setDropdownState}
                          addMemberTo={addMemberTo}
                          options={options}
                          theme={theme}
                          focusColor={focusColor}
                          readOnly={readOnly}
                        />
                      </div>
                    </Td>
                  );
                })}
              </Row>

              <Row
                label={
                  <span className='inline-flex items-center gap-2'>
                    <ToggleIconButton
                      isOpen={preOpen}
                      onClick={() => setPreOpen(v => !v)}
                      disabled={readOnly}
                    />
                    {t('planning.prelight')}
                  </span>
                }
              >
                {week.days.map((day: AnyRecord, i: number) => {
                  const prePool = uniqueByPair([
                    ...prelightTeam.map(m => ({ ...m, source: 'pre' })),
                    ...baseTeam.map(m => ({ ...m, source: 'base' })),
                    ...poolRefs(reinforcements),
                  ]);
                  const options = missingByPair(day.prelight, prePool);
                  return (
                    <Td key={i} align='middle'>
                      {preOpen && (
                        <div className='flex flex-col gap-2'>
                          <div className='flex gap-2 justify-center'>
                            <input
                              type='time'
                              value={day.prelightStart || ''}
                              onChange={e =>
                                !readOnly && setDayField(scope, week.id as string, i, {
                                  prelightStart: e.target.value,
                                })
                              }
                              className={`px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                              readOnly={readOnly}
                              title={readOnly ? t('conditions.projectClosed') : t('planning.startPrelight')}
                            />
                            <input
                              type='time'
                              value={day.prelightEnd || ''}
                              onChange={e =>
                                !readOnly && setDayField(scope, week.id as string, i, {
                                  prelightEnd: e.target.value,
                                })
                              }
                              className={`px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                              readOnly={readOnly}
                              title={readOnly ? t('conditions.projectClosed') : t('planning.endPrelight')}
                            />
                          </div>
                          <div className='flex flex-wrap gap-2 justify-center'>
                            {(day.prelight || []).map((m: AnyRecord, idx: number) => (
                              <span
                                key={idx}
                                className='inline-flex items-center gap-2'
                              >
                                <Chip
                                  role={m.role}
                                  name={m.name}
                                  source={m.source}
                                />
                                <Button
                                  variant='remove'
                                  size='sm'
                                  onClick={() => {
                                    if (readOnly) return;
                                    setMemberToRemove({
                                      scope,
                                      weekId: week.id as string,
                                      dayIndex: i,
                                      listKey: 'prelight',
                                      idx,
                                      memberName: m.name || 'este miembro'
                                    });
                                  }}
                                  disabled={readOnly}
                                  title={readOnly ? t('conditions.projectClosed') : t('planning.remove')}
                                  className={readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  ×
                                </Button>
                              </span>
                            ))}
                            <AddPrelightDropdown
                              scope={scope}
                              weekId={week.id as string}
                              dayIndex={i}
                              day={day}
                              dropdownKey={`prelight_${week.id}_${i}`}
                              dropdownState={getDropdownState(`prelight_${week.id}_${i}`)}
                              setDropdownState={setDropdownState}
                              addMemberTo={addMemberTo}
                              options={options}
                              theme={theme}
                              focusColor={focusColor}
                              readOnly={readOnly}
                            />
                          </div>
                        </div>
                      )}
                    </Td>
                  );
                })}
              </Row>

              <Row
                label={
                  <span className='inline-flex items-center gap-2'>
                    <ToggleIconButton
                      isOpen={pickOpen}
                      onClick={() => setPickOpen(v => !v)}
                      disabled={readOnly}
                    />
                    {t('planning.pickup')}
                  </span>
                }
              >
                {week.days.map((day: AnyRecord, i: number) => {
                  const pickPool = uniqueByPair([
                    ...pickupTeam.map(m => ({ ...m, source: 'pick' })),
                    ...baseTeam.map(m => ({ ...m, source: 'base' })),
                    ...poolRefs(reinforcements),
                  ]);
                  const options = missingByPair(day.pickup, pickPool);
                  return (
                    <Td key={i} align='middle'>
                      {pickOpen && (
                        <div className='flex flex-col gap-2'>
                          <div className='flex gap-2 justify-center'>
                            <input
                              type='time'
                              value={day.pickupStart || ''}
                              onChange={e =>
                                !readOnly && setDayField(scope, week.id as string, i, {
                                  pickupStart: e.target.value,
                                })
                              }
                              className={`px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                              readOnly={readOnly}
                              title={readOnly ? t('conditions.projectClosed') : t('planning.startPickup')}
                            />
                            <input
                              type='time'
                              value={day.pickupEnd || ''}
                              onChange={e =>
                                !readOnly && setDayField(scope, week.id as string, i, {
                                  pickupEnd: e.target.value,
                                })
                              }
                              className={`px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                              readOnly={readOnly}
                              title={readOnly ? t('conditions.projectClosed') : t('planning.endPickup')}
                            />
                          </div>
                          <div className='flex flex-wrap gap-2 justify-center'>
                            {(day.pickup || []).map((m: AnyRecord, idx: number) => (
                              <span
                                key={idx}
                                className='inline-flex items-center gap-2'
                              >
                                <Chip
                                  role={m.role}
                                  name={m.name}
                                  source={m.source}
                                />
                                <Button
                                  variant='remove'
                                  size='sm'
                                  onClick={() => {
                                    if (readOnly) return;
                                    setMemberToRemove({
                                      scope,
                                      weekId: week.id as string,
                                      dayIndex: i,
                                      listKey: 'pickup',
                                      idx,
                                      memberName: m.name || 'este miembro'
                                    });
                                  }}
                                  disabled={readOnly}
                                  title={readOnly ? t('conditions.projectClosed') : t('planning.remove')}
                                  className={readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  ×
                                </Button>
                              </span>
                            ))}
                            <AddPickupDropdown
                              scope={scope}
                              weekId={week.id as string}
                              dayIndex={i}
                              day={day}
                              dropdownKey={`pickup_${week.id}_${i}`}
                              dropdownState={getDropdownState(`pickup_${week.id}_${i}`)}
                              setDropdownState={setDropdownState}
                              addMemberTo={addMemberTo}
                              options={options}
                              theme={theme}
                              focusColor={focusColor}
                              readOnly={readOnly}
                            />
                          </div>
                        </div>
                      )}
                    </Td>
                  );
                })}
              </Row>

              <Row label={t('planning.issues')}>
                {week.days.map((day: AnyRecord, i: number) => (
                  <Td key={i} align='middle'>
                    <input
                      type='text'
                      value={day.issue || ''}
                      onChange={e =>
                        !readOnly && setDayField(scope, week.id as string, i, {
                          issue: e.target.value,
                        })
                      }
                      className={`w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={readOnly}
                      readOnly={readOnly}
                      title={readOnly ? t('conditions.projectClosed') : t('planning.issues')}
                    />
                  </Td>
                ))}
              </Row>
            </tbody>
          </table>
        </div>
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
          }}
        />
      )}
    </div>
  );
}

export default React.memo(WeekCard);
