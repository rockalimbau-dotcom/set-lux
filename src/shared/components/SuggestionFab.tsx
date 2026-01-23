import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '@shared/services/localStorage.service';

export function SuggestionFab() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const FORMSPREE_URL = 'https://formspree.io/f/mojvgnrp';
  const userName = useMemo(() => {
    try {
      if (typeof window === 'undefined') return '';
      return localStorage.getItem('app_user') || '';
    } catch {
      return '';
    }
  }, []);
  const userEmail = useMemo(() => {
    try {
      const profile = storage.getJSON<any>('profile_v1') || {};
      return profile?.email || '';
    } catch {
      return '';
    }
  }, []);
  const userRole = useMemo(() => {
    try {
      const profile = storage.getJSON<any>('profile_v1') || {};
      return profile?.role || '';
    } catch {
      return '';
    }
  }, []);
  const activeProject = useMemo(() => {
    try {
      if (typeof window === 'undefined') return null;
      const path = window.location.pathname || '';
      const match = path.match(/\/project\/([^/]+)/);
      const projectId = match?.[1];
      if (!projectId) return null;
      const projects = storage.getJSON<any[]>('projects_v1') || [];
      const found = (Array.isArray(projects) ? projects : []).find(
        p => String(p?.id) === String(projectId)
      );
      return found || null;
    } catch {
      return null;
    }
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    setSendError('');

    try {
      const formData = new FormData();
      formData.append('message', message.trim());
      formData.append('source', 'SetLux App');
      if (userName) formData.append('userName', userName);
      if (userEmail) formData.append('userEmail', userEmail);
      if (userRole) formData.append('userRole', userRole);
      if (activeProject?.id) formData.append('projectId', String(activeProject.id));
      if (activeProject?.nombre) formData.append('projectName', String(activeProject.nombre));
      if (typeof window !== 'undefined') {
        formData.append('page', window.location.href);
      }

      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Formspree error');
      }

      setSent(true);
      setMessage('');
      setTimeout(() => setSent(false), 1800);
      setIsOpen(false);
    } catch {
      setSendError(t('footer.sendError'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className='fixed bottom-4 right-4 z-50'>
        <button
          type='button'
          onClick={() => setIsOpen(v => !v)}
          className='px-2.5 py-1.5 rounded-full border border-neutral-border text-[10px] sm:text-xs shadow-md hover:border-[var(--hover-border)]'
          style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}
        >
          {t('footer.suggestions')}
        </button>
      </div>

      {isOpen && (
        <div className='fixed bottom-14 right-4 z-50 w-[260px] sm:w-[300px]'>
          <div
            className='rounded-lg border border-neutral-border bg-neutral-panel p-2 sm:p-3 shadow-lg'
            style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className='w-full min-h-[70px] rounded-md border border-neutral-border bg-transparent p-2 text-[10px] sm:text-xs placeholder:text-black dark:placeholder:text-white'
              placeholder={t('footer.suggestionsPlaceholder')}
            />
            <div className='mt-2 flex items-center justify-between gap-2'>
              <span className='text-[10px] sm:text-xs text-emerald-500'>
                {sent ? t('footer.thanks') : ' '}
              </span>
              {sendError && (
                <span className='text-[10px] sm:text-xs text-red-500'>
                  {sendError}
                </span>
              )}
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setIsOpen(false)}
                  className='px-2 py-1 rounded-md border border-neutral-border text-[10px] sm:text-xs'
                >
                  {t('footer.closeSuggestion')}
                </button>
                <button
                  type='button'
                  onClick={handleSend}
                  className='px-2 py-1 rounded-md border border-transparent text-[10px] sm:text-xs text-white disabled:opacity-60'
                  style={{ backgroundColor: 'var(--brand)' }}
                  disabled={isSending || !message.trim()}
                >
                  {isSending ? t('footer.sending') : t('footer.sendSuggestion')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
