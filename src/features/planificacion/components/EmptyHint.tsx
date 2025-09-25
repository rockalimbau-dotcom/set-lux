import React from 'react';

type EmptyHintProps = { text: string };

export default function EmptyHint({ text }: EmptyHintProps) {
  return (
    <div className='text-sm text-zinc-400 border border-dashed border-neutral-border rounded-xl p-4 bg-neutral-surface'>
      {text}
    </div>
  );
}
