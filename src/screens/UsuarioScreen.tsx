import React from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '@shared/services/localStorage.service';
import { useNavigate } from 'react-router-dom';

interface UsuarioScreenProps {
  onClose?: () => void;
}

export default function UsuarioScreen({ onClose }: UsuarioScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handlePerfil = () => {
    alert(t('userMenu.profilePending'));
  };

  const handleConfiguracion = () => {
    alert(t('userMenu.settingsPending'));
  };

  const handleCambiarContraseña = () => {
    alert(t('userMenu.changePasswordPending'));
  };

  const handleAtajos = () => {
    alert(t('userMenu.keyboardShortcutsPending'));
  };

  const handleAyuda = () => {
    alert(t('userMenu.helpCenterPending'));
  };

  const handleSalir = () => {
    try {
      // Borra el usuario de localStorage si lo guardas allí
      storage.remove('currentUser');
      // Si quieres borrar todo el estado de sesión:
      // localStorage.clear();
    } catch {}
    // Redirige a la pantalla inicial (login)
    navigate('/', { replace: true });
    if (onClose) onClose();
  };

  return (
    <div className='absolute right-6 top-16 w-48 rounded-xl border border-neutral-border bg-neutral-panel shadow-lg z-50'>
      <ul className='text-sm text-zinc-200'>
        <li
          onClick={handlePerfil}
          className='px-4 py-2 hover:bg-white/10 cursor-pointer'
        >
          {t('userMenu.profile')}
        </li>
        <li
          onClick={handleConfiguracion}
          className='px-4 py-2 hover:bg-white/10 cursor-pointer'
        >
          {t('userMenu.settings')}
        </li>

        {/* Opciones extra preparadas (solo muestran alert por ahora) */}
        <li
          onClick={handleCambiarContraseña}
          className='px-4 py-2 hover:bg-white/10 cursor-pointer'
        >
          {t('userMenu.changePassword')}
        </li>
        <li
          onClick={handleAtajos}
          className='px-4 py-2 hover:bg-white/10 cursor-pointer'
        >
          {t('userMenu.keyboardShortcuts')}
        </li>
        <li
          onClick={handleAyuda}
          className='px-4 py-2 hover:bg-white/10 cursor-pointer'
        >
          {t('userMenu.helpCenter')}
        </li>

        <li
          onClick={handleSalir}
          className='px-4 py-2 hover:bg-red-500/20 hover:text-red-400 cursor-pointer'
        >
          {t('userMenu.logout')}
        </li>
      </ul>
    </div>
  );
}
