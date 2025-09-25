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
      const next = { ...(prev || {}) };
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
