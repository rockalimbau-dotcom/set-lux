import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@app/providers/AuthProvider.tsx';
import AppInner from './app/App/AppInner';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <a
          href='#main-content'
          className='sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded'
        >
          Saltar al contenido principal
        </a>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
}
