import { storage } from '@shared/services/localStorage.service';

/**
 * Persist default prices to storage
 */
export function persistDefaultPrices(project: any, priceRows: any) {
  try {
    const baseKey = project?.id || project?.nombre || 'tmp';
    const condKey = `cond_${baseKey}_publicidad`;
    const current = storage.getJSON<any>(condKey) || {};
    storage.setJSON(condKey, {
      ...current,
      prices: {
        ...(current?.prices || {}),
        ...priceRows,
      },
    });
  } catch {}
}

/**
 * Persist default parameters to storage
 */
export function persistDefaultParams(project: any, params: any) {
  try {
    const baseKey = project?.id || project?.nombre || 'tmp';
    const condKey = `cond_${baseKey}_publicidad`;
    const current = storage.getJSON<any>(condKey) || {};
    storage.setJSON(condKey, {
      ...current,
      params: {
        ...(current?.params || {}),
        ...params,
      },
    });
  } catch {}
}

