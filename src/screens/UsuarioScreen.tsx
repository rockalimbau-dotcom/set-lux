import React from 'react';
import { storage } from '@shared/services/localStorage.service';
import { useNavigate } from 'react-router-dom';

interface UsuarioScreenProps {
  onClose?: () => void;
}

export default function UsuarioScreen({ onClose }: UsuarioScreenProps) {
  const navigate = useNavigate();

  const handlePerfil = () => {
    alert('Abrir perfil (pendiente de implementar)');
  };

  const handleConfiguracion = () => {
    alert('Abrir configuración (pendiente de implementar)');
  };

  const handleCambiarContraseña = () => {
    alert('Cambiar contraseña (pendiente de implementar)');
  };

  const handleAtajos = () => {
    alert('Mostrar atajos de teclado (pendiente de implementar)');
  };

  const handleAyuda = () => {
    alert('Abrir centro de ayuda / feedback (pendiente de implementar)');
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
          Perfil
        </li>
        <li
          onClick={handleConfiguracion}
          className='px-4 py-2 hover:bg-white/10 cursor-pointer'
        >
          Configuración
        </li>

        {/* Opciones extra preparadas (solo muestran alert por ahora) */}
        <li
          onClick={handleCambiarContraseña}
          className='px-4 py-2 hover:bg-white/10 cursor-pointer'
        >
          Cambiar contraseña
        </li>
        <li
          onClick={handleAtajos}
          className='px-4 py-2 hover:bg-white/10 cursor-pointer'
        >
          Atajos de teclado
        </li>
        <li
          onClick={handleAyuda}
          className='px-4 py-2 hover:bg-white/10 cursor-pointer'
        >
          Centro de ayuda / Feedback
        </li>

        <li
          onClick={handleSalir}
          className='px-4 py-2 hover:bg-red-500/20 hover:text-red-400 cursor-pointer'
        >
          Salir
        </li>
      </ul>
    </div>
  );
}
