import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROLE_COLORS } from '@shared/constants/roles';
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
  const { t } = useTranslation();
  const col = (ROLE_COLORS as any)[row.role] || (ROLE_COLORS as any).E;
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

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Obtener el label del rol seleccionado (traducido)
  const selectedRole = allowedRoles.find((r: AnyRecord) => r.code === row.role);
  const selectedLabel = selectedRole 
    ? (translateRoleLabel(selectedRole.code, t) || selectedRole.label)
    : '';

  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';
  
  // Colores uniformes basados en tema: Best Boy en claro, Eléctrico en oscuro
  const roleBgColor = theme === 'light' 
    ? 'linear-gradient(135deg,#60A5FA,#0369A1)' // Color de Best Boy (más oscuro)
    : 'linear-gradient(135deg,#FDE047,#F59E0B)'; // Color de Eléctrico
  const roleFgColor = theme === 'light' ? 'white' : '#000000'; // Blanco en claro, negro en oscuro

  return (
    <>
      <div className='rounded-xl border border-neutral-border bg-neutral-surface p-3'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-2'>
          <div className='sm:w-12 flex sm:justify-start'>
            <span
              className='inline-flex items-center justify-center h-8 min-w-10 px-3 rounded-lg font-bold'
              style={{ 
                background: roleBgColor, 
                color: roleFgColor,
                WebkitTextFillColor: roleFgColor,
                textFillColor: roleFgColor
              } as React.CSSProperties}
              title={row.role}
            >
              {displayBadge(row.role || '—', groupKey)}
            </span>
          </div>
          <div className='sm:w-[220px] w-full relative' ref={dropdownRef}>
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
              className={`w-full min-w-0 px-3 py-2 rounded-lg border focus:outline-none text-sm text-left transition-colors ${
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
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                paddingRight: '2.5rem',
              }}
            >
              {selectedLabel}
            </button>
            {isOpen && canEdit && (
              <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
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
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
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
                  {translateRoleLabel(r.code, t) || r.label}
                  </button>
              ))}
              </div>
            )}
          </div>
          <div className='flex-1 min-w-[220px]'>
            <label htmlFor={`name-${row.id}`} className='sr-only'>{t('team.nameAndSurname')}</label>
            <input
              disabled={!canEdit}
              type='text'
              value={row.name}
              onChange={e => onChange(row.id, { name: e.target.value })}
              placeholder={t('team.nameAndSurname')}
              className='w-full min-w-0 px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
              aria-label={t('team.nameAndSurname')}
              id={`name-${row.id}`}
            />
          </div>
          <div className='sm:w-10 flex sm:justify-end'>
            <button
              onClick={() => canEdit && setShowConfirmRemove(true)}
              disabled={!canEdit}
              className={`px-2 py-1 rounded-lg border text-xs border-neutral-border ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
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

