import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthProvider.tsx';

// Mock useLocalStorage
vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => ['', vi.fn()]),
}));

// Test component that uses the auth context
function TestComponent() {
  const { mode, setMode, userName, setUserName } = useAuth();

  return (
    <div>
      <div data-testid='mode'>{mode}</div>
      <div data-testid='userName'>{userName || 'No user'}</div>
      <button onClick={() => setMode('projects')} data-testid='set-mode-button'>
        Set Mode
      </button>
      <button
        onClick={() => setUserName('Test User')}
        data-testid='set-user-button'
      >
        Set User
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  it('provides default auth context', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('login');
    expect(screen.getByTestId('userName')).toHaveTextContent('No user');
  });

  it('renders without crashing', () => {
    render(
      <AuthProvider>
        <div>Test content</div>
      </AuthProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});
