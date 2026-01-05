import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to prevent automatic scroll when changing routes
 */
export function useScrollReset() {
  const location = useLocation();

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Only scroll if we're not already at the top
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);
}

