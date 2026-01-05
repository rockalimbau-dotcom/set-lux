import { useMemo } from 'react';
import { Project, ProjectMode, ProjectStatus } from '../../types';

export interface FilterState {
  searchQuery: string;
  filterStatus: ProjectStatus | 'Todos';
  filterType: ProjectMode | 'Todos';
  sortBy: 'nombre' | 'estado' | 'tipo';
  sortOrder: 'asc' | 'desc';
}

/**
 * Hook for filtering and sorting projects
 */
export function useProjectsFilter(
  projects: Project[],
  filterState: FilterState
) {
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Aplicar búsqueda
    if (filterState.searchQuery.trim()) {
      const query = filterState.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(query) ||
        (p.dop && p.dop.toLowerCase().includes(query)) ||
        (p.almacen && p.almacen.toLowerCase().includes(query)) ||
        (p.productora && p.productora.toLowerCase().includes(query))
      );
    }

    // Aplicar filtros
    if (filterState.filterStatus !== 'Todos') {
      filtered = filtered.filter(p => p.estado === filterState.filterStatus);
    }
    if (filterState.filterType !== 'Todos') {
      filtered = filtered.filter(p => p.conditions?.tipo === filterState.filterType);
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (filterState.sortBy === 'nombre') {
        comparison = a.nombre.localeCompare(b.nombre);
      } else if (filterState.sortBy === 'estado') {
        comparison = a.estado.localeCompare(b.estado);
      } else if (filterState.sortBy === 'tipo') {
        const tipoA = a.conditions?.tipo || 'semanal';
        const tipoB = b.conditions?.tipo || 'semanal';
        comparison = tipoA.localeCompare(tipoB);
      }
      
      return filterState.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [projects, filterState]);

  return filteredAndSortedProjects;
}

