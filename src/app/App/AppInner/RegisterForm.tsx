import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@shared/components/Button.tsx';
import { InputWithHover } from '../InputWithHover';
import { DropdownSelect } from '../DropdownSelect';
import { RegisterState } from '../AppTypes';
import { getLanguageName, getRoleOptions } from '../AppHelpers';
import { changeLanguage } from '@i18n/config';

interface RegisterFormProps {
  reg: RegisterState;
  setReg: React.Dispatch<React.SetStateAction<RegisterState>>;
  setMode: (mode: 'login' | 'register') => void;
  theme: 'dark' | 'light';
  focusColor: string;
  error: string;
  success: string;
  onSubmit: (e: React.FormEvent) => void;
}

export function RegisterForm({
  reg,
  setReg,
  setMode,
  theme,
  focusColor,
  error,
  success,
  onSubmit,
}: RegisterFormProps) {
  const { t } = useTranslation();
  const roleOptions = getRoleOptions();
  const idiomaOptions = ['Español', 'Catalán', 'Inglés'];

  return (
    <>
      <Button
        type='button'
        onClick={() => setMode('login')}
        variant='ghost'
        size='sm'
        className='mb-6 btn-back-register'
        style={{ color: 'var(--accent)' }}
      >
        {t('auth.back')}
      </Button>

      <form className='space-y-5' onSubmit={onSubmit}>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <label className='block text-sm font-medium' style={{ color: 'var(--text)' }}>
              {t('auth.firstName')}
            </label>
            <InputWithHover
              theme={theme}
              type='text'
              value={reg.nombre}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReg(r => ({ ...r, nombre: e.target.value }))
              }
              placeholder={t('auth.firstNamePlaceholder')}
            />
          </div>
          <div className='space-y-2'>
            <label className='block text-sm font-medium' style={{ color: 'var(--text)' }}>
              {t('auth.lastName')}
            </label>
            <InputWithHover
              theme={theme}
              type='text'
              value={reg.apellido}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReg(r => ({ ...r, apellido: e.target.value }))
              }
              placeholder={t('auth.lastNamePlaceholder')}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <label className='block text-sm font-medium' style={{ color: 'var(--text)' }}>
            {t('auth.role')}
          </label>
          <DropdownSelect
            value={reg.rol}
            options={roleOptions}
            onChange={value => setReg(r => ({ ...r, rol: value }))}
            theme={theme}
            focusColor={focusColor}
          />
        </div>

        <div className='space-y-2'>
          <label className='block text-sm font-medium' style={{ color: 'var(--text)' }}>
            {t('auth.language')}
          </label>
          <DropdownSelect
            value={reg.idioma}
            options={idiomaOptions}
            onChange={value => {
              setReg(r => ({ ...r, idioma: value }));
              changeLanguage(value);
            }}
            theme={theme}
            focusColor={focusColor}
            getDisplayName={value => getLanguageName(value, t)}
          />
        </div>

        <div className='space-y-2'>
          <label className='block text-sm font-medium' style={{ color: 'var(--text)' }}>
            {t('auth.email')}
          </label>
          <InputWithHover
            theme={theme}
            type='email'
            value={reg.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setReg(r => ({ ...r, email: e.target.value }))
            }
            placeholder={t('auth.emailPlaceholder')}
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <label className='block text-sm font-medium' style={{ color: 'var(--text)' }}>
              {t('auth.password')}
            </label>
            <InputWithHover
              theme={theme}
              type='password'
              value={reg.pass}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReg(r => ({ ...r, pass: e.target.value }))
              }
              placeholder={t('auth.passwordPlaceholderRegister')}
            />
          </div>
          <div className='space-y-2'>
            <label className='block text-sm font-medium' style={{ color: 'var(--text)' }}>
              {t('auth.repeatPassword')}
            </label>
            <InputWithHover
              theme={theme}
              type='password'
              value={reg.pass2}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReg(r => ({ ...r, pass2: e.target.value }))
              }
              placeholder={t('auth.passwordPlaceholderRegister')}
            />
          </div>
        </div>

        {error && (
          <div className='text-sm text-red-400 bg-red-950/30 border border-red-800 rounded-lg px-3 py-2'>
            {error}
          </div>
        )}
        {success && (
          <div className='text-sm text-green-400 bg-green-950/30 border border-green-800 rounded-lg px-3 py-2'>
            {success}
          </div>
        )}

        <Button
          type='submit'
          variant='primary'
          size='lg'
          className='w-full'
          style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
        >
          {t('auth.register')}
        </Button>
      </form>
    </>
  );
}

