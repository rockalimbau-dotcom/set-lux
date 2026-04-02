import { useState } from 'react';
import { AnyRecord } from '@shared/types/common';
import { PRICE_ROLES } from '../shared.constants';
import { computeFromWeekly } from './semanalUtils';
import { normalizeConditionRoleKey, sortConditionRoleKeys } from '../roleCatalog';

interface UseSemanalHandlersProps {
  project?: AnyRecord | null;
  model: AnyRecord;
  setModel: (updater: (m: AnyRecord) => AnyRecord) => void;
}

/**
 * Hook to manage semanal handlers (prices, roles, etc.)
 */
export function useSemanalHandlers({ project, model: _model, setModel }: UseSemanalHandlersProps) {
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
      const normalizedRole = normalizeConditionRoleKey(project, newRole);
      const currentRoles = Array.isArray(m.roles) && m.roles.length > 0 ? m.roles : PRICE_ROLES;
      const normalizedRoles = currentRoles.map((role: string) => normalizeConditionRoleKey(project, role));
      if (normalizedRoles.includes(normalizedRole)) return m;
      const nextRoles = sortConditionRoleKeys(project, [...normalizedRoles, normalizedRole], PRICE_ROLES);
      
      const nextPrices = { ...(m.prices || {}) };
      if (!nextPrices[normalizedRole]) {
        nextPrices[normalizedRole] = {};
      }
      
      return { ...m, roles: nextRoles, prices: nextPrices };
    });
  };

  const removeRole = (sectionKey: 'base' | 'prelight' | 'pickup', role: string) => {
    setModel((m: AnyRecord) => {
      if (sectionKey === 'base') {
        const roles = m.roles || PRICE_ROLES;
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
        const next = { ...m, [priceKey]: { ...(m[priceKey] || {}) } };
        const row = { ...(next[priceKey][role] || {}) } as Record<string, string>;
        row['Material propio'] = value;
        if (!row['Material propio tipo']) {
          row['Material propio tipo'] = 'semanal';
        }
        next[priceKey][role] = row;
        return next;
      });
      return;
    }
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
          row['Precio 1/2 jornada'] = '';
          row['Precio Día extra/Festivo'] = '';
          row['Travel day'] = '';
          row['Horas extras'] = '';
        } else {
          const derived = computeFromWeekly(value, m.params);
          row['Precio mensual'] = derived['Precio mensual'];
          row['Precio diario'] = derived['Precio diario'];
          row['Precio jornada'] = derived['Precio jornada'];
          row['Precio 1/2 jornada'] = derived['Precio 1/2 jornada'];
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
