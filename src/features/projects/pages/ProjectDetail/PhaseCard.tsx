import React from 'react';

interface PhaseCardProps {
  title: string;
  icon: React.ReactNode;
  desc: string;
  onClick: () => void;
  tutorialId?: string;
}

export function PhaseCard({ title, icon, desc, onClick, tutorialId }: PhaseCardProps) {
  return (
    <button
      onClick={onClick}
      data-tutorial={tutorialId}
      className='group text-left rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 transition hover:border-[var(--hover-border)]'
      style={{
        backgroundColor: 'var(--panel)',
        borderColor: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? 'rgba(229,231,235,0.6)' : 'var(--border)'
      }}
    >
      <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 mb-0.5 sm:mb-1 md:mb-1.5 lg:mb-2'>
        <div
          className='w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border border-neutral-border flex items-center justify-center text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl'
          style={{
            backgroundColor: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#ffffff' : 'rgba(0,0,0,0.2)'
          }}
        >
          {icon}
        </div>
        <div className='text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold' style={{color: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#0468BF' : '#F27405'}}>{title}</div>
      </div>
      <div className='text-[10px] sm:text-xs md:text-sm' style={{color: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#111827' : '#d1d5db'}}>{desc}</div>
    </button>
  );
}

