import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ChipBase from '@shared/components/Chip';
import { AnyRecord } from '@shared/types/common';
import { getRoleBadgeCode } from '@shared/constants/roles';
import { MemberChipProps } from './WeekCardTableTypes';

export function MemberChip({ role, name, source }: MemberChipProps) {
  const { i18n } = useTranslation();
  
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

  let label: string = getRoleBadgeCode(role || '', i18n.language);
  // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), no añadir sufijo P/R
  const isRefRole = role === 'REF' || (role && role.startsWith('REF') && role.length > 3);
  if (!isRefRole) {
    if (source === 'pre') label = `${label}P`;
    if (source === 'pick') label = `${label}R`;
  }
  return <ChipBase label={label} colorBg={roleBgColor} colorFg={roleFgColor} text={name} />;
}

