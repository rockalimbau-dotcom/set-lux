import React from 'react';
import ChipBase from '@shared/components/Chip';
import { ROLE_COLORS } from '@shared/constants/roles';
import { AnyRecord } from '@shared/types/common';
import { MemberChipProps } from './WeekCardTableTypes';

export function MemberChip({ role, name, source }: MemberChipProps) {
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
  return <ChipBase label={label} colorBg={col.bg} colorFg={col.fg} text={name} />;
}

