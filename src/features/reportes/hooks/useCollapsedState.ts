import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect } from 'react';

import { personaKey } from '../utils/model';

interface Persona {
  [key: string]: any;
}

interface CollapsedState {
  [personaKey: string]: boolean;
}

interface UseCollapsedStateReturn {
  collapsed: CollapsedState;
  setCollapsed: React.Dispatch<React.SetStateAction<CollapsedState>>;
}

export default function useCollapsedState(
  persistBase: string, 
  safePersonas: Persona[]
): UseCollapsedStateReturn {
  const normalizeKey = (key: string) => {
    if (!key || typeof key !== 'string') return key;
    if (key.includes('.pre__')) {
      const [rolePart, ...nameParts] = key.split('.pre__');
      const role = String(rolePart || '').toUpperCase() === 'RIG' ? 'RE' : rolePart;
      return `${role}.pre__${nameParts.join('.pre__')}`;
    }
    if (key.includes('.pick__')) {
      const [rolePart, ...nameParts] = key.split('.pick__');
      const role = String(rolePart || '').toUpperCase() === 'RIG' ? 'RE' : rolePart;
      return `${role}.pick__${nameParts.join('.pick__')}`;
    }
    const [rolePart, ...nameParts] = key.split('__');
    const role = String(rolePart || '').toUpperCase() === 'RIG' ? 'RE' : rolePart;
    return `${role}__${nameParts.join('__')}`;
  };
  // Crear estado inicial basado en safePersonas
  const getInitialState = (): CollapsedState => {
    const obj: CollapsedState = {};
    for (const p of safePersonas) obj[personaKey(p)] = false;
    return obj;
  };

  const [collapsed, setCollapsed] = useLocalStorage(
    `${persistBase}_collapsed`,
    getInitialState
  );

  useEffect(() => {
    setCollapsed((prev: CollapsedState) => {
      const next: CollapsedState = {};
      for (const [k, v] of Object.entries(prev || {})) {
        const nk = normalizeKey(k);
        next[nk] = v as boolean;
      }
      for (const p of safePersonas) {
        const k = personaKey(p);
        if (!(k in next)) next[k] = false;
      }
      for (const k of Object.keys(next)) {
        const still = safePersonas.some(p => personaKey(p) === k);
        if (!still) delete next[k];
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(safePersonas), persistBase]);

  return { collapsed, setCollapsed };
}
