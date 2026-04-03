// src/shared/hooks/useLocalStorage.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { storage, STORAGE_CHANGE_EVENT } from '../services/localStorage.service';

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
  const initialValueRef = useRef(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<T | null>(null);
  const [value, setValue] = useState<T>(() => {
    const raw = storage.getString(keyRef.current);
    if (raw != null) return safeParse<T>(raw, initialValue as T);
    return typeof initialValue === 'function' ? (initialValue as () => T)() : (initialValue as T);
  });

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  // keep in sync across tabs and when key changes
  useEffect(() => {
    const previousKey = keyRef.current;
    if (previousKey === key) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingValueRef.current !== null) {
      storage.setString(previousKey, safeStringify(pendingValueRef.current));
      pendingValueRef.current = null;
    }

    keyRef.current = key;
    const fallback =
      typeof initialValueRef.current === 'function'
        ? (initialValueRef.current as () => T)()
        : (initialValueRef.current as T);
    const raw = storage.getString(key);
    setValue(raw != null ? safeParse<T>(raw, fallback) : fallback);
  }, [key]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) return;
      if (e.key !== keyRef.current) return;
      setValue(prev => {
        if (safeStringify(prev) === (e.newValue ?? 'null')) return prev;
        return safeParse(e.newValue, prev);
      });
    };
    const onLocalStorageChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string; newValue?: string | null }>).detail;
      if (!detail || detail.key !== keyRef.current) return;
      setValue(prev => {
        if (safeStringify(prev) === (detail.newValue ?? 'null')) return prev;
        return safeParse(detail.newValue ?? null, prev);
      });
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(STORAGE_CHANGE_EVENT, onLocalStorageChange as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STORAGE_CHANGE_EVENT, onLocalStorageChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const flushPending = () => {
      if (pendingValueRef.current !== null) {
        storage.setString(keyRef.current, safeStringify(pendingValueRef.current));
        pendingValueRef.current = null;
      }
    };
    window.addEventListener('beforeunload', flushPending);
    window.addEventListener('pagehide', flushPending);
    return () => {
      flushPending();
      window.removeEventListener('beforeunload', flushPending);
      window.removeEventListener('pagehide', flushPending);
    };
  }, []);
  
  const set = useCallback((updater: SetValue<T>) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? (updater as (prevValue: T) => T)(prev) : updater;
      if (Object.is(next, prev)) {
        return prev;
      }
      
      // Guardar el valor pendiente
      pendingValueRef.current = next;
      
      // Debug removed to improve performance
      
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Calcular el tiempo de debounce basado en el tamaño de los datos
      const str = safeStringify(next);
      const debounceTime = str.length > 10000 ? 500 : str.length > 1000 ? 300 : 100;
      if (str === storage.getString(keyRef.current)) {
        pendingValueRef.current = null;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return next;
      }
      
      // Usar debounce para evitar escrituras excesivas
      timeoutRef.current = setTimeout(() => {
        if (pendingValueRef.current !== null) {
          storage.setString(keyRef.current, safeStringify(pendingValueRef.current));
          pendingValueRef.current = null;
        }
        timeoutRef.current = null;
      }, debounceTime);
      
      return next;
    });
  }, []);

  const remove = useCallback(() => {
    storage.remove(keyRef.current);
  }, []);

  return [value, set, remove];
}
