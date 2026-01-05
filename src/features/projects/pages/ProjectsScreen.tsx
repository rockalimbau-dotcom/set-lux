import { useClickOutsideMultiple } from '@shared/hooks/useClickOutside';
import { useRef, useState, useMemo, memo, useCallback } from 'react';
import { NewProjectModal } from '../components/NewProjectModal';
import { EditProjectModal } from '../components/EditProjectModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Project, ProjectMode, ProjectStatus, ProjectsScreenProps } from '../types';
import { ProjectsScreenHeader } from './ProjectsScreen/ProjectsScreenHeader';
import { SearchAndFilters } from './ProjectsScreen/SearchAndFilters';
import { ProjectsScreenContent } from './ProjectsScreen/ProjectsScreenContent';
import { useProjectsFilter } from './ProjectsScreen/useProjectsFilter';

/** Pantalla de Proyectos */
function ProjectsScreen({
  userName,
  projects,
  onCreateProject,
  onOpen,
  onUpdateProject,
  onDeleteProject,
  onPerfil,
  onConfig,
  onSalir,
}: ProjectsScreenProps) {
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'Todos'>('Todos');
  const [filterType, setFilterType] = useState<ProjectMode | 'Todos'>('Todos');
  const [sortBy, setSortBy] = useState<'nombre' | 'estado' | 'tipo'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [hoveredFilterOption, setHoveredFilterOption] = useState<string | null>(null);
  const [hoveredSortOption, setHoveredSortOption] = useState<string | null>(null);
  const hasProjects = projects.length > 0;
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useClickOutsideMultiple(
    [filterMenuRef, sortMenuRef],
    (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setFilterMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    },
    filterMenuOpen || sortMenuOpen
  );

  const handleOpen = useCallback((p: Project) => onOpen && onOpen(p), [onOpen]);
  
  // Filtrar y ordenar proyectos
  const filteredAndSortedProjects = useProjectsFilter(projects, {
    searchQuery,
    filterStatus,
    filterType,
    sortBy,
    sortOrder,
  });

  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const isLight = theme === 'light';
  const focusColor = isLight ? '#0476D9' : '#F27405';

  return (
    <>
      {/* Header moderno y prominente */}
      <ProjectsScreenHeader
        userName={userName}
        onNewProject={() => setShowNew(true)}
        onPerfil={onPerfil}
        onConfig={onConfig}
        onSalir={onSalir}
      />

      {/* Barra de búsqueda y filtros */}
      <div className='px-6 py-4' style={{backgroundColor: 'var(--bg)'}}>
        <div className='max-w-6xl mx-auto'>
          <SearchAndFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            filterType={filterType}
            onFilterStatusChange={setFilterStatus}
            onFilterTypeChange={setFilterType}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            filterMenuOpen={filterMenuOpen}
            sortMenuOpen={sortMenuOpen}
            onFilterMenuToggle={() => {
              setFilterMenuOpen(!filterMenuOpen);
              setSortMenuOpen(false);
            }}
            onSortMenuToggle={() => {
              setSortMenuOpen(!sortMenuOpen);
              setFilterMenuOpen(false);
            }}
            hoveredFilterOption={hoveredFilterOption}
            hoveredSortOption={hoveredSortOption}
            onHoverFilter={setHoveredFilterOption}
            onHoverSort={setHoveredSortOption}
            filterMenuRef={filterMenuRef}
            sortMenuRef={sortMenuRef}
            isLight={isLight}
            focusColor={focusColor}
          />
        </div>
      </div>

      {/* Grid de proyectos */}
      <ProjectsScreenContent
        projects={filteredAndSortedProjects}
        hasProjects={hasProjects}
        onOpen={handleOpen}
        onEdit={setEditing}
        onDelete={setProjectToDelete}
        userName={userName}
      />

      {/* Modal editar proyecto */}
      {editing && (
        <EditProjectModal
          project={editing}
          onClose={() => setEditing(null)}
          onSave={updated => {
            onUpdateProject?.(updated);
            setEditing(null);
          }}
        />
      )}

      {/* Modal crear proyecto */}
      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreate={proj => {
            onCreateProject(proj);
            setShowNew(false);
            onOpen && onOpen(proj);
          }}
        />
      )}

      {/* Modal confirmar eliminación */}
      {projectToDelete && (
        <DeleteConfirmModal
          project={projectToDelete}
          onClose={() => setProjectToDelete(null)}
          onConfirm={() => {
            onDeleteProject?.(projectToDelete.id);
            setProjectToDelete(null);
          }}
        />
      )}
    </>
  );
}

export default memo(ProjectsScreen);
