import React from 'react';
import { ErrorBoundary } from '../../../shared/components';

const ProfilePage = React.lazy(() => import('../../../features/projects/pages/ProfilePage'));

/**
 * Profile page route component
 */
export function ProfileRoute() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={null}>
        <ProfilePage />
      </React.Suspense>
    </ErrorBoundary>
  );
}

