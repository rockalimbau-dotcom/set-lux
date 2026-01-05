import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@shared/components/Button.tsx';
import { InputWithHover } from '../InputWithHover';
import { LoginState } from '../AppTypes';

interface LoginFormProps {
  login: LoginState;
  setLogin: React.Dispatch<React.SetStateAction<LoginState>>;
  setMode: (mode: 'login' | 'register') => void;
  theme: 'dark' | 'light';
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({ login, setLogin, setMode, theme, onSubmit }: LoginFormProps) {
  const { t } = useTranslation();

  return (
    <form className='space-y-6' onSubmit={onSubmit}>
      <div className='space-y-2'>
        <label className='block text-sm font-medium' style={{ color: 'var(--text)' }}>
          {t('auth.user')}
        </label>
        <InputWithHover
          theme={theme}
          type='text'
          value={login.user}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLogin(f => ({ ...f, user: e.target.value }))
          }
          placeholder={t('auth.userPlaceholder')}
        />
      </div>

      <div className='space-y-2'>
        <label className='block text-sm font-medium' style={{ color: 'var(--text)' }}>
          {t('auth.password')}
        </label>
        <InputWithHover
          theme={theme}
          type='password'
          value={login.pass}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLogin(f => ({ ...f, pass: e.target.value }))
          }
          placeholder={t('auth.passwordPlaceholder')}
        />
      </div>

      <Button
        type='submit'
        variant='primary'
        size='lg'
        className='w-full'
        style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
      >
        {t('auth.login')}
      </Button>

      <div className='text-center'>
        <button
          type='button'
          onClick={() => setMode('register')}
          className='text-sm transition-colors'
          style={{ color: '#f97316' }}
        >
          {t('auth.noAccount')}{' '}
          <span className='font-medium hover:underline'>{t('auth.registerLink')}</span>
        </button>
      </div>
    </form>
  );
}

