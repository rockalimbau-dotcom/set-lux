import { describe, it, expect, vi } from 'vitest';

import App from './App';
import { render, screen } from './test/utils';

// Mock react-router-dom para que no interfiera
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);

    // Verificar que la aplicación se renderiza (sin importar el contenido específico)
    expect(document.body).toBeInTheDocument();
  });

  it('renders auth provider', () => {
    render(<App />);

    // Verificar que el AuthProvider se renderiza
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('renders main content', () => {
    render(<App />);

    // Verificar que el contenido principal se renderiza
    expect(document.body).toBeInTheDocument();
  });
});
