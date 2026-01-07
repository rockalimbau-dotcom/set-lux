import { storage } from '@shared/services/localStorage.service';

/**
 * Carga un valor JSON del localStorage con fallback
 */
export const loadJSON = (k: string, fallback: any) => {
  try {
    const obj = storage.getJSON<any>(k);
    return obj ?? fallback;
  } catch {
    return fallback;
  }
};

/**
 * Guarda un valor JSON en el localStorage
 */
const saveJSON = (k: string, v: any) => {
  try {
    storage.setJSON(k, v);
  } catch {}
};

