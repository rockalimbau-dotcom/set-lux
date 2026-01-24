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
export function useSemanalHandlers({ model: _model, setModel }: UseSemanalHandlersProps) {
  const [roleToDelete, setRoleToDelete] = useState<{ sectionKey: 'base' | 'prelight' | 'pickup'; role: string } | null>(null);

  const setPrice = (sectionKey: 'base' | 'prelight' | 'pickup', role: string, header: string, value: string) =>
    setModel((m: AnyRecord) => {
      const priceKey = sectionKey === 'base' ? 'prices' : sectionKey === 'prelight' ? 'pricesPrelight' : 'pricesPickup';
      const next = { ...m, [priceKey]: { ...(m[priceKey] || {}) } };
      next[priceKey][role] = { ...(next[priceKey][role] || {}), [header]: value };
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
      
      // IMPORTANTE: Inicializar entrada vacía en prices para el nuevo rol
      // Esto asegura que el rol aparezca inmediatamente en la tabla
      const nextPrices = { ...(m.prices || {}) };
      if (!nextPrices[newRole]) {
        nextPrices[newRole] = {};
      }
      
      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };

  const removeRole = (sectionKey: 'base' | 'prelight' | 'pickup', role: string) => {
    setModel((m: AnyRecord) => {
      if (sectionKey === 'base') {
        const roles = m.roles || PRICE_ROLES;
        const nextRoles = roles.filter((r: string) => r !== role);
        const nextPrices = { ...m.prices };
        delete nextPrices[role];
        return { ...m, roles: nextRoles, prices: nextPrices };
      } else {
        const priceKey = sectionKey === 'prelight' ? 'pricesPrelight' : 'pricesPickup';
        const next = { ...m, [priceKey]: { ...(m[priceKey] || {}) } };
        delete next[priceKey][role];
        // Si no quedan roles en esta sección, eliminar la sección
        if (Object.keys(next[priceKey]).length === 0) {
          delete next[priceKey];
        }
        return next;
      }
    });
  };

  const handlePriceChange = (sectionKey: 'base' | 'prelight' | 'pickup', role: string, header: string, value: string) => {
    if (header === 'Precio semanal') {
      setModel((m: AnyRecord) => {
        const priceKey = sectionKey === 'base' ? 'prices' : sectionKey === 'prelight' ? 'pricesPrelight' : 'pricesPickup';
        const next = { ...m, [priceKey]: { ...(m[priceKey] || {}) } };
        const row = { ...(next[priceKey][role] || {}) } as Record<string, string>;
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
        next[priceKey][role] = row;
        return next;
      });
    } else {
      setPrice(sectionKey, role, header, value);
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

