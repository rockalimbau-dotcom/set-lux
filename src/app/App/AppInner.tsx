import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider.tsx';
import AppRouter from '@app/routes/AppRouter.tsx';
import { Footer } from '@shared/components/Footer.tsx';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import type { Project as UIProject } from '@features/projects/pages/ProjectsScreen.tsx';
import { LoginState, RegisterState } from './AppTypes';
import { getDefaultRole } from './AppHelpers';
import { useTheme } from './useTheme';
import { useAuthHandlers } from './AppInner/useAuthHandlers';
import { useProjectsNormalization } from './AppInner/useProjectsNormalization';
import { LandingPage } from './AppInner/LandingPage';

function AppInner() {
  const { mode, setMode, userName, setUserName } = useAuth();
  const { theme, focusColor } = useTheme();

  // Main state
  const [login, setLogin] = useState<LoginState>({ user: '', pass: '' });
  const [reg, setReg] = useState<RegisterState>({
    nombre: '',
    apellido: '',
    rol: getDefaultRole(),
    idioma: 'Español',
    email: '',
    pass: '',
    pass2: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [projects, setProjects] = useLocalStorage<UIProject[]>('projects_v1', []);
  const [activeProject, setActiveProject] = useState<UIProject | null>(null);

  // Normalize projects
  useProjectsNormalization(projects, setProjects);

  // Auth handlers
  const { handleLoginSubmit, handleRegisterSubmit } = useAuthHandlers({
    login,
    setLogin,
    reg,
    setReg,
    setError,
    setSuccess,
    setMode,
    setUserName,
  });

  return (
    <>
      <main id='main-content' role='main' className='pb-12'>
        <Routes>
          <Route
            path='/'
            element={
              <LandingPage
                mode={mode}
                setMode={setMode}
                login={login}
                setLogin={setLogin}
                reg={reg}
                setReg={setReg}
                error={error}
                success={success}
                theme={theme}
                focusColor={focusColor}
                handleLoginSubmit={handleLoginSubmit}
                handleRegisterSubmit={handleRegisterSubmit}
                setError={setError}
              />
            }
          />

          <Route
            path='/projects'
            element={
              <AppRouter
                mode={mode}
                setMode={setMode}
                userName={userName}
                setUserName={setUserName}
                projects={projects as UIProject[]}
                setProjects={setProjects as any}
                activeProject={activeProject as UIProject | null}
                setActiveProject={setActiveProject as unknown as (project: UIProject | null) => void}
              />
            }
          />

          <Route
            path='/project/:id/*'
            element={
              <AppRouter
                mode={mode}
                setMode={setMode}
                userName={userName}
                setUserName={setUserName}
                projects={projects as UIProject[]}
                setProjects={setProjects as any}
                activeProject={activeProject as UIProject | null}
                setActiveProject={setActiveProject as unknown as (project: UIProject | null) => void}
              />
            }
          />

          <Route
            path='/profile'
            element={
              <AppRouter
                mode={mode}
                setMode={setMode}
                userName={userName}
                setUserName={setUserName}
                projects={projects as UIProject[]}
                setProjects={setProjects as any}
                activeProject={activeProject as UIProject | null}
                setActiveProject={setActiveProject as unknown as (project: UIProject | null) => void}
              />
            }
          />

          <Route
            path='/settings'
            element={
              <AppRouter
                mode={mode}
                setMode={setMode}
                userName={userName}
                setUserName={setUserName}
                projects={projects as UIProject[]}
                setProjects={setProjects as any}
                activeProject={activeProject as UIProject | null}
                setActiveProject={setActiveProject as unknown as (project: UIProject | null) => void}
              />
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default AppInner;
