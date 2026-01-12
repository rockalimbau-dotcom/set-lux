import React from 'react';
import { useTranslation } from 'react-i18next';
import { translateDietItem } from './ReportPersonRowsHelpers';

interface DietasItemsListProps {
  items: Set<string>;
  ticket: number | null;
  readOnly: boolean;
  onRemoveItem: (item: string) => void;
  onRemoveTicket: () => void;
  onTicketChange: (value: string) => void;
}

export function DietasItemsList({
  items,
  ticket,
  readOnly,
  onRemoveItem,
  onRemoveTicket,
  onTicketChange,
}: DietasItemsListProps) {
  const { t } = useTranslation();

  return (
    <div className='flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 justify-center'>
      {Array.from(items)
        .filter(it => it !== 'Ticket')
        .map(it => (
          <span
            key={it}
            className='inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded sm:rounded-md md:rounded-lg border border-neutral-border bg-black/40'
            title={translateDietItem(it, t)}
          >
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-200'>
              {translateDietItem(it, t)}
            </span>
            <button
              type='button'
              className={`text-zinc-400 hover:text-red-500 text-[9px] sm:text-[10px] md:text-xs ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => onRemoveItem(it)}
              disabled={readOnly}
              title={readOnly ? t('conditions.projectClosed') : t('reports.remove')}
            >
              ×
            </button>
          </span>
        ))}

      {items.has('Ticket') && (
        <span
          className='inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded sm:rounded-md md:rounded-lg border border-neutral-border bg-black/40'
          title={t('reports.dietOptions.ticket')}
        >
          <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-200'>
            {t('reports.dietOptions.ticket')}
          </span>
          <input
            type='number'
            min='0'
            step='0.01'
            placeholder='€'
            className={`w-16 sm:w-20 md:w-24 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs lg:text-sm ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            value={ticket ?? ''}
            onChange={e => onTicketChange((e.target as HTMLInputElement).value)}
            disabled={readOnly}
            readOnly={readOnly}
            title={readOnly ? t('conditions.projectClosed') : t('reports.ticketAmount')}
          />
          <button
            type='button'
            className={`text-zinc-400 hover:text-red-500 text-[9px] sm:text-[10px] md:text-xs ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={onRemoveTicket}
            disabled={readOnly}
            title={readOnly ? t('conditions.projectClosed') : t('reports.removeTicket')}
          >
            ×
          </button>
        </span>
      )}
    </div>
  );
}

