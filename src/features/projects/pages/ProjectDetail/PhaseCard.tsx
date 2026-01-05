import React from 'react';

interface PhaseCardProps {
  title: string;
  icon: React.ReactNode;
  desc: string;
  onClick: () => void;
}

export function PhaseCard({ title, icon, desc, onClick }: PhaseCardProps) {
  return (
    <button
      onClick={onClick}
      className='group text-left rounded-2xl border border-neutral-border p-6 transition hover:border-[var(--hover-border)]'
      style={{
        backgroundColor: 'var(--panel)',
        borderColor: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? 'rgba(229,231,235,0.6)' : 'var(--border)'
      }}
    >
      <div className='flex items-center gap-4 mb-2'>
        <div
          className='w-12 h-12 rounded-xl border border-neutral-border flex items-center justify-center text-2xl'
          style={{
            backgroundColor: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#ffffff' : 'rgba(0,0,0,0.2)'
          }}
        >
          {icon}
        </div>
        <div className='text-xl font-semibold' style={{color: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#0468BF' : '#F27405'}}>{title}</div>
      </div>
      <div className='text-sm' style={{color: (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')==='light') ? '#111827' : '#d1d5db'}}>{desc}</div>
    </button>
  );
}

