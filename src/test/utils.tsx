import { render, RenderOptions } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Types for mock data
export interface MockProject {
  id: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
  team: {
    base: any[];
    reinforcements: any[];
    prelight: any[];
    pickup: any[];
    enabledGroups: {
      prelight: boolean;
      pickup: boolean;
    };
  };
  conditions?: {
    tipo: 'semanal' | 'mensual' | 'publicidad';
  };
}

export interface MockUser {
  nombreCompleto: string;
  roleCode: string;
}

export interface AuthValue {
  mode?: string;
  setMode?: () => void;
  userName?: string;
  setUserName?: () => void;
  [key: string]: any;
}

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: AuthValue;
  routerOptions?: any;
}

// Mock AuthProvider for testing
const MockAuthProvider = ({ children, value = {} }: { children: React.ReactNode; value?: AuthValue }) => {
  const defaultValue: AuthValue = {
    mode: 'login',
    setMode: vi.fn(),
    userName: 'Test User',
    setUserName: vi.fn(),
    ...value,
  };

  return <div data-testid='auth-provider'>{children}</div>;
};

// Custom render function that includes providers
const customRender = (ui: React.ReactElement, options: CustomRenderOptions = {}) => {
  const { authValue = {}, routerOptions = {}, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} {...routerOptions}>
      <MockAuthProvider value={authValue}>{children}</MockAuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { customRender };

// Mock data for testing
export const mockProject: MockProject = {
  id: 'test-project-1',
  nombre: 'Proyecto de Prueba',
  estado: 'activo',
  team: {
    base: [],
    reinforcements: [],
    prelight: [],
    pickup: [],
    enabledGroups: { prelight: false, pickup: false },
  },
  conditions: {
    tipo: 'semanal',
  },
};

export const mockUser: MockUser = {
  nombreCompleto: 'Usuario de Prueba',
  roleCode: 'admin',
};

export const mockProjects: MockProject[] = [
  mockProject,
  {
    id: 'test-project-2',
    nombre: 'Otro Proyecto',
    estado: 'inactivo',
    team: {
      base: [],
      reinforcements: [],
      prelight: [],
      pickup: [],
      enabledGroups: { prelight: false, pickup: false },
    },
  },
];
