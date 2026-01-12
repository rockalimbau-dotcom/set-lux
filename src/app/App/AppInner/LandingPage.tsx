import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  setError: React.Dispatch<React.SetStateAction<string>>;
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
  setError,
}: LandingPageProps) {
  const { t } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(theme);

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const themeAttr = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setCurrentTheme(themeAttr);
      }
    };

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        className='min-h-screen flex items-center justify-center px-8 sm:px-10 md:px-12 lg:px-6 py-4 sm:py-5 md:py-6'
        style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
      >
        <div className='w-full max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md landing'>
          <BrandHero tagline='All in One' />

          <div className='flex justify-end mb-3 sm:mb-4'>
            <ThemeToggleButton />
          </div>

          <div
            className='rounded-xl sm:rounded-2xl border border-neutral-border backdrop-blur p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 shadow-2xl'
            style={{ backgroundColor: 'var(--panel)' }}
          >
            {/* {mode === 'login' ? ( */}
              <LoginForm
                login={login}
                setLogin={setLogin}
                setMode={setMode}
                theme={theme}
                onSubmit={handleLoginSubmit}
              />
            {/* ) : (
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
            )} */}
          </div>

          <div className='h-6 sm:h-8 md:h-10' />
        </div>
      </div>

      {/* Modal de error de credenciales - a nivel de página completa */}
      {error && (
        <div className='fixed inset-0 bg-black/60 grid place-items-center p-6 sm:p-6 md:p-6 z-50 overflow-y-auto'>
          <div 
            className='w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-xs xl:max-w-sm 2xl:max-w-md rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 2xl:p-6 my-auto max-h-[75vh] sm:max-h-[80vh] overflow-y-auto'
          >
            <h3 
              className='text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4' 
              style={{
                color: currentTheme === 'light' ? '#0476D9' : '#F27405'
              }}
            >
              {t('auth.loginErrorTitle')}
            </h3>
            
            <p 
              className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6' 
              style={{color: currentTheme === 'light' ? '#111827' : '#d1d5db'}}
            >
              {error}
            </p>

            <div className='flex justify-center'>
              <button
                onClick={() => {
                  setError('');
                }}
                className='inline-flex items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border transition text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium hover:opacity-90'
                style={{
                  borderColor: currentTheme === 'light' ? '#0476D9' : '#F27405',
                  color: '#ffffff',
                  backgroundColor: currentTheme === 'light' ? '#0476D9' : '#F27405'
                }}
                type='button'
              >
                {t('auth.ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

