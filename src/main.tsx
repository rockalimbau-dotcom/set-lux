import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';

import App from './App.tsx';
import './index.css';
import { storage } from '@shared/services/localStorage.service';
import './i18n/config'; // Inicializar i18n
import i18n from './i18n/config';

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
          <h3>{i18n.t('common.errorLoadingApp')}</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Apply theme on load based on saved settings (before render)
try {
  const s = storage.getJSON<any>('settings_v1') || {};
  const localTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
  const theme = (localTheme || s.theme || 'light') as 'light' | 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const faviconLight = '/logoBombillaClaro_v2.png';
  const faviconDark = '/logoAnillosOscuro_v2.png';
  const setFavicon = (currentTheme: 'light' | 'dark') => {
    const href = currentTheme === 'light' ? faviconLight : faviconDark;
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = href;
  };
  setFavicon(theme);
  const observer = new MutationObserver(() => {
    const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'light' | 'dark';
    setFavicon(currentTheme);
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  // Keep storages in sync
  try {
    localStorage.setItem('theme', theme);
    storage.setJSON('settings_v1', { ...s, theme });
  } catch {}
} catch {
  document.documentElement.setAttribute('data-theme', 'light');
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (link) {
    link.type = 'image/png';
    link.href = '/logoBombillaClaro_v2.png';
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

// Theme already applied above
