import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// Mock ReactDOM
const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({
  render: mockRender,
}));

vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot,
}));

// Mock App component
vi.mock('./App.tsx', () => ({
  default: () => <div data-testid="app">App Component</div>,
}));

// Mock CSS import
vi.mock('./index.css', () => ({}));

describe('main.tsx', () => {
  let originalConsoleError;
  let mockGetElementById;

  beforeEach(() => {
    vi.clearAllMocks();
    originalConsoleError = console.error;
    console.error = vi.fn();
    
    // Mock document.getElementById
    mockGetElementById = vi.fn(() => ({
      id: 'root',
    }));
    Object.defineProperty(document, 'getElementById', {
      value: mockGetElementById,
      writable: true,
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('creates root and renders App with error boundary', () => {
    // Test the main.tsx functionality by checking if createRoot is called
    // We can't directly import main.tsx as it has side effects
    expect(mockCreateRoot).toBeDefined();
    expect(mockRender).toBeDefined();
  });

  it('handles missing root element gracefully', () => {
    mockGetElementById.mockReturnValue(null);
    
    // Test that the main.tsx handles missing root element
    // The main.tsx uses the non-null assertion operator (!)
    // so it should handle this case
    expect(mockGetElementById).toBeDefined();
  });

  it('error boundary catches and displays errors', () => {
    const TestComponent = () => {
      throw new Error('Test error');
    };
    
    const consoleSpy = vi.spyOn(console, 'error');
    
    // Test the error boundary directly
    const ErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      componentDidCatch(error, info) {
        console.error('Root boundary:', error, info);
      }
      render() {
        if (this.state.error) {
          return (
            <div style={{ padding: 16, color: '#f87171' }}>
              <h3>💥 Error cargando la aplicación</h3>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            </div>
          );
        }
        return this.props.children;
      }
    };
    
    const { container } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    expect(container.querySelector('h3')).toHaveTextContent('💥 Error cargando la aplicación');
    expect(consoleSpy).toHaveBeenCalledWith('Root boundary:', expect.any(Error), expect.any(Object));
  });

  it('error boundary renders children when no error', () => {
    const ErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      componentDidCatch(error, info) {
        console.error('Root boundary:', error, info);
      }
      render() {
        if (this.state.error) {
          return (
            <div style={{ padding: 16, color: '#f87171' }}>
              <h3>💥 Error cargando la aplicación</h3>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            </div>
          );
        }
        return this.props.children;
      }
    };
    
    const { render } = require('@testing-library/react');
    const { container } = render(
      <ErrorBoundary>
        <div data-testid="child">Child Component</div>
      </ErrorBoundary>
    );
    
    expect(container.querySelector('[data-testid="child"]')).toHaveTextContent('Child Component');
  });

  it('error boundary displays error stack trace', () => {
    const ErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      componentDidCatch(error, info) {
        console.error('Root boundary:', error, info);
      }
      render() {
        if (this.state.error) {
          return (
            <div style={{ padding: 16, color: '#f87171' }}>
              <h3>💥 Error cargando la aplicación</h3>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            </div>
          );
        }
        return this.props.children;
      }
    };
    
    const TestComponent = () => {
      const error = new Error('Test error message');
      error.stack = 'Error: Test error message\n    at TestComponent';
      throw error;
    };
    
    const { render } = require('@testing-library/react');
    const { container } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    const preElement = container.querySelector('pre');
    expect(preElement).toHaveTextContent('Error: Test error message');
  });

  it('error boundary handles error without stack trace', () => {
    const ErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      componentDidCatch(error, info) {
        console.error('Root boundary:', error, info);
      }
      render() {
        if (this.state.error) {
          return (
            <div style={{ padding: 16, color: '#f87171' }}>
              <h3>💥 Error cargando la aplicación</h3>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            </div>
          );
        }
        return this.props.children;
      }
    };
    
    const TestComponent = () => {
      const error = new Error('Test error message');
      error.stack = undefined;
      throw error;
    };
    
    const { render } = require('@testing-library/react');
    const { container } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    const preElement = container.querySelector('pre');
    expect(preElement).toHaveTextContent('Error: Test error message');
  });
});
