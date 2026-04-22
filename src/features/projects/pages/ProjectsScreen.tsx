import { useClickOutsideMultiple } from '@shared/hooks/useClickOutside';
import { useRef, useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NewProjectModal } from '../components/NewProjectModal';
import { EditProjectModal } from '../components/EditProjectModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Project, ProjectMode, ProjectStatus, ProjectsScreenProps } from '../types';
import { ProjectsScreenHeader } from './ProjectsScreen/ProjectsScreenHeader';
import { SearchAndFilters } from './ProjectsScreen/SearchAndFilters';
import { ProjectsScreenContent } from './ProjectsScreen/ProjectsScreenContent';
import { useProjectsFilter } from './ProjectsScreen/useProjectsFilter';
import {
  exportProjectsCalendarToPDF,
  type CalendarExportRange,
  type CalendarExportScope,
} from '../utils/exportCalendarToPDF';

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
  const { t } = useTranslation();
  const [showNew, setShowNew] = useState(false);
  const [showCalendarPreview, setShowCalendarPreview] = useState(false);
  const [calendarRange, setCalendarRange] = useState<CalendarExportRange>(3);
  const [calendarScope, setCalendarScope] = useState<CalendarExportScope>('active');
  const [calendarExporting, setCalendarExporting] = useState(false);
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
  const handleNewProject = useCallback(() => {
    setShowNew(true);
    try {
      window.dispatchEvent(new CustomEvent('tutorial-new-project-opened'));
    } catch {}
  }, []);

  useEffect(() => {
    const handler = () => handleNewProject();
    window.addEventListener('tutorial-open-new-project', handler as EventListener);
    return () => window.removeEventListener('tutorial-open-new-project', handler as EventListener);
  }, [handleNewProject]);
  
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
  const calendarRangeOptions: Array<{ value: CalendarExportRange; label: string }> = [
    { value: 1, label: 'Mes actual' },
    { value: 3, label: '3 mesos' },
    { value: 6, label: '6 mesos' },
    { value: 12, label: '12 mesos' },
  ];
  const calendarScopeOptions: Array<{ value: CalendarExportScope; label: string }> = [
    { value: 'active', label: t('projects.calendarProjectsActive', { defaultValue: 'Només actius' }) },
    { value: 'all', label: t('projects.calendarProjectsAll', { defaultValue: 'Tots els projectes' }) },
  ];

  const handleExportCalendar = useCallback(async () => {
    try {
      setCalendarExporting(true);
      const ok = await exportProjectsCalendarToPDF({
        projects,
        range: calendarRange,
        scope: calendarScope,
      });
      if (!ok) {
        window.alert(
          t('projects.calendarNoProjectsToExport', {
            defaultValue: 'No hi ha projectes amb planificacio guardada dins del rang seleccionat.',
          })
        );
        return;
      }
      setShowCalendarPreview(false);
    } catch (error) {
      console.error('Error exporting projects calendar PDF:', error);
      window.alert(
        t('projects.calendarExportError', {
          defaultValue: 'Hi ha hagut un error en generar el PDF del calendari.',
        })
      );
    } finally {
      setCalendarExporting(false);
    }
  }, [calendarRange, calendarScope, projects, t]);

  return (
    <>
      {/* Header moderno y prominente */}
      <ProjectsScreenHeader
        userName={userName}
        onNewProject={handleNewProject}
        onPerfil={onPerfil}
        onConfig={onConfig}
        onSalir={onSalir}
      />

      {/* Barra de búsqueda y filtros */}
      <div className='px-5 sm:px-6 md:px-7 lg:px-8 xl:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4' style={{backgroundColor: 'var(--bg)'}}>
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
            onCalendarExport={() => setShowCalendarPreview(true)}
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

      {showCalendarPreview && (
        <div
          className='fixed inset-0 z-[120] flex items-center justify-center px-4'
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.35)' }}
          onClick={() => setShowCalendarPreview(false)}
        >
          <div
            className='w-full max-w-xl rounded-3xl border p-5 sm:p-6 shadow-2xl'
            style={{
              backgroundColor: 'var(--panel)',
              borderColor: isLight ? 'rgba(229,231,235,0.9)' : 'var(--border)',
              color: 'var(--text)',
            }}
            onClick={event => event.stopPropagation()}
          >
            <div className='flex items-start justify-between gap-4 mb-5'>
              <div>
                <div
                  className='inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold mb-3'
                  style={{
                    backgroundColor: isLight ? '#E8F4FD' : 'rgba(242,116,5,0.12)',
                    color: isLight ? '#0468BF' : '#FCD34D',
                  }}
                >
                  <span aria-hidden='true'>📅</span>
                  <span>{t('projects.calendarExport', { defaultValue: 'Calendari' })}</span>
                </div>
                <h2 className='text-lg sm:text-xl font-bold'>
                  {t('projects.calendarExportTitle', { defaultValue: 'Exportar calendari de projectes' })}
                </h2>
                <p className='mt-1 text-sm opacity-80'>
                  {t('projects.calendarExportDescription', {
                    defaultValue: 'Vista general mensual per veure projectes, buits i continuïtat de feina.',
                  })}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setShowCalendarPreview(false)}
                className='h-9 w-9 rounded-full border text-sm font-semibold transition-colors'
                style={{
                  borderColor: isLight ? 'rgba(229,231,235,0.9)' : 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                ×
              </button>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 mb-5'>
              <div className='rounded-2xl border p-4' style={{ borderColor: isLight ? '#dbe3ef' : 'var(--border)' }}>
                <div className='text-xs font-semibold uppercase tracking-wide opacity-70 mb-3'>
                  {t('projects.calendarRange', { defaultValue: 'Rang' })}
                </div>
                <div className='flex flex-wrap gap-2'>
                  {calendarRangeOptions.map(option => (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => setCalendarRange(option.value)}
                      className='rounded-full border px-3 py-1.5 text-xs font-semibold'
                      style={{
                        borderColor: option.value === calendarRange ? focusColor : (isLight ? '#dbe3ef' : 'var(--border)'),
                        backgroundColor: option.value === calendarRange
                          ? (isLight ? '#E8F4FD' : 'rgba(242,116,5,0.12)')
                          : 'transparent',
                        color: option.value === calendarRange ? focusColor : 'var(--text)',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className='rounded-2xl border p-4' style={{ borderColor: isLight ? '#dbe3ef' : 'var(--border)' }}>
                <div className='text-xs font-semibold uppercase tracking-wide opacity-70 mb-3'>
                  {t('projects.calendarProjects', { defaultValue: 'Projectes' })}
                </div>
                <div className='grid gap-2'>
                  {calendarScopeOptions.map(option => (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => setCalendarScope(option.value)}
                      className='rounded-2xl border px-3 py-2 text-sm font-medium text-left'
                      style={{
                        borderColor: option.value === calendarScope ? focusColor : (isLight ? '#dbe3ef' : 'var(--border)'),
                        backgroundColor: option.value === calendarScope
                          ? (isLight ? '#E8F4FD' : 'rgba(242,116,5,0.12)')
                          : (isLight ? '#fff' : 'rgba(255,255,255,0.03)'),
                        color: option.value === calendarScope ? focusColor : 'var(--text)',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className='rounded-[28px] border p-4 sm:p-5 mb-5 overflow-hidden'
              style={{
                borderColor: isLight ? '#dbe3ef' : 'var(--border)',
                background: isLight
                  ? 'linear-gradient(180deg, #fffdf8 0%, #fff7ed 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
              }}
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='text-sm font-semibold'>{t('projects.calendarPreview', { defaultValue: 'Previsualització' })}</div>
                <div className='text-xs opacity-70'>Març 2026</div>
              </div>
              <div className='grid grid-cols-7 gap-2 text-[11px] font-semibold opacity-70 mb-2'>
                {['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].map(day => (
                  <div key={day} className='text-center'>{day}</div>
                ))}
              </div>
              <div className='grid grid-cols-7 gap-2'>
                {Array.from({ length: 14 }).map((_, index) => {
                  const labels: Record<number, { text: string; color: string }> = {
                    2: { text: 'SPOT BCN', color: '#B3DDF2' },
                    3: { text: 'SPOT BCN', color: '#B3DDF2' },
                    4: { text: 'SPOT BCN', color: '#B3DDF2' },
                    8: { text: 'Descans', color: '#FDE68A' },
                    9: { text: 'Descans', color: '#FDE68A' },
                    11: { text: 'DOCU PARIS', color: '#93C5FD' },
                    12: { text: 'DOCU PARIS', color: '#93C5FD' },
                    13: { text: 'DOCU PARIS', color: '#93C5FD' },
                  };
                  const chip = labels[index];
                  return (
                    <div
                      key={index}
                      className='min-h-[72px] rounded-2xl border p-2'
                      style={{
                        borderColor: isLight ? '#e8edf5' : 'rgba(255,255,255,0.08)',
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div className='text-[11px] font-semibold mb-2 opacity-80'>{index + 10}</div>
                      {chip && (
                        <div
                          className='rounded-xl px-2 py-1 text-[10px] font-semibold truncate'
                          style={{ backgroundColor: chip.color, color: '#0f172a' }}
                        >
                          {chip.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className='flex items-center justify-end gap-3'>
              <button
                type='button'
                onClick={() => setShowCalendarPreview(false)}
                className='rounded-xl border px-4 py-2 text-sm font-semibold'
                style={{
                  borderColor: isLight ? '#dbe3ef' : 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {t('common.cancel', { defaultValue: 'Cancelar' })}
              </button>
              <button
                type='button'
                onClick={handleExportCalendar}
                disabled={calendarExporting}
                className='rounded-xl px-4 py-2 text-sm font-semibold text-white'
                style={{
                  backgroundColor: isLight ? '#0468BF' : 'var(--brand)',
                  opacity: calendarExporting ? 0.7 : 1,
                }}
              >
                {calendarExporting
                  ? t('common.loading', { defaultValue: 'Generant...' })
                  : t('projects.exportPdf', { defaultValue: 'Exportar PDF' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(ProjectsScreen);
