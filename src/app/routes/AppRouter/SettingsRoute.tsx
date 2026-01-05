import React from 'react';
import { ErrorBoundary } from '../../../shared/components';

const SettingsPage = React.lazy(() => import('../../../features/projects/pages/SettingsPage'));

/**
 * Settings page route component
 */
export function SettingsRoute() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={null}>
        <SettingsPage />
      </React.Suspense>
    </ErrorBoundary>
  );
}

