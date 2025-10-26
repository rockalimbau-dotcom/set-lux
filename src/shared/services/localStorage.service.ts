type JsonValue = unknown;

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
      console.log('[STORAGE.DEBUG] setString called:', key, value);
      window.localStorage.setItem(key, value);
      console.log('[STORAGE.DEBUG] setString success');
    } catch (e) {
      console.error('[STORAGE.DEBUG] setString error:', e);
    }
  },

  remove: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
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

export default storage;


