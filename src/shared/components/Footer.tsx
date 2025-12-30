import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer 
      className='fixed bottom-0 left-0 right-0 w-full py-2 border-t border-neutral-border z-10'
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div className='max-w-7xl mx-auto px-4 text-center text-xs text-zinc-400'>
        <p>
          © {currentYear} SetLux. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

