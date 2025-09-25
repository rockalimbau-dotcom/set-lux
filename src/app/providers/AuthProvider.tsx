import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import React, { createContext, useContext, useMemo, useState } from 'react';

interface AuthContextType {
  mode: string;
  setMode: (mode: string) => void;
  userName: string | null;
  setUserName: (userName: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  mode: 'login',
  setMode: () => {},
  userName: '',
  setUserName: () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [mode, setMode] = useState('login');
  const [userName, setUserName] = useLocalStorage<string | null>('app_user', '');

  const value = useMemo(
    () => ({ mode, setMode, userName, setUserName }),
    [mode, userName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
