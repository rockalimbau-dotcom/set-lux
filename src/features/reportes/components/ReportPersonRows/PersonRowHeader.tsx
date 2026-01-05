import React, { useState, useEffect } from 'react';
import { Td } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import { personaKeyFrom } from './ReportPersonRowsHelpers';

interface PersonRowHeaderProps {
  person: AnyRecord;
  block: 'base' | 'pre' | 'pick' | string;
  semana: readonly string[];
  collapsed: Record<string, boolean>;
  setCollapsed: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  offMap: Map<string, boolean>;
  readOnly: boolean;
  t: (key: string) => string;
}

export function PersonRowHeader({
  person,
  block,
  semana,
  collapsed,
  setCollapsed,
  offMap,
  readOnly,
  t,
}: PersonRowHeaderProps) {
  const visualRole = person?.role || '';
  const name = person?.name || '';
  const pKey = personaKeyFrom(visualRole, name, block);

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

  return (
    <tr>
      <Td className='whitespace-nowrap align-middle' scope='row'>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => !readOnly && setCollapsed(c => ({ ...c, [pKey]: !c[pKey] }))}
            disabled={readOnly}
            className={`w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-accent ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : (collapsed[pKey] ? t('reports.expand') : t('reports.collapse'))}
            aria-expanded={!collapsed[pKey]}
            aria-controls={`person-${pKey}-rows`}
            type='button'
          >
            {collapsed[pKey] ? '+' : '−'}
          </button>

          <span className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'>
            <span
              className='inline-flex items-center justify-center w-6 h-5 rounded-md font-bold text-[10px]'
              style={{ 
                background: roleBgColor, 
                color: roleFgColor,
                WebkitTextFillColor: roleFgColor,
                textFillColor: roleFgColor
              } as React.CSSProperties}
            >
              {visualRole || '—'}
            </span>
            <span className='text-xs text-zinc-200'>{name}</span>
            {visualRole === 'REF' && block && (
              <span className='text-[10px] text-zinc-400 uppercase'>
                · {block}
              </span>
            )}
          </span>
        </div>
      </Td>

      {semana.map(iso => {
        const key = `${visualRole}_${name}_${iso}_${block}`;
        const offHeader = offMap.get(key) ?? false;
        const headerCellClasses = offHeader 
          ? 'bg-orange-900/20 border-orange-800/30' 
          : '';
        
        return (
          <Td key={`head_${pKey}_${block || 'base'}_${iso}`} className={`text-center ${headerCellClasses}`}> </Td>
        );
      })}
      <Td className='text-center'>&nbsp;</Td>
    </tr>
  );
}

