import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect } from 'react';

import { personaKey, personaRole, personaName } from '../utils/model';
import { parseDietas, formatDietas } from '../utils/text';

interface Persona {
  [key: string]: any;
}

interface WeekAndDay {
  day: any;
}

type ConceptValues = { [fecha: string]: string };
type ManualFlags = { [concepto: string]: { [fecha: string]: boolean } };

interface PersonaReportData {
  [concepto: string]: ConceptValues | ManualFlags | undefined;
  __manual__?: ManualFlags;
}

interface ReportData {
  [personaKey: string]: PersonaReportData;
}

interface UseReportDataReturn {
  data: ReportData;
  setData: React.Dispatch<React.SetStateAction<ReportData>>;
  setCell: (pKey: string, concepto: string, fecha: string, valor: string) => void;
}

export default function useReportData(
  storageKey: string,
  safePersonas: Persona[],
  safeSemana: string[],
  CONCEPTS: string[],
  isPersonScheduledOn: (
    fecha: string,
    role: string,
    name: string,
    findWeekAndDay: (iso: string) => WeekAndDay,
    block?: 'base' | 'pre' | 'pick' | 'extra',
    options?: { roleId?: string }
  ) => boolean,
  findWeekAndDay: (iso: string) => WeekAndDay
): UseReportDataReturn {
  const normalizeRole = (role: string) => (String(role || '').toUpperCase() === 'RIG' ? 'RE' : role);
  const normalizePersonKey = (key: string) => {
    if (!key || typeof key !== 'string') return key;
    if (key.includes('.pre__')) {
      const [rolePart, ...nameParts] = key.split('.pre__');
      const role = normalizeRole(rolePart);
      return `${role}.pre__${nameParts.join('.pre__')}`;
    }
    if (key.includes('.pick__')) {
      const [rolePart, ...nameParts] = key.split('.pick__');
      const role = normalizeRole(rolePart);
      return `${role}.pick__${nameParts.join('.pick__')}`;
    }
    if (key.includes('.extra__')) {
      const [rolePart, ...nameParts] = key.split('.extra__');
      const role = normalizeRole(rolePart);
      return `${role}.extra__${nameParts.join('.extra__')}`;
    }
    const [rolePart, ...nameParts] = key.split('__');
    const role = normalizeRole(rolePart);
    return `${role}__${nameParts.join('__')}`;
  };
  const mergePersonData = (base: PersonaReportData = {}, incoming: PersonaReportData = {}) => {
    const merged: PersonaReportData = { ...incoming, ...base };
    for (const key of Object.keys(incoming || {})) {
      if (key === '__manual__') continue;
      const incomingConcept = incoming[key] as ConceptValues;
      const baseConcept = base[key] as ConceptValues;
      if (incomingConcept && typeof incomingConcept === 'object') {
        merged[key] = { ...(incomingConcept || {}), ...(baseConcept || {}) } as any;
      }
    }
    if (incoming.__manual__ || base.__manual__) {
      merged.__manual__ = { ...(incoming.__manual__ || {}), ...(base.__manual__ || {}) };
    }
    return merged;
  };
  const migrateRiggerRoles = (prev: ReportData) => {
    const next: ReportData = {};
    let changed = false;
    for (const [key, value] of Object.entries(prev || {})) {
      if (key.startsWith('__')) {
        next[key] = value as PersonaReportData;
        continue;
      }
      const normalizedKey = normalizePersonKey(key);
      if (normalizedKey !== key) changed = true;
      const existing = next[normalizedKey] || {};
      next[normalizedKey] = mergePersonData(existing, value as PersonaReportData);
    }
    return { next, changed };
  };

  // Crear estado inicial basado en personas y conceptos
  const getInitialData = (): ReportData => {
    const base: ReportData = {};
    for (const p of safePersonas) {
      const key = personaKey(p);
      base[key] = {};
      for (const c of CONCEPTS) {
        base[key][c] = {};
        for (const f of safeSemana) base[key][c][f] = '';
      }
    }
    return base;
  };

  const [data, setData] = useLocalStorage(storageKey, getInitialData);

  useEffect(() => {
    setData((prev: ReportData) => {
      const { next, changed } = migrateRiggerRoles(prev || {});
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // asegurar estructura si cambian semana/personas
  useEffect(() => {
    setData((prev: ReportData) => {
      const current = prev || {};
      const next = { ...current };
      let changed = false;
      for (const p of safePersonas) {
        const key = personaKey(p);
        if (!next[key]) {
          next[key] = {};
          changed = true;
        }
        for (const c of CONCEPTS) {
          if (!next[key][c]) {
            next[key][c] = {};
            changed = true;
          }
          for (const f of safeSemana) {
            if (!(f in next[key][c])) {
              next[key][c][f] = '';
              changed = true;
            }
          }
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(safePersonas), JSON.stringify(safeSemana)]);

  // La persistencia se maneja automáticamente con useLocalStorage

  const setCell = (pKey: string, concepto: string, fecha: string, valor: string) => {
    const previousVal = data?.[pKey]?.[concepto]?.[fecha] || '';

    setData((d: ReportData) => {
      const next = { ...d };
      next[pKey] = { ...(next[pKey] || {}) };
      next[pKey][concepto] = { ...(next[pKey][concepto] || {}) };
      next[pKey][concepto][fecha] = valor;
      // Marcar override manual para este concepto/fecha
      next[pKey].__manual__ = { ...(next[pKey].__manual__ || {}) };
      next[pKey].__manual__[concepto] = { ...(next[pKey].__manual__?.[concepto] || {}) } as any;
      (next[pKey].__manual__ as any)[concepto][fecha] = true;
      return next;
    });

    if (concepto === 'Dietas' && valor !== '') {
      const currentParsed = parseDietas(valor);
      const previousParsed = parseDietas(previousVal);

      const currentSharedItems = new Set(currentParsed.items);
      const previousSharedItems = new Set(previousParsed.items);
      currentSharedItems.delete('Ticket');
      currentSharedItems.delete('Otros');
      previousSharedItems.delete('Ticket');
      previousSharedItems.delete('Otros');

      // Sync only for initial assignment from empty -> has items.
      // Any later edits/removals must stay local to avoid cross-row overwrites.
      const shouldSyncInitialAdd =
        previousSharedItems.size === 0 &&
        currentSharedItems.size > 0;

      if (!shouldSyncInitialAdd) return;

      const who: { [key: string]: { role: string; name: string; roleId?: string } } = {};
      for (const p of safePersonas) {
        const k = personaKey(p);
        who[k] = {
          role: personaRole(p),
          name: personaName(p),
          roleId: String((p as any)?.roleId || '').trim() || undefined,
        };
      }

      setData((prev: ReportData) => {
        const copy = { ...(prev || {}) };
        const srcBlock: 'base' | 'pre' | 'pick' | 'extra' =
          /\.pre__/.test(pKey) || /REF\.pre__/.test(pKey)
            ? 'pre'
            : (/\.pick__/.test(pKey) || /REF\.pick__/.test(pKey)
              ? 'pick'
              : (/\.extra__/.test(pKey) || /REF\.extra__/.test(pKey) ? 'extra' : 'base'));
        const blockOf = (key: string): 'base' | 'pre' | 'pick' | 'extra' =>
          /\.pre__/.test(key) || /REF\.pre__/.test(key)
            ? 'pre'
            : (/\.pick__/.test(key) || /REF\.pick__/.test(key)
              ? 'pick'
              : (/\.extra__/.test(key) || /REF\.extra__/.test(key) ? 'extra' : 'base'));

        for (const p of safePersonas) {
          const k = personaKey(p);
          if (k === pKey) continue;
          const r = who[k]?.role || '';
          const n = who[k]?.name || '';
          const roleId = who[k]?.roleId;
          const tgtBlock = blockOf(k);
          if (tgtBlock !== srcBlock) continue;

          const isRefRole = r === 'REF' || (r && r.startsWith('REF') && r.length > 3);
          const roleForCheck = isRefRole
            ? 'REF'
            : (tgtBlock === 'pre' ? `${r}P` : (tgtBlock === 'pick' ? `${r}R` : r));
          const blockForRef: 'base' | 'pre' | 'pick' | 'extra' | undefined =
            isRefRole ? tgtBlock : (tgtBlock === 'extra' ? 'extra' : undefined);
          const isScheduled = isPersonScheduledOn(fecha, roleForCheck, n, findWeekAndDay, blockForRef, { roleId });
          if (!isScheduled) continue;

          copy[k] = { ...(copy[k] || {}) };
          copy[k]['Dietas'] = { ...(copy[k]['Dietas'] || {}) };
          const existingVal = copy[k]['Dietas'][fecha] || '';
          const existingParsed = parseDietas(existingVal);

          // Add-only propagation: never remove or replace peer items.
          const syncedItems = new Set(existingParsed.items);
          for (const item of currentSharedItems) syncedItems.add(item);
          const syncedValue = formatDietas(syncedItems, existingParsed.ticket, existingParsed.other);
          copy[k]['Dietas'][fecha] = syncedValue;
        }
        return copy;
      });
    }
  };

  return { data, setData, setCell };
}
