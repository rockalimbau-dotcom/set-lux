type JsonValue = unknown;

export const STORAGE_CHANGE_EVENT = 'setlux:storage-change';

type StorageChangeDetail = {
  key: string;
  newValue: string | null;
  oldValue: string | null;
};

const isStorageDebugEnabled = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('debug-storage') === '1';
  } catch {
    return false;
  }
};

const dispatchStorageChange = (detail: StorageChangeDetail): void => {
  try {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent<StorageChangeDetail>(STORAGE_CHANGE_EVENT, { detail }));
  } catch {
    // ignore
  }
};

export const storage = {
  has: (key: string): boolean => {
    try {
      const v = window.localStorage.getItem(key);
      return v != null;
    } catch {
      return false;
    }
  },

  getString: (key: string): string | null => {
    try {
      const v = window.localStorage.getItem(key);
      return v ?? null;
    } catch {
      return null;
    }
  },

  setString: (key: string, value: string): void => {
    try {
      const oldValue = window.localStorage.getItem(key);
      if (isStorageDebugEnabled() && value.length < 200) {
        console.log('[STORAGE.DEBUG] setString called:', key, value);
      } else if (isStorageDebugEnabled()) {
        console.log('[STORAGE.DEBUG] setString called:', key, 'size:', value.length, 'chars');
      }
      window.localStorage.setItem(key, value);
      dispatchStorageChange({ key, newValue: value, oldValue });
      if (isStorageDebugEnabled() && value.length < 200) {
        console.log('[STORAGE.DEBUG] setString success');
      }
    } catch (e) {
      if (isStorageDebugEnabled()) {
        console.error('[STORAGE.DEBUG] setString error:', e);
      }
    }
  },

  remove: (key: string): void => {
    try {
      const oldValue = window.localStorage.getItem(key);
      window.localStorage.removeItem(key);
      dispatchStorageChange({ key, newValue: null, oldValue });
    } catch {
      // ignore
    }
  },

  getJSON: <T = JsonValue>(key: string): T | null => {
    const raw = storage.getString(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setJSON: (key: string, value: JsonValue): void => {
    try {
      const raw = JSON.stringify(value);
      storage.setString(key, raw);
    } catch {
      // ignore
    }
  },
};

