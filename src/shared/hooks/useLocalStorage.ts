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

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<T | null>(null);
  
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
