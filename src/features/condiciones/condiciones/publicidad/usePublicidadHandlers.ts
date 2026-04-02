import { useState } from 'react';
import { AnyRecord } from '@shared/types/common';
import { PRICE_ROLES_DIARIO } from './publicidadConstants';
import { computeFromDaily } from './publicidadUtils';
import { loadOrSeedDiario } from './publicidadData';
import { normalizeConditionRoleKey, sortConditionRoleKeys } from '../roleCatalog';

interface UseDiarioHandlersProps {
  project?: AnyRecord | null;
  model: AnyRecord;
  setModel: (updater: (m: AnyRecord) => AnyRecord) => void;
}

/**
 * Hook to manage diario handlers (prices, roles, etc.)
 */
export function useDiarioHandlers({ project, model: _model, setModel }: UseDiarioHandlersProps) {
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
      const normalizedRole = normalizeConditionRoleKey(project, newRole);
      const currentRoles = (m.roles && Array.isArray(m.roles) && m.roles.length > 0) 
        ? m.roles 
        : ['Gaffer', 'Eléctrico'];
      
      const normalizedRoles = currentRoles.map((role: string) => normalizeConditionRoleKey(project, role));
      if (normalizedRoles.includes(normalizedRole)) return m;
      const nextRoles = sortConditionRoleKeys(project, [...normalizedRoles, normalizedRole], PRICE_ROLES_DIARIO);

      const nextPrices = { ...(m.prices || {}) };
      if (!nextPrices[normalizedRole]) {
        // Load default seed to get initial prices
        const seed = loadOrSeedDiario('__seed__');
        if (seed?.prices?.[newRole]) {
          nextPrices[normalizedRole] = { ...seed.prices[newRole] };
        } else {
          nextPrices[normalizedRole] = {};
        }
      }

      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };

  const removeRole = (sectionKey: 'base' | 'prelight' | 'pickup', role: string) => {
    setModel((m: AnyRecord) => {
      if (sectionKey === 'base') {
        const roles = (m.roles && Array.isArray(m.roles) && m.roles.length > 0) 
          ? m.roles 
          : ['Gaffer', 'Eléctrico'];
        const normalizedRole = normalizeConditionRoleKey(project, role);
        const nextRoles = roles
          .map((r: string) => normalizeConditionRoleKey(project, r))
          .filter((r: string) => r !== normalizedRole);
        const nextPrices = { ...m.prices };
        delete nextPrices[normalizedRole];
        return { ...m, roles: nextRoles, prices: nextPrices };
      } else {
        const priceKey = sectionKey === 'prelight' ? 'pricesPrelight' : 'pricesPickup';
        const next = { ...m, [priceKey]: { ...(m[priceKey] || {}) } };
        delete next[priceKey][normalizeConditionRoleKey(project, role)];
        // Si no quedan roles en esta sección, eliminar la sección
        if (Object.keys(next[priceKey]).length === 0) {
          delete next[priceKey];
        }
        return next;
      }
    });
  };

  const handlePriceChange = (sectionKey: 'base' | 'prelight' | 'pickup', role: string, header: string, value: string) => {
    if (header === 'Material propio') {
      setModel((m: AnyRecord) => {
        const priceKey = sectionKey === 'base' ? 'prices' : sectionKey === 'prelight' ? 'pricesPrelight' : 'pricesPickup';
        const next: AnyRecord = { ...m, [priceKey]: { ...(m[priceKey] || {}) } };
        const row: AnyRecord = { ...(next[priceKey][role] || {}) };
        row['Material propio'] = value;
        if (!row['Material propio tipo']) {
          row['Material propio tipo'] = 'diario';
        }
        next[priceKey][role] = row;
        return next;
      });
      return;
    }
    if (header === 'Precio jornada') {
      setModel((m: AnyRecord) => {
        const priceKey = sectionKey === 'base' ? 'prices' : sectionKey === 'prelight' ? 'pricesPrelight' : 'pricesPickup';
        const next: AnyRecord = { ...m, [priceKey]: { ...(m[priceKey] || {}) } };
        const row: AnyRecord = { ...(next[priceKey][role] || {}) };
        row['Precio jornada'] = value;

        if (value == null || String(value).trim() === '') {
          row['Precio 1/2 jornada'] = '';
          row['Precio Día extra/Festivo'] = '';
          row['Travel day'] = '';
        } else {
          const derived = computeFromDaily(value, m.params);
          row['Precio 1/2 jornada'] = derived['Precio 1/2 jornada'];
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
