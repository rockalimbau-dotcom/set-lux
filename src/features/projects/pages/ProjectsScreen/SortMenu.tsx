import { useTranslation } from 'react-i18next';

interface SortMenuProps {
  sortBy: 'nombre' | 'estado' | 'tipo';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: 'nombre' | 'estado' | 'tipo') => void;
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
  onClose: () => void;
  hoveredOption: string | null;
  onHover: (option: string | null) => void;
  isLight: boolean;
  focusColor: string;
}

export function SortMenu({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  onClose,
  hoveredOption,
  onHover,
  isLight,
  focusColor,
}: SortMenuProps) {
  const { t } = useTranslation();

  return (
    <div 
      className='absolute right-0 top-full mt-2 w-40 sm:w-48 md:w-56 rounded sm:rounded-md md:rounded-lg lg:rounded-xl shadow-lg border border-neutral-border py-1 sm:py-1.5 md:py-2 z-50'
      style={{
        backgroundColor: 'var(--panel)',
        borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
      }}
    >
      <div className='px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 border-b border-neutral-border' style={{borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'}}>
        <span className='text-xs sm:text-sm font-semibold' style={{color: 'var(--text)'}}>{t('common.sortBy')}</span>
      </div>
      <button
        onClick={() => {
          onSortByChange('nombre');
          onClose();
        }}
        onMouseEnter={() => onHover('nombre')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'nombre' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'nombre' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {sortBy === 'nombre' ? '✓ ' : '  '}{t('common.name')}
      </button>
      <button
        onClick={() => {
          onSortByChange('estado');
          onClose();
        }}
        onMouseEnter={() => onHover('estado')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'estado' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'estado' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {sortBy === 'estado' ? '✓ ' : '  '}{t('common.status')}
      </button>
      <button
        onClick={() => {
          onSortByChange('tipo');
          onClose();
        }}
        onMouseEnter={() => onHover('tipo')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'tipo' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'tipo' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {sortBy === 'tipo' ? '✓ ' : '  '}{t('common.type')}
      </button>
      
      <div className='px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 border-t border-neutral-border mt-1 sm:mt-1.5 md:mt-2' style={{borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'}}>
        <span className='text-xs sm:text-sm font-semibold' style={{color: 'var(--text)'}}>{t('common.sortOrder')}</span>
      </div>
      <button
        onClick={() => {
          onSortOrderChange('asc');
          onClose();
        }}
        onMouseEnter={() => onHover('asc')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'asc' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'asc' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {sortOrder === 'asc' ? '✓ ' : '  '}{t('common.ascending')}
      </button>
      <button
        onClick={() => {
          onSortOrderChange('desc');
          onClose();
        }}
        onMouseEnter={() => onHover('desc')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'desc' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'desc' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {sortOrder === 'desc' ? '✓ ' : '  '}{t('common.descending')}
      </button>
    </div>
  );
}

