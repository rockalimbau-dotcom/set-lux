// src/shared/hooks/useLocalStorage.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '../services/localStorage.service';

function safeParse<T>(jsonString: string | null, fallback: T): T {
  try {
    if (jsonString == null) return fallback;
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return 'null';
  }
}

type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: SetValue<T>) => void, () => void] {
  const keyRef = useRef(key);
  const [value, setValue] = useState<T>(() => {
    const raw = storage.getString(keyRef.current);
    if (raw != null) return safeParse<T>(raw, initialValue as T);
    return typeof initialValue === 'function' ? (initialValue as () => T)() : (initialValue as T);
  });

  // keep in sync across tabs and when key changes
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) return;
      if (e.key !== keyRef.current) return;
      setValue(prev => safeParse(e.newValue, prev));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const set = useCallback((updater: SetValue<T>) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? (updater as (prevValue: T) => T)(prev) : updater;
      console.log('[LOCALSTORAGE.DEBUG] Setting key:', keyRef.current, 'value:', next);
      storage.setString(keyRef.current, safeStringify(next));
      return next;
    });
  }, []);

  const remove = useCallback(() => {
    storage.remove(keyRef.current);
  }, []);

  return [value, set, remove];
}
