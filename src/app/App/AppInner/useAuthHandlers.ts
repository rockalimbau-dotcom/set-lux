import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storage } from '@shared/services/localStorage.service';
import { changeLanguage } from '@i18n/config';
import { LoginState, RegisterState } from '../AppTypes';
import { getDefaultRole } from '../AppHelpers';

interface UseAuthHandlersParams {
  login: LoginState;
  setLogin: React.Dispatch<React.SetStateAction<LoginState>>;
  reg: RegisterState;
  setReg: React.Dispatch<React.SetStateAction<RegisterState>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setSuccess: React.Dispatch<React.SetStateAction<string>>;
  setMode: (mode: 'login' | 'register' | 'projects') => void;
  setUserName: (name: string) => void;
}

/**
 * Hook para gestionar handlers de autenticación (login y registro)
 */
export function useAuthHandlers({
  login,
  setLogin,
  reg,
  setReg,
  setError,
  setSuccess,
  setMode,
  setUserName,
}: UseAuthHandlersParams) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLoginSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      if (!login.user || !login.pass) {
        setError(t('auth.loginError'));
        return;
      }

//AQUI VA EL SUPUESTO REGISTRO DE LA PEÑA QUE QUIERA ENTRAR EN LA DEMO

if(
  !(login.user === 'admin' && login.pass === '1234') //SI ESTO NO SE CUMPLE, PUES VUELVE, MANERA DE TENER CONTROLADO A LA GENTE QUE TIENE ACCESO
  && !(login.user === 'nombrepersona-fechafinalizacion' && login.pass === '1234')
  
  
){
  setError(t('auth.invalidCredentials'));
  return;
}

      const derived =
        reg.nombre?.trim() ||
        (login.user.includes('@') ? login.user.split('@')[0] : login.user) ||
        'Usuario';

      setUserName(derived);
      setMode('projects');
      navigate('/projects');
    },
    [login.user, login.pass, reg.nombre, setUserName, setMode, navigate, setError, t]
  );

  const handleRegisterSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      const { nombre, apellido, email, pass, pass2 } = reg;
      if (!nombre || !apellido || !email || !pass || !pass2) {
        setError(t('auth.registerError'));
        return;
      }
      if (pass !== pass2) {
        setError(t('auth.passwordMismatch'));
        return;
      }

      // Guardar datos del perfil al registrarse
      const fullName = `${nombre} ${apellido}`.trim();
      storage.setJSON('profile_v1', {
        name: fullName,
        nombre: nombre,
        apellido: apellido,
        email: reg.email,
        role: reg.rol,
        idioma: reg.idioma,
      });

      setSuccess(t('auth.registerSuccess'));
      setTimeout(() => {
        setMode('login');
        setLogin(f => ({ ...f, user: reg.email }));
        setUserName(nombre);
        setReg({
          nombre: '',
          apellido: '',
          rol: getDefaultRole(),
          idioma: 'Español',
          email: '',
          pass: '',
          pass2: '',
        });
        setSuccess('');
        navigate('/');
      }, 1200);
    },
    [reg, setMode, setUserName, navigate, t, setError, setSuccess, setLogin, setReg]
  );

  return { handleLoginSubmit, handleRegisterSubmit };
}

