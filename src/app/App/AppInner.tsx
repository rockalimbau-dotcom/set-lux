import { useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@app/providers/AuthProvider.tsx';
import AppRouter from '@app/routes/AppRouter.tsx';
import { Footer } from '@shared/components/Footer.tsx';
import { SuggestionFab } from '@shared/components/SuggestionFab';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { storage } from '@shared/services/localStorage.service';
import { TutorialOverlay } from '@shared/components/TutorialOverlay';
import type { TutorialStep } from '@shared/components/TutorialOverlay';
import type { Project as UIProject } from '@features/projects/types';
import { LoginState, RegisterState } from './AppTypes';
import { getDefaultRole } from './AppHelpers';
import { useTheme } from './useTheme';
import { useAuthHandlers } from './AppInner/useAuthHandlers';
import { useProjectsNormalization } from './AppInner/useProjectsNormalization';
import { LandingPage } from './AppInner/LandingPage';

function AppInner() {
  const { mode, setMode, userName, setUserName } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isLight = theme === 'light';
  const location = useLocation();
  const navigate = useNavigate();
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
  const [, setSuccess] = useState('');
  const [projects, setProjects] = useLocalStorage<UIProject[]>('projects_v1', []);
  const [activeProject, setActiveProject] = useState<UIProject | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [tutorialToast, setTutorialToast] = useState<string | null>(null);
  const [tutorialFinishToast, setTutorialFinishToast] = useState<string | null>(null);
  const [tutorialPromptClosed, setTutorialPromptClosed] = useState(false);
  const tutorialInitRef = useRef(false);
  const isAuthRoute = location.pathname === '/';

  // Normalize projects
  useProjectsNormalization(projects, setProjects);

  // Auth handlers
  const { handleLoginSubmit } = useAuthHandlers({
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

  const tutorialSteps = useMemo<TutorialStep[]>(() => ([
    {
      id: 'theme',
      title: t('tutorial.steps.theme.title'),
      description: t('tutorial.steps.theme.body'),
      selector: '[data-tutorial="theme-toggle"]',
    },
    {
      id: 'new-project',
      title: t('tutorial.steps.newProject.title'),
      description: t('tutorial.steps.newProject.body'),
      selector: '[data-tutorial="new-project"]',
    },
    {
      id: 'new-project-form',
      title: t('tutorial.steps.newProjectForm.title'),
      description: t('tutorial.steps.newProjectForm.body'),
      selector: '[data-tutorial="new-project-form"]',
      tooltipPlacement: 'right',
      tooltipMaxWidth: 300,
      tooltipShiftX: 24,
    },
    {
      id: 'team-card',
      title: t('tutorial.steps.team.title'),
      description: t('tutorial.steps.team.body'),
      selector: '[data-tutorial="phase-equipo"]',
    },
    {
      id: 'team-add',
      title: t('tutorial.steps.teamAdd.title'),
      description: t('tutorial.steps.teamAdd.body'),
      selector: '[data-tutorial="team-add-base"]',
      tooltipShiftX: -75,
    },
    {
      id: 'team-row',
      title: t('tutorial.steps.teamRow.title'),
      description: t('tutorial.steps.teamRow.body'),
      selector: '[data-tutorial="team-row-base"]',
      tooltipPlacement: 'center',
      extraSelector: '[data-tutorial="team-role-dropdown"]',
      tooltipMaxWidth: 320,
      highlightMode: 'union',
    },
    {
      id: 'conditions-card',
      title: t('tutorial.steps.conditions.title'),
      description: t('tutorial.steps.conditions.body'),
      selector: '[data-tutorial="phase-condiciones"]',
    },
    {
      id: 'conditions-params',
      title: t('tutorial.steps.conditionsParams.title'),
      description: t('tutorial.steps.conditionsParams.body'),
      selector: '[data-tutorial="conditions-params"]',
      tooltipPlacement: 'auto',
      tooltipAnchorSelector: '[data-tutorial="conditions-pernocta-anchor"]',
      tooltipMaxWidth: 280,
      tooltipOffset: 10,
    },
    {
      id: 'conditions-prices',
      title: t('tutorial.steps.conditionsPrices.title'),
      description: t('tutorial.steps.conditionsPrices.body'),
      selector: '[data-tutorial="conditions-prices"]',
    },
    {
      id: 'planning-card',
      title: t('tutorial.steps.planning.title'),
      description: t('tutorial.steps.planning.body'),
      selector: '[data-tutorial="phase-necesidades"]',
    },
    {
      id: 'planning-upload-plan',
      title: t('tutorial.steps.planningUpload.title'),
      description: t('tutorial.steps.planningUpload.body'),
      selector: '[data-tutorial="planning-upload-plan"]',
    },
    {
      id: 'planning-add-week',
      title: t('tutorial.steps.planningAdd.title'),
      description: t('tutorial.steps.planningAdd.body'),
      selector: '[data-tutorial="planning-add-week"]',
      noScroll: true,
    },
    {
      id: 'planning-week',
      title: t('tutorial.steps.planningWeek.title'),
      description: t('tutorial.steps.planningWeek.body'),
      selector: '[data-tutorial="planning-week"]',
      noScroll: true,
      tooltipPlacement: 'top',
      tooltipOffset: 12,
      tooltipShiftY: 20,
    },
    {
      id: 'reports-card',
      title: t('tutorial.steps.reports.title'),
      description: t('tutorial.steps.reports.body'),
      selector: '[data-tutorial="phase-reportes"]',
      tooltipPlacement: 'bottom',
      tooltipShiftY: 28,
      tooltipOffset: -15,
    },
    {
      id: 'reports-week',
      title: t('tutorial.steps.reportsWeek.title'),
      description: t('tutorial.steps.reportsWeek.body'),
      selector: '[data-tutorial="reports-week"]',
      tooltipPlacement: 'bottom',
      tooltipOffset: 16,
      tooltipShiftY: 28,
      tooltipBottomPadding: 4,
      noScroll: true,
    },
    {
      id: 'reports-extra',
      title: t('tutorial.steps.reportsExtra.title'),
      description: t('tutorial.steps.reportsExtra.body'),
      selector: '[data-tutorial="reports-extra-hours"]',
      tooltipPlacement: 'right',
      tooltipMaxWidth: 260,
      extraSelector: '[data-tutorial="reports-extra-dropdown"]',
      noScroll: true,
    },
    {
      id: 'reports-range',
      title: t('tutorial.steps.reportsRange.title'),
      description: t('tutorial.steps.reportsRange.body'),
      selector: '[data-tutorial="reports-range"]',
      noScroll: true,
    },
    {
      id: 'payroll-card',
      title: t('tutorial.steps.payroll.title'),
      description: t('tutorial.steps.payroll.body'),
      selector: '[data-tutorial="phase-nomina"]',
    },
    {
      id: 'payroll-table',
      title: t('tutorial.steps.payrollTable.title'),
      description: t('tutorial.steps.payrollTable.body'),
      selector: '[data-tutorial="payroll-table"]',
      noScroll: true,
    },
    {
      id: 'payroll-range',
      title: t('tutorial.steps.payrollRange.title'),
      description: t('tutorial.steps.payrollRange.body'),
      selector: '[data-tutorial="payroll-range"]',
      tooltipPlacement: 'bottom',
      tooltipMaxWidth: 360,
      noScroll: true,
    },
    {
      id: 'status',
      title: t('tutorial.steps.status.title'),
      description: t('tutorial.steps.status.body'),
      selector: '[data-tutorial="project-status"]',
      tooltipShiftX: -40,
    },
    {
      id: 'help',
      title: t('tutorial.steps.help.title'),
      description: t('tutorial.steps.help.body'),
      selector: '[data-tutorial="help-fab"]',
      extraSelector: '[data-tutorial="help-panel"]',
      tooltipPlacement: 'top',
      tooltipMaxWidth: 280,
    },
  ]), [t]);

  const findStepIndex = (id: string) => tutorialSteps.findIndex(step => step.id === id);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = storage.getJSON<boolean>('tutorial_dismissed_v1') === true;
    const isNewUser = Array.isArray(projects) && projects.length === 0;
    const shouldPrompt =
      !dismissed &&
      isNewUser &&
      location.pathname === '/projects' &&
      !tutorialOpen &&
      !tutorialPromptClosed;

    setShowTutorialPrompt(shouldPrompt);
  }, [projects, location.pathname, tutorialOpen, tutorialPromptClosed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      setTutorialStep(0);
      setTutorialOpen(true);
      setShowTutorialPrompt(false);
      setTutorialPromptClosed(true);
    };
    window.addEventListener('start-tutorial', handler as EventListener);
    return () => {
      window.removeEventListener('start-tutorial', handler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      if (!tutorialOpen) return;
      const currentId = tutorialSteps[tutorialStep]?.id;
      if (currentId !== 'new-project') return;
      const nextIndex = findStepIndex('new-project-form');
      if (nextIndex >= 0) setTutorialStep(nextIndex);
    };
    window.addEventListener('tutorial-new-project-opened', handler as EventListener);
    return () => {
      window.removeEventListener('tutorial-new-project-opened', handler as EventListener);
    };
  }, [tutorialOpen, tutorialStep, tutorialSteps]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event?: Event) => {
      if (!tutorialOpen) return;
      const detail = (event as CustomEvent<{ projectId?: string }> | undefined)?.detail;
      const projectId = detail?.projectId;
      if (!projectId) return;
      setMode('project');
      const tryOpen = () => {
        const found = (Array.isArray(projects) ? projects : []).find(
          p => String(p?.id) === String(projectId)
        );
        if (found) setActiveProject(found);
        const nextIndex = findStepIndex('team-card');
        if (nextIndex >= 0) setTutorialStep(nextIndex);
        navigate(`/project/${projectId}`);
      };
      tryOpen();
    };
    window.addEventListener('tutorial-new-project-created', handler as EventListener);
    return () => {
      window.removeEventListener('tutorial-new-project-created', handler as EventListener);
    };
  }, [tutorialOpen, tutorialSteps, projects, navigate, setMode, setActiveProject]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      if (!tutorialOpen) return;
      const nextIndex = findStepIndex('team-row');
      if (nextIndex >= 0) setTutorialStep(nextIndex);
    };
    window.addEventListener('tutorial-team-member-added', handler as EventListener);
    return () => {
      window.removeEventListener('tutorial-team-member-added', handler as EventListener);
    };
  }, [tutorialOpen, tutorialSteps]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      if (!tutorialOpen) return;
      const nextIndex = findStepIndex('planning-week');
      if (nextIndex >= 0) setTutorialStep(nextIndex);
    };
    window.addEventListener('tutorial-planning-week-added', handler as EventListener);
    return () => {
      window.removeEventListener('tutorial-planning-week-added', handler as EventListener);
    };
  }, [tutorialOpen, tutorialSteps]);

  useEffect(() => {
    if (!tutorialOpen) return;
    storage.setJSON('tutorial_step_v1', tutorialStep);
  }, [tutorialOpen, tutorialStep]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!tutorialInitRef.current) return;
    if (tutorialOpen) {
      storage.setJSON('tutorial_open_v1', true);
      storage.setString('tutorial_path_v1', location.pathname);
    } else {
      storage.setJSON('tutorial_open_v1', false);
    }
  }, [tutorialOpen, location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shouldResume = storage.getJSON<boolean>('tutorial_open_v1') === true;
    if (!shouldResume) return;
    const savedStep = storage.getJSON<number>('tutorial_step_v1');
    const savedPath = storage.getString('tutorial_path_v1') || '';
    const stepId =
      typeof savedStep === 'number' && savedStep >= 0 ? tutorialSteps[savedStep]?.id : undefined;
    if (typeof savedStep === 'number' && savedStep >= 0) {
      setTutorialStep(savedStep);
    }
    if (savedPath && savedPath !== location.pathname) {
      navigate(savedPath);
    }
    setTutorialOpen(true);
    setShowTutorialPrompt(false);
    setTutorialPromptClosed(true);
    if (stepId === 'new-project-form') {
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('tutorial-open-new-project'));
        } catch {}
      }, 0);
    }
    tutorialInitRef.current = true;
  }, [location.pathname, navigate, tutorialSteps]);

  useEffect(() => {
    if (tutorialInitRef.current) return;
    tutorialInitRef.current = true;
  }, []);

  const dismissTutorialPrompt = (permanent: boolean) => {
    setShowTutorialPrompt(false);
    setTutorialPromptClosed(true);
    if (permanent) {
      storage.setJSON('tutorial_dismissed_v1', true);
    }
    setTutorialToast(t('tutorial.reminder'));
    setTimeout(() => setTutorialToast(null), 3000);
  };

  const setAuthMode = (next: 'login' | 'register') => setMode(next);

  return (
    <>
      <main ref={mainContentRef} id='main-content' role='main' className='pb-12'>
        <Routes>
          <Route
            path='/'
            element={
              <LandingPage
                setMode={setAuthMode}
                login={login}
                setLogin={setLogin}
                error={error}
                theme={theme}
                handleLoginSubmit={handleLoginSubmit}
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
                projects={projects as UIProject[]}
                setProjects={setProjects as any}
                activeProject={activeProject as UIProject | null}
                setActiveProject={setActiveProject as unknown as (project: UIProject | null) => void}
              />
            }
          />
        </Routes>
      </main>
      {showTutorialPrompt && (
        <div className='fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4'>
          <div
            className='w-full max-w-sm rounded-xl border p-4 shadow-xl'
            style={{
              backgroundColor: isLight ? '#ffffff' : 'var(--panel)',
              borderColor: isLight ? '#e5e7eb' : 'var(--border)',
              color: isLight ? '#111827' : 'var(--text)',
            }}
          >
            <div className='text-base font-semibold' style={{ color: isLight ? '#111827' : 'var(--text)' }}>
              {t('tutorial.promptTitle')}
            </div>
            <div className='mt-1 text-xs' style={{ color: isLight ? '#6b7280' : '#d1d5db' }}>
              {t('tutorial.promptBody')}
            </div>
            <div className='mt-4 flex flex-wrap items-center justify-end gap-2'>
              <button
                type='button'
                onClick={() => dismissTutorialPrompt(false)}
                className='rounded-md border px-3 py-1 text-[11px]'
                style={{
                  borderColor: isLight ? '#d1d5db' : 'var(--border)',
                  color: isLight ? '#111827' : '#ffffff',
                }}
              >
                {t('tutorial.promptLater')}
              </button>
              <button
                type='button'
                onClick={() => dismissTutorialPrompt(true)}
                className='rounded-md border px-3 py-1 text-[11px]'
                style={{
                  borderColor: isLight ? '#d1d5db' : 'var(--border)',
                  color: isLight ? '#111827' : '#ffffff',
                }}
              >
                {t('tutorial.promptNever')}
              </button>
              <button
                type='button'
                onClick={() => {
                  setTutorialStep(0);
                  setTutorialOpen(true);
                  setShowTutorialPrompt(false);
                  setTutorialPromptClosed(true);
                }}
                className='rounded-md px-3 py-1 text-[11px] font-semibold text-white'
                style={{ backgroundColor: isLight ? '#0468BF' : '#F27405' }}
              >
                {t('tutorial.promptStart')}
              </button>
            </div>
          </div>
        </div>
      )}
      {tutorialToast && (
        <div className='fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2'>
          <div
            className='rounded-full border border-neutral-border bg-neutral-panel px-5 py-3 text-xs shadow-lg'
            style={{ color: isLight ? '#000000' : 'var(--text)' }}
          >
            {tutorialToast}
          </div>
        </div>
      )}
      {tutorialFinishToast && (
        <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4'>
          <div
            className='rounded-md border border-neutral-border px-6 py-5 text-center text-base font-semibold shadow-xl sm:text-lg'
            style={{
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'var(--border)',
              backgroundColor: isLight ? '#ffffff' : 'var(--panel)',
              color: isLight ? '#111827' : '#ffffff',
              whiteSpace: 'pre-line',
            }}
          >
            <div className='text-lg font-semibold sm:text-xl'>
              {t('tutorial.finishTitlePrefix')}{' '}
              <span style={{ color: isLight ? '#2563eb' : '#f59e0b' }}>{tutorialFinishToast}</span>{' '}
              {t('tutorial.finishTitleSuffix')}
            </div>
            <div className='mt-2 text-base font-normal sm:text-lg' style={{ color: isLight ? '#111827' : '#ffffff' }}>
              {t('tutorial.finishBody')}
            </div>
          </div>
        </div>
      )}
      <TutorialOverlay
        isOpen={tutorialOpen}
        steps={tutorialSteps}
        stepIndex={tutorialStep}
        onStepChange={(nextIndex) => {
          const currentId = tutorialSteps[tutorialStep]?.id;
          const nextId = tutorialSteps[nextIndex]?.id;
          if (currentId === 'new-project' && nextId === 'new-project-form') {
            try {
              window.dispatchEvent(new CustomEvent('tutorial-open-new-project'));
            } catch {}
            return;
          }
          if (currentId === 'new-project-form' && nextId === 'team-card') {
            try {
              window.dispatchEvent(new CustomEvent('tutorial-submit-new-project'));
            } catch {}
            return;
          }
          if (currentId === 'team-card' && (nextId === 'new-project-form' || nextId === 'new-project')) {
            const targetIndex = findStepIndex('new-project');
            if (targetIndex >= 0) {
              setTutorialStep(targetIndex);
              setMode('projects');
              navigate('/projects');
              return;
            }
          }
          if (currentId === 'team-add' && nextId === 'team-card') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          if (currentId === 'team-card' && nextId === 'team-add') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/equipo`);
          }
          if (currentId === 'team-add' && nextId === 'team-row') {
            try {
              window.dispatchEvent(new CustomEvent('tutorial-team-add-row'));
            } catch {}
            return;
          }
          if (currentId === 'conditions-card' && nextId === 'conditions-params') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/condiciones`);
          }
          if (currentId === 'planning-card' && nextId === 'planning-upload-plan') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/calendario`);
          }
          if (currentId === 'planning-upload-plan' && nextId === 'planning-card') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          if (currentId === 'planning-upload-plan' && nextId === 'planning-add-week') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/calendario`);
          }
          if (currentId === 'planning-card' && nextId === 'planning-add-week') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/calendario`);
          }
          if (currentId === 'planning-add-week' && nextId === 'planning-upload-plan') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/calendario`);
          }
          if (currentId === 'planning-add-week' && nextId === 'planning-card') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          if (currentId === 'planning-add-week' && nextId === 'planning-week') {
            try {
              window.dispatchEvent(new CustomEvent('tutorial-planning-add-week'));
            } catch {}
            return;
          }
          if (currentId === 'planning-week' && nextId === 'reports-card') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          if (currentId === 'reports-card' && nextId === 'planning-week') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/calendario`);
          }
          if (currentId === 'conditions-prices' && nextId === 'planning-card') {
            const priceInput = document.querySelector('[data-tutorial="conditions-price-input"] input') as HTMLInputElement | null;
            if (priceInput && !priceInput.value.trim()) {
              priceInput.focus();
              return;
            }
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          if (currentId === 'team-row' && nextId === 'conditions-card') {
            const nameInput = document.querySelector('[data-tutorial="team-name-base"]') as HTMLInputElement | null;
            if (nameInput && !nameInput.value.trim()) {
              nameInput.focus();
              return;
            }
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          if (currentId === 'conditions-card' && (nextId === 'team-row' || nextId === 'team-add' || nextId === 'team-card')) {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/equipo`);
          }
          if (currentId === 'conditions-params' && nextId === 'conditions-card') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          if (currentId === 'planning-card' && nextId === 'conditions-prices') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/condiciones`);
          }
          if (currentId === 'reports-card' && nextId === 'reports-week') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/reportes`);
          }
          if (currentId === 'reports-week' && nextId === 'reports-card') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          if (currentId === 'reports-extra' && nextId === 'reports-range') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/reportes`);
          }
          if (currentId === 'payroll-table' && nextId === 'payroll-range') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/nomina`);
          }
          if (currentId === 'reports-range' && nextId === 'payroll-card') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          if (currentId === 'payroll-card' && nextId === 'reports-range') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/reportes`);
          }
          if (currentId === 'payroll-card' && nextId === 'reports-extra') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/reportes`);
          }
          if (currentId === 'payroll-card' && nextId === 'payroll-table') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}/nomina`);
          }
          if (currentId === 'payroll-table' && nextId === 'payroll-card') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          if (nextId === 'status') {
            if (activeProject?.id) navigate(`/project/${activeProject.id}`);
          }
          setTutorialStep(nextIndex);
        }}
        onClose={() => {
          setTutorialOpen(false);
          setTutorialStep(0);
        }}
        onFinish={() => {
          const safeName = (userName || '').trim();
          const fallbackName = t('tutorial.finishNameFallback');
          setTutorialFinishToast(safeName ? safeName : fallbackName);
          setTimeout(() => {
            setTutorialFinishToast(null);
            setMode('projects');
            navigate('/projects');
          }, 2600);
        }}
        missingHint={t('tutorial.missingHint')}
      />
      {hasContent && <Footer />}
      {hasContent && !isAuthRoute && <SuggestionFab />}
    </>
  );
}

export default AppInner;
