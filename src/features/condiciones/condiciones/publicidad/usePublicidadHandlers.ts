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
  const [roleToDelete, setRoleToDelete] = useState<{ sectionKey: 'base' | 'prelight' | 'pickup'; role: string } | null>(null);

  const setPrice = (sectionKey: 'base' | 'prelight' | 'pickup', role: string, header: string, value: string) =>
    setModel((m: AnyRecord) => {
      const priceKey = sectionKey === 'base' ? 'prices' : sectionKey === 'prelight' ? 'pricesPrelight' : 'pricesPickup';
      const next: AnyRecord = { ...m, [priceKey]: { ...(m[priceKey] || {}) } };
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
      // IMPORTANTE: Usar solo los roles del modelo, no PRICE_ROLES_DIARIO como fallback
      // Esto asegura que solo los roles añadidos estén en model.roles
      const currentRoles = (m.roles && Array.isArray(m.roles) && m.roles.length > 0) 
        ? m.roles 
        : ['Gaffer', 'Eléctrico'];
      
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
        } else {
          // Si no hay precios preestablecidos, inicializar vacío
          nextPrices[newRole] = {};
        }
      }

      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };

  const removeRole = (sectionKey: 'base' | 'prelight' | 'pickup', role: string) => {
    setModel((m: AnyRecord) => {
      if (sectionKey === 'base') {
        // IMPORTANTE: Usar solo los roles del modelo, no PRICE_ROLES_DIARIO como fallback
        const roles = (m.roles && Array.isArray(m.roles) && m.roles.length > 0) 
          ? m.roles 
          : ['Gaffer', 'Eléctrico'];
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
    if (header === 'Precio jornada') {
      setModel((m: AnyRecord) => {
        const priceKey = sectionKey === 'base' ? 'prices' : sectionKey === 'prelight' ? 'pricesPrelight' : 'pricesPickup';
        const next: AnyRecord = { ...m, [priceKey]: { ...(m[priceKey] || {}) } };
        const row: AnyRecord = { ...(next[priceKey][role] || {}) };
        row['Precio jornada'] = value;

        if (value == null || String(value).trim() === '') {
          row['Precio Día extra/Festivo'] = '';
          row['Travel day'] = '';
        } else {
          const derived = computeFromDaily(value, m.params);
          row['Precio Día extra/Festivo'] = derived['Precio Día extra/Festivo'];
          row['Travel day'] = derived['Travel day'];
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

