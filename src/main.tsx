import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';

import App from './App.tsx';
import './index.css';
import { storage } from '@shared/services/localStorage.service';

// Copia mínima del ErrorBoundary o impórtalo desde un archivo común
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
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
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // En desarrollo, StrictMode dobla efectos; si te molesta, puedes quitarlo.
  // <React.StrictMode>
  <RootErrorBoundary>
    <App />
    <Analytics />
  </RootErrorBoundary>
  // </React.StrictMode>
);

// Apply theme on load based on saved settings
try {
  const s = storage.getJSON<any>('settings_v1') || {};
  // Check both settings_v1 and localStorage
  const localTheme = typeof localStorage !== 'undefined' && localStorage.getItem('theme');
  const theme = s.theme || localTheme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
} catch {
  document.documentElement.setAttribute('data-theme', 'dark');
}
