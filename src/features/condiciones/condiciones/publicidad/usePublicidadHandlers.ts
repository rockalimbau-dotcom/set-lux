import { useState } from 'react';
import { AnyRecord } from '@shared/types/common';
import { PRICE_ROLES_DIARIO } from './publicidadConstants';
import { computeFromDaily } from './publicidadUtils';
import { loadOrSeedDiario } from './publicidadData';

interface UseDiarioHandlersProps {
  model: AnyRecord;
  setModel: (updater: (m: AnyRecord) => AnyRecord) => void;
}

/**
 * Hook to manage diario handlers (prices, roles, etc.)
 */
export function useDiarioHandlers({ model, setModel }: UseDiarioHandlersProps) {
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  const setPrice = (role: string, header: string, value: string) =>
    setModel((m: AnyRecord) => {
      const next: AnyRecord = { ...m, prices: { ...(m.prices || {}) } };
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
      const currentRoles = m.roles || PRICE_ROLES_DIARIO;
      if (currentRoles.includes(newRole)) return m;
      
      // Maintain PRICE_ROLES_DIARIO order
      const nextRoles: string[] = [];
      const currentSet = new Set(currentRoles);
      
      for (const role of PRICE_ROLES_DIARIO) {
        if (role === newRole) {
          nextRoles.push(newRole);
        } else if (currentSet.has(role)) {
          nextRoles.push(role);
        }
      }
      
      if (!PRICE_ROLES_DIARIO.includes(newRole)) {
        nextRoles.push(newRole);
      }
      
      // Auto-complete preset prices for added role if they don't exist
      const nextPrices = { ...(m.prices || {}) };
      if (!nextPrices[newRole]) {
        // Load default seed to get initial prices
        const seed = loadOrSeedDiario('__seed__');
        if (seed?.prices?.[newRole]) {
          nextPrices[newRole] = { ...seed.prices[newRole] };
        }
      }

      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };

  const removeRole = (role: string) => {
    setModel((m: AnyRecord) => {
      const roles = m.roles || PRICE_ROLES_DIARIO;
      const nextRoles = roles.filter((r: string) => r !== role);
      const nextPrices = { ...m.prices };
      delete nextPrices[role];
      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };

  const handlePriceChange = (role: string, header: string, value: string) => {
    if (header === 'Precio jornada') {
      setModel((m: AnyRecord) => {
        const next: AnyRecord = { ...m, prices: { ...(m.prices || {}) } };
        const row: AnyRecord = { ...(next.prices[role] || {}) };
        row['Precio jornada'] = value;

        if (value == null || String(value).trim() === '') {
          row['Precio Día extra/Festivo'] = '';
          row['Travel day'] = '';
        } else {
          const derived = computeFromDaily(value, m.params);
          row['Precio Día extra/Festivo'] = derived['Precio Día extra/Festivo'];
          row['Travel day'] = derived['Travel day'];
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

