import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectMode, ProjectStatus } from '../../types';
import { FilterMenu } from './FilterMenu';
import { SortMenu } from './SortMenu';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: ProjectStatus | 'Todos';
  filterType: ProjectMode | 'Todos';
  onFilterStatusChange: (status: ProjectStatus | 'Todos') => void;
  onFilterTypeChange: (type: ProjectMode | 'Todos') => void;
  sortBy: 'nombre' | 'estado' | 'tipo';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: 'nombre' | 'estado' | 'tipo') => void;
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
  filterMenuOpen: boolean;
  sortMenuOpen: boolean;
  onFilterMenuToggle: () => void;
  onSortMenuToggle: () => void;
  hoveredFilterOption: string | null;
  hoveredSortOption: string | null;
  onHoverFilter: (option: string | null) => void;
  onHoverSort: (option: string | null) => void;
  filterMenuRef: React.RefObject<HTMLDivElement>;
  sortMenuRef: React.RefObject<HTMLDivElement>;
  isLight: boolean;
  focusColor: string;
}

export function SearchAndFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  filterType,
  onFilterStatusChange,
  onFilterTypeChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  filterMenuOpen,
  sortMenuOpen,
  onFilterMenuToggle,
  onSortMenuToggle,
  hoveredFilterOption,
  hoveredSortOption,
  onHoverFilter,
  onHoverSort,
  filterMenuRef,
  sortMenuRef,
  isLight,
  focusColor,
}: SearchAndFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className='flex flex-row items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4' style={{position: 'relative', zIndex: 1}}>
      <div className='flex-1 relative min-w-0'>
        <div className='absolute left-1.5 sm:left-2 md:left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 text-xs sm:text-sm md:text-base'>
          🔍
        </div>
        <input
          type='text'
          placeholder={t('common.searchPlaceholder')}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className='w-full pl-7 sm:pl-8 md:pl-10 lg:pl-12 pr-1.5 sm:pr-2 md:pr-3 lg:pr-4 py-1 sm:py-1.5 md:py-2 lg:py-3 rounded-md sm:rounded-lg md:rounded-xl border border-neutral-border focus:outline-none focus:ring-1 focus:ring-orange-500 hover:border-[var(--hover-border)] text-xs sm:text-sm md:text-base'
          style={{
            backgroundColor: 'var(--panel)',
            color: 'var(--text)',
            borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
          }}
        />
      </div>
      <div className='relative flex-shrink-0' ref={filterMenuRef}>
        <button
          onClick={() => {
            onFilterMenuToggle();
            if (sortMenuOpen) onSortMenuToggle();
          }}
          className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border border-neutral-border hover:border-[var(--hover-border)] transition text-[10px] sm:text-xs md:text-sm whitespace-nowrap'
          style={{
            backgroundColor: 'var(--panel)',
            color: 'var(--text)',
            borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
          }}
        >
          <span className='flex items-center gap-0.5 sm:gap-1 md:gap-2'>
            🔽 {t('common.filter')}
          </span>
        </button>
        
        {filterMenuOpen && (
          <FilterMenu
            filterStatus={filterStatus}
            filterType={filterType}
            onFilterStatusChange={onFilterStatusChange}
            onFilterTypeChange={onFilterTypeChange}
            onClose={() => onFilterMenuToggle()}
            hoveredOption={hoveredFilterOption}
            onHover={onHoverFilter}
            isLight={isLight}
            focusColor={focusColor}
          />
        )}
      </div>
      
      <div className='relative flex-shrink-0' ref={sortMenuRef}>
        <button
          onClick={() => {
            onSortMenuToggle();
            if (filterMenuOpen) onFilterMenuToggle();
          }}
          className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border border-neutral-border hover:border-[var(--hover-border)] transition text-[10px] sm:text-xs md:text-sm whitespace-nowrap'
          style={{
            backgroundColor: 'var(--panel)',
            color: 'var(--text)',
            borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
          }}
        >
          <span className='flex items-center gap-0.5 sm:gap-1 md:gap-2'>
            ↕️ {t('common.sort')}
          </span>
        </button>
        
        {sortMenuOpen && (
          <SortMenu
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={onSortByChange}
            onSortOrderChange={onSortOrderChange}
            onClose={() => onSortMenuToggle()}
            hoveredOption={hoveredSortOption}
            onHover={onHoverSort}
            isLight={isLight}
            focusColor={focusColor}
          />
        )}
      </div>
    </div>
  );
}

