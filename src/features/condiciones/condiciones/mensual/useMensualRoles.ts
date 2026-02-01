import { useEffect, useMemo } from 'react';
import { AnyRecord } from '@shared/types/common';
import { PRICE_ROLES } from '../shared.constants';
import { computeFromMonthly } from './mensualUtils';

interface UseMensualRolesProps {
  model: AnyRecord;
  setModel: React.Dispatch<React.SetStateAction<AnyRecord>>;
}

interface UseMensualRolesReturn {
  roles: string[];
  addRole: (newRole: string) => void;
  removeRole: (sectionKey: 'base' | 'prelight' | 'pickup', role: string) => void;
  handleRoleChange: (sectionKey: 'base' | 'prelight' | 'pickup', role: string, header: string, rawVal: string) => void;
}

/**
 * Hook to manage roles in mensual conditions
 */
export function useMensualRoles({ model, setModel }: UseMensualRolesProps): UseMensualRolesReturn {
  const roles = useMemo(() => model.roles || PRICE_ROLES, [model.roles]);
  const paramsKey = useMemo(() => JSON.stringify(model.params || {}), [model.params]);
  const monthlyKey = useMemo(() => {
    const extract = (prices: AnyRecord | undefined) => {
      if (!prices) return {};
      const out: AnyRecord = {};
      Object.keys(prices).sort().forEach(role => {
        out[role] = prices[role]?.['Precio mensual'] ?? '';
      });
      return out;
    };
    return JSON.stringify({
      base: extract(model.prices),
      pre: extract(model.pricesPrelight),
      pick: extract(model.pricesPickup),
    });
  }, [model.prices, model.pricesPrelight, model.pricesPickup]);

  useEffect(() => {
    setModel((m: AnyRecord) => {
      const applyDerived = (prices: AnyRecord | undefined) => {
        if (!prices) return { next: prices, changed: false };
        let changed = false;
        const nextPrices: AnyRecord = { ...prices };
        Object.keys(nextPrices).forEach(role => {
          const row: AnyRecord = { ...(nextPrices[role] || {}) };
          const monthlyVal = row['Precio mensual'];
          if (!monthlyVal) return;
          const derived = computeFromMonthly(monthlyVal, m.params);
          const keys = [
            'Precio semanal',
            'Precio diario',
            'Precio jornada',
            'Precio Día extra/Festivo',
            'Travel day',
            'Horas extras',
          ];
          let rowChanged = false;
          for (const key of keys) {
            if (row[key] !== derived[key]) {
              row[key] = derived[key];
              rowChanged = true;
            }
          }
          if (rowChanged) {
            nextPrices[role] = row;
            changed = true;
          }
        });
        return { next: nextPrices, changed };
      };

      const baseResult = applyDerived(m.prices);
      const preResult = applyDerived(m.pricesPrelight);
      const pickResult = applyDerived(m.pricesPickup);

      if (!baseResult.changed && !preResult.changed && !pickResult.changed) {
        return m;
      }

      return {
        ...m,
        prices: baseResult.next ?? m.prices,
        pricesPrelight: preResult.next ?? m.pricesPrelight,
        pricesPickup: pickResult.next ?? m.pricesPickup,
      };
    });
  }, [paramsKey, monthlyKey, setModel]);

  const addRole = (newRole: string) => {
    if (!newRole) return;
    
    setModel((m: AnyRecord) => {
      const currentRoles = m.roles || PRICE_ROLES;
      if (currentRoles.includes(newRole)) return m;
      
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
  
  const handleRoleChange = (sectionKey: 'base' | 'prelight' | 'pickup', role: string, header: string, rawVal: string) => {
    const val = rawVal;
    setModel((m: AnyRecord) => {
      const priceKey = sectionKey === 'base' ? 'prices' : sectionKey === 'prelight' ? 'pricesPrelight' : 'pricesPickup';
      const next: AnyRecord = { ...m, [priceKey]: { ...(m[priceKey] || {}) } };
      const row: AnyRecord = { ...(next[priceKey][role] || {}) };
      row[header] = val;
      if (header === 'Material propio' && !row['Material propio tipo']) {
        row['Material propio tipo'] = 'semanal';
      }

      if (header === 'Precio mensual') {
        const derived = computeFromMonthly(val, m.params);
        row['Precio semanal'] = derived['Precio semanal'];
        row['Precio diario'] = derived['Precio diario'];
        row['Precio jornada'] = derived['Precio jornada'];
        row['Precio Día extra/Festivo'] = derived['Precio Día extra/Festivo'];
        row['Travel day'] = derived['Travel day'];
        row['Horas extras'] = derived['Horas extras'];
      }

      next[priceKey][role] = row;
      return next;
    });
  };

  return { roles, addRole, removeRole, handleRoleChange };
}

