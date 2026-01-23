import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider.tsx';
import AppRouter from '@app/routes/AppRouter.tsx';
import { Footer } from '@shared/components/Footer.tsx';
import { SuggestionFab } from '@shared/components/SuggestionFab';
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
  const location = useLocation();
  const mainContentRef = useRef<HTMLElement>(null);
  const [hasContent, setHasContent] = useState(false);

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

  // Hide footer during initial load until content is ready
  useEffect(() => {
    // Always start with footer hidden when route changes
    setHasContent(false);
    
    const checkContent = () => {
      if (mainContentRef.current) {
        // Check if main has visible content
        const mainHeight = mainContentRef.current.scrollHeight;
        const mainClientHeight = mainContentRef.current.clientHeight;
        
        // Check for visible children with actual dimensions
        const hasVisibleChildren = Array.from(mainContentRef.current.children).some((child: Element) => {
          const rect = child.getBoundingClientRect();
          // Element must have both width and height > 0 to be considered visible
          return rect.width > 0 && rect.height > 0;
        });
        
        // Show footer only when we have substantial content (more than just padding/margins)
        const hasSubstantialContent = (mainHeight > 100 || mainClientHeight > 100) && hasVisibleChildren;
        setHasContent(hasSubstantialContent);
      } else {
        // If ref not available, keep footer hidden
        setHasContent(false);
      }
    };
    
    // Use requestAnimationFrame for immediate check, then multiple timeouts for lazy loading
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;
    let timer4: NodeJS.Timeout;
    let timer5: NodeJS.Timeout;
    
    requestAnimationFrame(() => {
      checkContent();
      timer1 = setTimeout(checkContent, 50);
      timer2 = setTimeout(checkContent, 150);
      timer3 = setTimeout(checkContent, 300);
      timer4 = setTimeout(checkContent, 500);
      timer5 = setTimeout(checkContent, 800);
    });
    
    // Also use MutationObserver to detect when content is added to DOM
    let observer: MutationObserver | null = null;
    if (mainContentRef.current) {
      observer = new MutationObserver(() => {
        checkContent();
      });
      
      observer.observe(mainContentRef.current, {
        childList: true,
        subtree: true,
        attributes: false,
      });
    }
    
    return () => {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
      if (timer4) clearTimeout(timer4);
      if (timer5) clearTimeout(timer5);
      if (observer) observer.disconnect();
    };
  }, [location.pathname, activeProject]);

  return (
    <>
      <main ref={mainContentRef} id='main-content' role='main' className='pb-12'>
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
      {hasContent && <Footer />}
      {hasContent && <SuggestionFab />}
    </>
  );
}

export default AppInner;
