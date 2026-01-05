import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to sync mode state with current route
 */
export function useRouteSync(
  mode: string,
  setMode: (mode: string) => void
) {
  const location = useLocation();
  const isProjectsPath = location.pathname === '/projects';
  const isProjectPath = location.pathname.startsWith('/project/');

  useEffect(() => {
    if (isProjectsPath && mode !== 'projects') setMode('projects');
    else if (isProjectPath && mode !== 'project') setMode('project');
    else if (!isProjectsPath && !isProjectPath && mode !== 'login')
      setMode('login');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjectsPath, isProjectPath]);
}

