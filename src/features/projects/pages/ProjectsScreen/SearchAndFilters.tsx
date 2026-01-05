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
    <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4' style={{position: 'relative', zIndex: 1}}>
      <div className='flex-1 relative'>
        <div className='absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400'>
          🔍
        </div>
        <input
          type='text'
          placeholder={t('common.searchPlaceholder')}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className='w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-border focus:outline-none focus:ring-1 focus:ring-orange-500 hover:border-[var(--hover-border)]'
          style={{
            backgroundColor: 'var(--panel)',
            color: 'var(--text)',
            borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
          }}
        />
      </div>
      <div className='relative' ref={filterMenuRef}>
        <button
          onClick={() => {
            onFilterMenuToggle();
            if (sortMenuOpen) onSortMenuToggle();
          }}
          className='px-4 py-3 rounded-xl border border-neutral-border hover:border-[var(--hover-border)] transition'
          style={{
            backgroundColor: 'var(--panel)',
            color: 'var(--text)',
            borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
          }}
        >
          <span className='flex items-center gap-2'>
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
      
      <div className='relative' ref={sortMenuRef}>
        <button
          onClick={() => {
            onSortMenuToggle();
            if (filterMenuOpen) onFilterMenuToggle();
          }}
          className='px-4 py-3 rounded-xl border border-neutral-border hover:border-[var(--hover-border)] transition'
          style={{
            backgroundColor: 'var(--panel)',
            color: 'var(--text)',
            borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)'
          }}
        >
          <span className='flex items-center gap-2'>
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

