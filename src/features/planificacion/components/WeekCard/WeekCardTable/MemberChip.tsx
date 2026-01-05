import React, { useState, useEffect } from 'react';
import ChipBase from '@shared/components/Chip';
import { AnyRecord } from '@shared/types/common';
import { MemberChipProps } from './WeekCardTableTypes';

export function MemberChip({ role, name, source }: MemberChipProps) {
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
  return <ChipBase label={label} colorBg={roleBgColor} colorFg={roleFgColor} text={name} />;
}

