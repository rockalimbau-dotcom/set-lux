import { useTranslation } from 'react-i18next';
import { ProjectMode, ProjectStatus } from '../../types';

interface FilterMenuProps {
  filterStatus: ProjectStatus | 'Todos';
  filterType: ProjectMode | 'Todos';
  onFilterStatusChange: (status: ProjectStatus | 'Todos') => void;
  onFilterTypeChange: (type: ProjectMode | 'Todos') => void;
  onClose: () => void;
  hoveredOption: string | null;
  onHover: (option: string | null) => void;
  isLight: boolean;
  focusColor: string;
}

export function FilterMenu({
  filterStatus,
  filterType,
  onFilterStatusChange,
  onFilterTypeChange,
  onClose,
  hoveredOption,
  onHover,
  isLight,
  focusColor,
}: FilterMenuProps) {
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
        <span className='text-xs sm:text-sm font-semibold' style={{color: 'var(--text)'}}>{t('common.status')}</span>
      </div>
      <button
        onClick={() => {
          onFilterStatusChange('Todos');
          onClose();
        }}
        onMouseEnter={() => onHover('Todos')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: 'var(--text)',
          backgroundColor: hoveredOption === 'Todos' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {filterStatus === 'Todos' ? '✓ ' : '  '}{t('common.all')}
      </button>
      <button
        onClick={() => {
          onFilterStatusChange('Activo');
          onClose();
        }}
        onMouseEnter={() => onHover('Activo')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'Activo' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'Activo' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {filterStatus === 'Activo' ? '✓ ' : '  '}{t('common.active')}
      </button>
      <button
        onClick={() => {
          onFilterStatusChange('Cerrado');
          onClose();
        }}
        onMouseEnter={() => onHover('Cerrado')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'Cerrado' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'Cerrado' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {filterStatus === 'Cerrado' ? '✓ ' : '  '}{t('common.closed')}
      </button>
      
      <div className='px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 border-t border-neutral-border mt-1 sm:mt-1.5 md:mt-2' style={{borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'}}>
        <span className='text-xs sm:text-sm font-semibold' style={{color: 'var(--text)'}}>{t('common.type')}</span>
      </div>
      <button
        onClick={() => {
          onFilterTypeChange('Todos');
          onClose();
        }}
        onMouseEnter={() => onHover('Todos-Tipo')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'Todos-Tipo' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'Todos-Tipo' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {filterType === 'Todos' ? '✓ ' : '  '}{t('common.all')}
      </button>
      <button
        onClick={() => {
          onFilterTypeChange('semanal');
          onClose();
        }}
        onMouseEnter={() => onHover('semanal')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'semanal' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'semanal' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {filterType === 'semanal' ? '✓ ' : '  '}{t('common.weekly')}
      </button>
      <button
        onClick={() => {
          onFilterTypeChange('mensual');
          onClose();
        }}
        onMouseEnter={() => onHover('mensual')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'mensual' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'mensual' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {filterType === 'mensual' ? '✓ ' : '  '}{t('common.monthly')}
      </button>
      <button
        onClick={() => {
          onFilterTypeChange('diario');
          onClose();
        }}
        onMouseEnter={() => onHover('diario')}
        onMouseLeave={() => onHover(null)}
        className='w-full text-left px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm transition-colors'
        style={{
          color: hoveredOption === 'diario' 
            ? (isLight ? '#111827' : 'white')
            : 'var(--text)',
          backgroundColor: hoveredOption === 'diario' 
            ? (isLight ? '#A0D3F2' : focusColor)
            : 'transparent',
        }}
      >
        {filterType === 'diario' ? '✓ ' : '  '}{t('common.advertising')}
      </button>
    </div>
  );
}

