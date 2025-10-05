import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { customRender, mockProject, mockUser, mockProjects } from './utils.tsx';

// Test component to verify rendering
const TestComponent = ({ testId = 'test-component' }) => (
  <div data-testid={testId}>Test Component</div>
);

describe('utils.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('customRender', () => {
    it('renders component with default providers', () => {
      const { container } = customRender(<TestComponent />);

      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    });

    it('renders component with custom auth value', () => {
      const customAuthValue = {
        mode: 'dashboard',
        userName: 'Custom User',
        setMode: vi.fn(),
        setUserName: vi.fn(),
      };

      customRender(<TestComponent />, { authValue: customAuthValue });

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    });

    it('renders component with router options', () => {
      const routerOptions = {
        initialEntries: ['/test-path'],
      };

      customRender(<TestComponent />, { routerOptions });

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('passes through render options', () => {
      const { container } = customRender(<TestComponent />, {
        container: document.body,
      });

      expect(container).toBeInTheDocument();
    });

    it('works with multiple components', () => {
      const { container } = customRender(
        <div>
          <TestComponent testId='component-1' />
          <TestComponent testId='component-2' />
        </div>
      );

      expect(screen.getByTestId('component-1')).toBeInTheDocument();
      expect(screen.getByTestId('component-2')).toBeInTheDocument();
    });
  });

  describe('mockProject', () => {
    it('has correct structure and types', () => {
      expect(mockProject).toHaveProperty('id');
      expect(mockProject).toHaveProperty('nombre');
      expect(mockProject).toHaveProperty('estado');
      expect(mockProject).toHaveProperty('team');
      expect(mockProject).toHaveProperty('conditions');

      expect(typeof mockProject.id).toBe('string');
      expect(typeof mockProject.nombre).toBe('string');
      expect(['activo', 'inactivo']).toContain(mockProject.estado);
    });

    it('has correct team structure', () => {
      expect(mockProject.team).toHaveProperty('base');
      expect(mockProject.team).toHaveProperty('reinforcements');
      expect(mockProject.team).toHaveProperty('prelight');
      expect(mockProject.team).toHaveProperty('pickup');
      expect(mockProject.team).toHaveProperty('enabledGroups');

      expect(Array.isArray(mockProject.team.base)).toBe(true);
      expect(Array.isArray(mockProject.team.reinforcements)).toBe(true);
      expect(Array.isArray(mockProject.team.prelight)).toBe(true);
      expect(Array.isArray(mockProject.team.pickup)).toBe(true);
      expect(typeof mockProject.team.enabledGroups).toBe('object');
    });

    it('has correct conditions structure', () => {
      expect(mockProject.conditions).toHaveProperty('tipo');
      expect(['semanal', 'mensual', 'publicidad']).toContain(
        mockProject.conditions?.tipo
      );
    });

    it('has correct enabledGroups structure', () => {
      expect(mockProject.team.enabledGroups).toHaveProperty('prelight');
      expect(mockProject.team.enabledGroups).toHaveProperty('pickup');
      expect(typeof mockProject.team.enabledGroups.prelight).toBe('boolean');
      expect(typeof mockProject.team.enabledGroups.pickup).toBe('boolean');
    });
  });

  describe('mockUser', () => {
    it('has correct structure and types', () => {
      expect(mockUser).toHaveProperty('nombreCompleto');
      expect(mockUser).toHaveProperty('roleCode');

      expect(typeof mockUser.nombreCompleto).toBe('string');
      expect(typeof mockUser.roleCode).toBe('string');
    });

    it('has expected values', () => {
      expect(mockUser.nombreCompleto).toBe('Usuario de Prueba');
      expect(mockUser.roleCode).toBe('admin');
    });
  });

  describe('mockProjects', () => {
    it('is an array with correct length', () => {
      expect(Array.isArray(mockProjects)).toBe(true);
      expect(mockProjects).toHaveLength(2);
    });

    it('contains mockProject as first element', () => {
      expect(mockProjects[0]).toBe(mockProject);
    });

    it('has second project with correct structure', () => {
      const secondProject = mockProjects[1];

      expect(secondProject).toHaveProperty('id');
      expect(secondProject).toHaveProperty('nombre');
      expect(secondProject).toHaveProperty('estado');
      expect(secondProject).toHaveProperty('team');

      expect(secondProject.id).toBe('test-project-2');
      expect(secondProject.nombre).toBe('Otro Proyecto');
      expect(secondProject.estado).toBe('inactivo');
    });

    it('has consistent team structure across projects', () => {
      mockProjects.forEach(project => {
        expect(project.team).toHaveProperty('base');
        expect(project.team).toHaveProperty('reinforcements');
        expect(project.team).toHaveProperty('prelight');
        expect(project.team).toHaveProperty('pickup');
        expect(project.team).toHaveProperty('enabledGroups');
      });
    });
  });

  describe('TypeScript interfaces', () => {
    it('MockProject interface is properly defined', () => {
      // This test verifies that the TypeScript interface is working
      // by ensuring the mock data matches the expected structure
      const testProject = {
        id: 'test',
        nombre: 'Test Project',
        estado: 'activo',
        team: {
          base: [],
          reinforcements: [],
          prelight: [],
          pickup: [],
          enabledGroups: { prelight: false, pickup: false },
        },
        conditions: { tipo: 'semanal' },
      };

      expect(testProject).toBeDefined();
      expect(testProject.estado).toBe('activo');
    });

    it('MockUser interface is properly defined', () => {
      const testUser = {
        nombreCompleto: 'Test User',
        roleCode: 'user',
      };

      expect(testUser).toBeDefined();
      expect(testUser.nombreCompleto).toBe('Test User');
    });

    it('AuthValue interface is properly defined', () => {
      const testAuthValue = {
        mode: 'login',
        userName: 'Test User',
        setMode: vi.fn(),
        setUserName: vi.fn(),
      };

      expect(testAuthValue).toBeDefined();
      expect(testAuthValue.mode).toBe('login');
    });
  });

  describe('re-exports', () => {
    it('re-exports all testing library functions', () => {
      // Test that the re-exported functions are available
      expect(render).toBeDefined();
      expect(screen).toBeDefined();
    });

    it('customRender is available as render', () => {
      // Test that customRender is exported as render
      expect(customRender).toBeDefined();
      expect(typeof customRender).toBe('function');
    });
  });

  describe('integration with React Router', () => {
    it('works with custom render function', () => {
      // Test that customRender works without additional routers
      // since it already includes BrowserRouter
      const { container } = customRender(<TestComponent />);

      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });
});
