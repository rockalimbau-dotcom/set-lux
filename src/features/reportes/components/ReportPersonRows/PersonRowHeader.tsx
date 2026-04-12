import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Td } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import { personaKeyFrom } from './ReportPersonRowsHelpers';
import { getRoleBadgeCode, applyGenderToBadge } from '@shared/constants/roles';
import { findProjectRoleByLegacyCode, normalizeProjectRoleCatalog, resolveMemberProjectRole } from '@shared/utils/projectRoles';

interface PersonRowHeaderProps {
  project?: AnyRecord;
  person: AnyRecord;
  block: 'base' | 'pre' | 'pick' | string;
  stickyTop?: number;
  semana: readonly string[];
  collapsed: Record<string, boolean>;
  setCollapsed: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  offMap: Map<string, boolean>;
  readOnly: boolean;
  t: (key: string) => string;
}

export function PersonRowHeader({
  project,
  person,
  block,
  stickyTop = 0,
  semana,
  collapsed,
  setCollapsed,
  offMap,
  readOnly,
  t,
}: PersonRowHeaderProps) {
  const { i18n } = useTranslation();
  const visualRole = person?.role || '';
  const name = person?.name || '';
  const personId = person?.personId;
  const gender = person?.gender;
  const pKey = personaKeyFrom(visualRole, name, block);
  const resolvedRole = resolveMemberProjectRole(project, person);
  const defaultRole = findProjectRoleByLegacyCode(normalizeProjectRoleCatalog(project), visualRole);
  const explicitRoleLabel = String(person?.roleLabel || resolvedRole.label || '').trim();
  const normalizeLabel = (value: string) =>
    String(value || '')
      .trim()
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  const isCustomRole =
    !!resolvedRole.roleId &&
    !!defaultRole?.id &&
    resolvedRole.roleId !== defaultRole.id &&
    !!explicitRoleLabel &&
    normalizeLabel(explicitRoleLabel) !== normalizeLabel(defaultRole.label || '');
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

  // Colores uniformes basados en tema: Best Boy en claro, Eléctrico en oscuro
  const roleBgColor = theme === 'light' 
    ? 'linear-gradient(135deg,#60A5FA,#0369A1)' // Color de Best Boy (más oscuro)
    : 'linear-gradient(135deg,#FDE047,#F59E0B)'; // Color de Eléctrico
  const roleFgColor = theme === 'light' ? 'white' : '#000000'; // Blanco en claro, negro en oscuro

  // Calcular el código del badge y determinar si necesita más espacio
  const roleCodeRaw = getRoleBadgeCode(visualRole || '', i18n.language) || '';
  const roleCode = applyGenderToBadge(roleCodeRaw, gender);
  // Para refuerzos (REFG, REFGP, etc.) y roles con sufijos (GP, GR) usar ancho adaptativo
  const isLongCode = roleCode.length > 3 || roleCode.startsWith('REF') || roleCode.endsWith('P') || roleCode.endsWith('R');
  const badgeWidthClass = isLongCode
    ? 'min-w-[28px] sm:min-w-[32px] md:min-w-[36px] px-2 sm:px-2.5 md:px-3'
    : 'w-4 sm:w-5 md:w-6';

  return (
    <tr
      className='report-person-sticky-row report-sticky-row report-sticky-row--person'
      style={{ ['--report-sticky-row-top' as string]: `${stickyTop}px` }}
    >
      <Td
        className='align-middle report-sticky-first-col'
        scope='row'
      >
        <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
          <button
            onClick={() => !readOnly && setCollapsed(c => ({ ...c, [pKey]: !c[pKey] }))}
            disabled={readOnly}
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded sm:rounded-md md:rounded-lg border border-neutral-border flex items-center justify-center text-xs sm:text-sm hover:border-accent ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : (collapsed[pKey] ? t('reports.expand') : t('reports.collapse'))}
            aria-expanded={!collapsed[pKey]}
            aria-controls={`person-${pKey}-rows`}
            type='button'
          >
            {collapsed[pKey] ? '+' : '−'}
          </button>

          <span className='inline-flex max-w-full items-start gap-1 sm:gap-1.5 md:gap-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded sm:rounded-md md:rounded-lg border border-neutral-border bg-black/40'>
            <span
              className={`inline-flex items-center justify-center h-3.5 sm:h-4 md:h-5 rounded sm:rounded-md md:rounded-lg font-bold text-[8px] sm:text-[9px] md:text-[10px] ${badgeWidthClass}`}
              style={{ 
                background: roleBgColor, 
                color: roleFgColor,
                WebkitTextFillColor: roleFgColor,
                textFillColor: roleFgColor
              } as React.CSSProperties}
            >
              {roleCode || '—'}
            </span>
            <span className='min-w-0 flex-1 leading-tight'>
              <span className='block text-[9px] sm:text-[10px] md:text-xs text-zinc-200 break-words'>
                {name}
              </span>
              {isCustomRole && (
                <span className='block text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400 break-words'>
                  {explicitRoleLabel}
                </span>
              )}
            </span>
            {(visualRole === 'REF' || (visualRole && visualRole.startsWith('REF') && visualRole.length > 3)) && block && (
              <span className='text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400 uppercase'>
                · {block}
              </span>
            )}
          </span>
        </div>
      </Td>

      {semana.map(iso => {
        const key = `${person?.roleId || personId || visualRole}_${name}_${iso}_${block}`;
        const offHeader = offMap.get(key) ?? false;
        const headerCellClasses = offHeader ? 'report-off-cell' : '';
        
        return (
          <Td
            key={`head_${pKey}_${block || 'base'}_${iso}`}
            className={`text-center ${headerCellClasses}`}
          >
            {' '}
          </Td>
        );
      })}
      <Td className='text-center'>
        &nbsp;
      </Td>
    </tr>
  );
}
