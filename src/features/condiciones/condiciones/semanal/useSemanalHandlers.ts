import { useState } from 'react';
import { AnyRecord } from '@shared/types/common';
import { PRICE_ROLES } from '../shared.constants';
import { computeFromWeekly } from './semanalUtils';

interface UseSemanalHandlersProps {
  model: AnyRecord;
  setModel: (updater: (m: AnyRecord) => AnyRecord) => void;
}

/**
 * Hook to manage semanal handlers (prices, roles, etc.)
 */
export function useSemanalHandlers({ model, setModel }: UseSemanalHandlersProps) {
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  const setPrice = (role: string, header: string, value: string) =>
    setModel((m: AnyRecord) => {
      const next = { ...m, prices: { ...(m.prices || {}) } };
      next.prices[role] = { ...(next.prices[role] || {}), [header]: value };
      return next;
    });

  const setText = (key: string, value: string) => 
    setModel((m: AnyRecord) => ({ ...m, [key]: value }));

  const setParam = (key: string, value: string) =>
    setModel((m: AnyRecord) => ({
      ...m,
      params: { ...(m.params || {}), [key]: value },
    }));

  const addRole = (newRole: string) => {
    if (!newRole) return;
    
    setModel((m: AnyRecord) => {
      const currentRoles = m.roles || PRICE_ROLES;
      if (currentRoles.includes(newRole)) return m;
      
      // Maintain PRICE_ROLES order
      const nextRoles: string[] = [];
      const currentSet = new Set(currentRoles);
      
      for (const role of PRICE_ROLES) {
        if (role === newRole) {
          nextRoles.push(newRole);
        } else if (currentSet.has(role)) {
          nextRoles.push(role);
        }
      }
      
      if (!PRICE_ROLES.includes(newRole)) {
        nextRoles.push(newRole);
      }
      
      return { ...m, roles: nextRoles };
    });
  };

  const removeRole = (role: string) => {
    setModel((m: AnyRecord) => {
      const roles = m.roles || PRICE_ROLES;
      const nextRoles = roles.filter((r: string) => r !== role);
      const nextPrices = { ...m.prices };
      delete nextPrices[role];
      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };

  const handlePriceChange = (role: string, header: string, value: string) => {
    if (header === 'Precio semanal') {
      setModel((m: AnyRecord) => {
        const next = { ...m, prices: { ...(m.prices || {}) } };
        const row = { ...(next.prices[role] || {}) } as Record<string, string>;
        row['Precio semanal'] = value;
        if (value == null || String(value).trim() === '') {
          row['Precio mensual'] = '';
          row['Precio diario'] = '';
          row['Precio jornada'] = '';
          row['Precio Día extra/Festivo'] = '';
          row['Travel day'] = '';
          row['Horas extras'] = '';
        } else {
          const derived = computeFromWeekly(value, m.params);
          row['Precio mensual'] = derived['Precio mensual'];
          row['Precio diario'] = derived['Precio diario'];
          row['Precio jornada'] = derived['Precio jornada'];
          row['Precio Día extra/Festivo'] = derived['Precio Día extra/Festivo'];
          row['Travel day'] = derived['Travel day'];
          row['Horas extras'] = derived['Horas extras'];
        }
        next.prices[role] = row;
        return next;
      });
    } else {
      setPrice(role, header, value);
    }
  };

  return {
    setPrice,
    setText,
    setParam,
    addRole,
    removeRole,
    handlePriceChange,
    roleToDelete,
    setRoleToDelete,
  };
}

