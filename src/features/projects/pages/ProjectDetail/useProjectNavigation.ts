import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ProjectTab } from './ProjectDetailTypes';
import { Project } from './ProjectDetailTypes';

interface UseProjectNavigationProps {
  project: Project | null;
  initialTab?: string | null;
}

interface UseProjectNavigationReturn {
  activeTab: ProjectTab | null;
  setActiveTab: (tab: ProjectTab | null) => void;
  pid: string;
}

/**
 * Hook to manage project navigation and tab synchronization with URL
 */
export function useProjectNavigation({
  project,
  initialTab = null,
}: UseProjectNavigationProps): UseProjectNavigationReturn {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const pid = params.id || project?.id || project?.nombre || 'tmp';
  const isNavigatingRef = useRef(false);

  const [activeTab, setActiveTabState] = useState<ProjectTab | null>(initialTab as ProjectTab ?? null);

  // Prevenir scroll automático al cambiar de ruta
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const scrollToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      
      // Ejecutar inmediatamente
      scrollToTop();
      
      // Ejecutar después del siguiente frame para asegurar que el contenido esté renderizado
      requestAnimationFrame(() => {
        scrollToTop();
        // Una vez más después de un pequeño delay para contenido que se renderiza más tarde
        setTimeout(scrollToTop, 100);
      });
    }
  }, [location.pathname]);

  // Ruta -> pestaña (al entrar directamente por URL o al refrescar)
  useEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    
    try {
      const path = String(location.pathname || '');
      const m = path.match(/\/project\/[^/]+\/?([^/?#]+)?/);
      const seg = (m && m[1]) || '';
      const valid = new Set<ProjectTab>([
        'equipo',
        'planificacion',
        'reportes',
        'nomina',
        'necesidades',
        'condiciones',
      ]);
      if (seg && valid.has(seg as ProjectTab)) {
        if (activeTab !== seg) setActiveTabState(seg as ProjectTab);
      } else if (!seg && activeTab !== null) {
        setActiveTabState(null);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Pestaña -> ruta (sin cambiar UI)
  useEffect(() => {
    const base = `/project/${pid}`;
    const want = activeTab ? `${base}/${activeTab}` : base;
    if (location.pathname !== want) {
      isNavigatingRef.current = true;
      navigate(want, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pid]);

  const setActiveTab = (tab: ProjectTab | null) => {
    isNavigatingRef.current = true;
    setActiveTabState(tab);
  };

  return { activeTab, setActiveTab, pid, isNavigatingRef };
}

