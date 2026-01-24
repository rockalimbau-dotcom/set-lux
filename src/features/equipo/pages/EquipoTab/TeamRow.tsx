import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROLE_COLORS, applyGenderToBadge } from '@shared/constants/roles';
import { AnyRecord } from '@shared/types/common';
import { displayBadge, translateRoleLabel } from './EquipoTabUtils';
import { ConfirmModal } from './ConfirmModal';

interface TeamRowProps {
  row: AnyRecord;
  onChange: (id: string, patch: AnyRecord) => void;
  onRemove: (id: string) => void;
  canEdit: boolean;
  allowedRoles: AnyRecord[];
  groupKey?: string;
}

export function TeamRow({ row, onChange, onRemove, canEdit, allowedRoles, groupKey = 'base' }: TeamRowProps) {
  const { t, i18n } = useTranslation();
  // Si el rol tiene prefijo "REF" (refuerzo), usar el color del rol base
  const roleCodeForColor = row.role?.startsWith('REF') && row.role.length > 3 
    ? row.role.substring(3) 
    : row.role;
  const col = (ROLE_COLORS as any)[roleCodeForColor] || (ROLE_COLORS as any).E;
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  
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

    return () => {
      observer.disconnect();
    };
  }, []);

  // Estado para el dropdown personalizado
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [genderHoveredOption, setGenderHoveredOption] = useState<string | null>(null);
  const [isGenderButtonHovered, setIsGenderButtonHovered] = useState(false);
  const genderDropdownRef = useRef<HTMLDivElement>(null);
  const gender = row.gender || 'neutral';
  const baseRoleForGender = row.role?.startsWith('REF') && row.role.length > 3
    ? row.role.substring(3)
    : row.role;
  const showGenderDropdown = !['G', 'AUX', 'RIG', 'RG'].includes(baseRoleForGender || '');

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setIsGenderOpen(false);
      }
    };

    if (isOpen || isGenderOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isGenderOpen]);

  // Obtener el label del rol seleccionado (traducido)
  const selectedRole = allowedRoles.find((r: AnyRecord) => r.code === row.role);
  const selectedLabel = selectedRole 
    ? (translateRoleLabel(selectedRole.code, t, groupKey, gender) || selectedRole.label)
    : '';
  const genderOptions = [
    { value: 'neutral', label: t('team.genderNeutral') },
    { value: 'male', label: t('team.genderMale') },
    { value: 'female', label: t('team.genderFemale') },
  ];
  const selectedGenderLabel = genderOptions.find(opt => opt.value === gender)?.label || t('team.genderNeutral');

  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';
  
  // Colores uniformes basados en tema: Best Boy en claro, Eléctrico en oscuro
  const roleBgColor = theme === 'light' 
    ? 'linear-gradient(135deg,#60A5FA,#0369A1)' // Color de Best Boy (más oscuro)
    : 'linear-gradient(135deg,#FDE047,#F59E0B)'; // Color de Eléctrico
  const roleFgColor = theme === 'light' ? 'white' : '#000000'; // Blanco en claro, negro en oscuro

  const badgeRaw = displayBadge(row.role || '—', groupKey, i18n.language);
  const badgeDisplay = applyGenderToBadge(badgeRaw, gender);

  return (
    <>
      <div className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl border border-neutral-border bg-neutral-surface p-1.5 sm:p-2 md:p-2.5 lg:p-3'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:gap-2 md:gap-3 gap-1.5 sm:gap-2'>
          <div className='sm:w-10 md:w-12 flex sm:justify-start'>
            <span
              className='inline-flex items-center justify-center h-6 sm:h-7 md:h-8 min-w-8 sm:min-w-9 md:min-w-10 px-1.5 sm:px-2 md:px-3 rounded sm:rounded-md md:rounded-lg font-bold text-[9px] sm:text-[10px] md:text-xs'
              style={{ 
                background: roleBgColor, 
                color: roleFgColor,
                WebkitTextFillColor: roleFgColor,
                textFillColor: roleFgColor
              } as React.CSSProperties}
              title={row.role}
            >
              {badgeDisplay}
            </span>
          </div>
          <div className='sm:w-[180px] md:w-[200px] lg:w-[220px] w-full relative' ref={dropdownRef}>
            <label htmlFor={`role-${row.id}`} className='sr-only'>{t('team.role')}</label>
            <button
              type='button'
              disabled={!canEdit}
              onClick={() => canEdit && setIsOpen(!isOpen)}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
              onBlur={() => setIsButtonHovered(false)}
              title={t('team.role')}
              aria-label={t('team.role')}
              id={`role-${row.id}`}
              className={`w-full min-w-0 px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg border focus:outline-none text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-left transition-colors ${
                theme === 'light' 
                  ? 'bg-white text-gray-900' 
                  : 'bg-black/40 text-zinc-300'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                borderWidth: isButtonHovered ? '1.5px' : '1px',
                borderStyle: 'solid',
                borderColor: isButtonHovered && theme === 'light' 
                  ? '#0476D9' 
                  : (isButtonHovered && theme === 'dark'
                    ? '#fff'
                    : 'var(--border)'),
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M5 7.5L1.25 3.75h7.5z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                paddingRight: '1.75rem',
              }}
            >
              {selectedLabel}
            </button>
            {isOpen && canEdit && (
              <div className={`absolute top-full left-0 mt-0.5 sm:mt-1 w-full border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-50 overflow-y-auto max-h-48 sm:max-h-56 md:max-h-60 ${
                theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
              }`}>
              {allowedRoles.map((r: AnyRecord) => (
                  <button
                    key={r.code}
                    type='button'
                    onClick={() => {
                      onChange(row.id, { role: r.code });
                      setIsOpen(false);
                      setHoveredOption(null);
                    }}
                    onMouseEnter={() => setHoveredOption(r.code)}
                    onMouseLeave={() => setHoveredOption(null)}
                    className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs lg:text-sm transition-colors ${
                      theme === 'light' 
                        ? 'text-gray-900' 
                        : 'text-zinc-300'
                    }`}
                    style={{
                      backgroundColor: hoveredOption === r.code 
                        ? (theme === 'light' ? '#A0D3F2' : focusColor)
                        : 'transparent',
                      color: hoveredOption === r.code 
                        ? (theme === 'light' ? '#111827' : 'white')
                        : 'inherit',
                    }}
                  >
                  {translateRoleLabel(r.code, t, groupKey, gender) || r.label}
                  </button>
              ))}
              </div>
            )}
          </div>
          {showGenderDropdown && (
          <div className='sm:w-[130px] md:w-[140px] lg:w-[150px] w-full relative' ref={genderDropdownRef}>
            <label htmlFor={`gender-${row.id}`} className='sr-only'>{t('team.gender')}</label>
            <button
              type='button'
              disabled={!canEdit}
              onClick={() => canEdit && setIsGenderOpen(!isGenderOpen)}
              onMouseEnter={() => setIsGenderButtonHovered(true)}
              onMouseLeave={() => setIsGenderButtonHovered(false)}
              onBlur={() => setIsGenderButtonHovered(false)}
              title={t('team.gender')}
              aria-label={t('team.gender')}
              id={`gender-${row.id}`}
              className={`w-full min-w-0 px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg border focus:outline-none text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-left transition-colors ${
                theme === 'light' 
                  ? 'bg-white text-gray-900' 
                  : 'bg-black/40 text-zinc-300'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                borderWidth: isGenderButtonHovered ? '1.5px' : '1px',
                borderStyle: 'solid',
                borderColor: isGenderButtonHovered && theme === 'light' 
                  ? '#0476D9' 
                  : (isGenderButtonHovered && theme === 'dark'
                    ? '#fff'
                    : 'var(--border)'),
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M5 7.5L1.25 3.75h7.5z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                paddingRight: '1.75rem',
              }}
            >
              {selectedGenderLabel}
            </button>
            {isGenderOpen && canEdit && (
              <div className={`absolute top-full left-0 mt-0.5 sm:mt-1 w-full border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-50 overflow-y-auto max-h-40 sm:max-h-48 md:max-h-52 ${
                theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
              }`}>
                {genderOptions.map(opt => (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => {
                      onChange(row.id, { gender: opt.value });
                      setIsGenderOpen(false);
                      setGenderHoveredOption(null);
                    }}
                    onMouseEnter={() => setGenderHoveredOption(opt.value)}
                    onMouseLeave={() => setGenderHoveredOption(null)}
                    className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs lg:text-sm transition-colors ${
                      theme === 'light' 
                        ? 'text-gray-900' 
                        : 'text-zinc-300'
                    }`}
                    style={{
                      backgroundColor: genderHoveredOption === opt.value 
                        ? (theme === 'light' ? '#A0D3F2' : focusColor)
                        : 'transparent',
                      color: genderHoveredOption === opt.value 
                        ? (theme === 'light' ? '#111827' : 'white')
                        : 'inherit',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}
          <div className='flex-1 min-w-0 sm:min-w-[180px] md:min-w-[200px] lg:min-w-[220px]'>
            <label htmlFor={`name-${row.id}`} className='sr-only'>{t('team.nameAndSurname')}</label>
            <input
              disabled={!canEdit}
              type='text'
              value={row.name}
              onChange={e => onChange(row.id, { name: e.target.value })}
              placeholder={t('team.nameAndSurname')}
              className='w-full min-w-0 px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs lg:text-sm'
              aria-label={t('team.nameAndSurname')}
              id={`name-${row.id}`}
            />
          </div>
          <div className='sm:w-8 md:w-10 flex sm:justify-end'>
            <button
              onClick={() => canEdit && setShowConfirmRemove(true)}
              disabled={!canEdit}
              className={`px-1.5 py-1 sm:px-2 sm:py-1 rounded sm:rounded-md md:rounded-lg border text-[10px] sm:text-xs border-neutral-border ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                ...(canEdit ? {
                  '--hover-border-color': focusColor
                } as React.CSSProperties : {})
              }}
              onMouseEnter={(e) => {
                if (canEdit) {
                  e.currentTarget.style.borderColor = focusColor;
                }
              }}
              onMouseLeave={(e) => {
                if (canEdit) {
                  e.currentTarget.style.borderColor = '';
                }
              }}
              title={!canEdit ? t('conditions.projectClosed') : t('team.removeRow')}
              aria-label={`${t('team.removeRow')} ${row.name || ''}`}
              type='button'
            >
              ×
            </button>
          </div>
        </div>
      </div>
      {showConfirmRemove && (
        <ConfirmModal
          title={t('team.confirmDeletion')}
          message={t('team.confirmDeleteMember', { name: row.name || t('team.thisMember') })}
          onClose={() => setShowConfirmRemove(false)}
          onConfirm={() => {
            onRemove(row.id);
          }}
        />
      )}
    </>
  );
}

