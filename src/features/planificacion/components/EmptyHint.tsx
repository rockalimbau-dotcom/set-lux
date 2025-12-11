import React from 'react';

type EmptyHintProps = { text: string };

export default function EmptyHint({ text }: EmptyHintProps) {
  return (
    <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
      <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
      {text}
      </h2>
      <p className='text-xl max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
        Pulsa el botón "+ Semana" para añadir una semana.
      </p>
    </div>
  );
}
