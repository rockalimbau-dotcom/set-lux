import React from 'react';
import BrandHero from '@shared/components/BrandHero.jsx';
import { ThemeToggleButton } from '../ThemeToggleButton';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { LoginState, RegisterState } from '../AppTypes';

interface LandingPageProps {
  mode: 'login' | 'register';
  setMode: (mode: 'login' | 'register') => void;
  login: LoginState;
  setLogin: React.Dispatch<React.SetStateAction<LoginState>>;
  reg: RegisterState;
  setReg: React.Dispatch<React.SetStateAction<RegisterState>>;
  error: string;
  success: string;
  theme: 'dark' | 'light';
  focusColor: string;
  handleLoginSubmit: (e: React.FormEvent) => void;
  handleRegisterSubmit: (e: React.FormEvent) => void;
}

export function LandingPage({
  mode,
  setMode,
  login,
  setLogin,
  reg,
  setReg,
  error,
  success,
  theme,
  focusColor,
  handleLoginSubmit,
  handleRegisterSubmit,
}: LandingPageProps) {
  return (
    <div
      className='min-h-screen flex items-center justify-center'
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <div className='w-full max-w-md landing'>
        <BrandHero tagline='All in One' />

        <div className='flex justify-end mb-4'>
          <ThemeToggleButton />
        </div>

        <div
          className='rounded-2xl border border-neutral-border backdrop-blur p-8 shadow-2xl'
          style={{ backgroundColor: 'var(--panel)' }}
        >
          {mode === 'login' ? (
            <LoginForm
              login={login}
              setLogin={setLogin}
              setMode={setMode}
              theme={theme}
              onSubmit={handleLoginSubmit}
            />
          ) : (
            <RegisterForm
              reg={reg}
              setReg={setReg}
              setMode={setMode}
              theme={theme}
              focusColor={focusColor}
              error={error}
              success={success}
              onSubmit={handleRegisterSubmit}
            />
          )}
        </div>

        <div className='h-10' />
      </div>
    </div>
  );
}

