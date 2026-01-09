import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClickOutsideMultiple } from '@shared/hooks/useClickOutside';
import { useTheme } from '@shared/hooks/useTheme';
import { Project, ProjectForm } from '../types';
import { NewProjectModalForm } from './NewProjectModal/NewProjectModalForm';
import { DropdownState, InputHoverState } from './EditProjectModal/EditProjectModalTypes';
import { getBorderStyles } from './EditProjectModal/EditProjectModalUtils';

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (project: Project) => void;
}

export function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [form, setForm] = useState<ProjectForm>(() => ({
    nombre: '',
    dop: '',
    almacen: '',
    productora: '',
    estado: 'Activo',
    condicionesTipo: 'semanal',
    country: 'ES',
    region: 'CT',
  }));

  // Estados para los dropdowns
  const [estadoDropdown, setEstadoDropdown] = useState<DropdownState>({
    isOpen: false,
    isButtonHovered: false,
    hoveredOption: null,
  });
  const [condicionesDropdown, setCondicionesDropdown] = useState<DropdownState>({
    isOpen: false,
    isButtonHovered: false,
    hoveredOption: null,
  });
  const [paisDropdown, setPaisDropdown] = useState<DropdownState>({
    isOpen: false,
    isButtonHovered: false,
    hoveredOption: null,
  });
  const [regionDropdown, setRegionDropdown] = useState<DropdownState>({
    isOpen: false,
    isButtonHovered: false,
    hoveredOption: null,
  });

  // Estados para el hover de los inputs
  const [inputHovered, setInputHovered] = useState<InputHoverState>({
    proyecto: false,
    dop: false,
    almacen: false,
    productora: false,
  });

  // Estado para el hover del botón Cancelar
  const [cancelButtonHovered, setCancelButtonHovered] = useState(false);

  const estadoRef = useRef<HTMLDivElement>(null);
  const condicionesRef = useRef<HTMLDivElement>(null);
  const paisRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer clic fuera
  useClickOutsideMultiple(
    [estadoRef, condicionesRef, paisRef, regionRef],
    (event) => {
      if (estadoRef.current && !estadoRef.current.contains(event.target as Node)) {
        setEstadoDropdown(prev => ({ ...prev, isOpen: false }));
      }
      if (condicionesRef.current && !condicionesRef.current.contains(event.target as Node)) {
        setCondicionesDropdown(prev => ({ ...prev, isOpen: false }));
      }
      if (paisRef.current && !paisRef.current.contains(event.target as Node)) {
        setPaisDropdown(prev => ({ ...prev, isOpen: false }));
      }
      if (regionRef.current && !regionRef.current.contains(event.target as Node)) {
        setRegionDropdown(prev => ({ ...prev, isOpen: false }));
      }
    }
  );

  const handleCreate = () => {
    if (!form.nombre.trim()) return;
    const proj: Project = {
      id: crypto.randomUUID(),
      nombre: form.nombre,
      dop: form.dop,
      almacen: form.almacen,
      productora: form.productora,
      estado: form.estado,
      conditions: {
        tipo: form.condicionesTipo || 'mensual',
      },
      country: form.country || 'ES',
      region: form.region || 'CT',
    };
    onCreate(proj);
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-6 sm:p-6 md:p-6 z-50 overflow-y-auto'>
      <div className='w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-xs xl:max-w-sm 2xl:max-w-md rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 2xl:p-6 my-auto max-h-[75vh] sm:max-h-[80vh] overflow-y-auto'>
        <h3
          className='text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4'
          style={{ color: theme === 'light' ? '#0468BF' : '#F27405' }}
        >
          {t('common.newProject')}
        </h3>

        <div className='max-h-[calc(75vh-80px)] sm:max-h-[calc(80vh-100px)] overflow-y-auto'>
          <NewProjectModalForm
            form={form}
            setForm={setForm}
            theme={theme}
            estadoDropdown={estadoDropdown}
            setEstadoDropdown={setEstadoDropdown}
            condicionesDropdown={condicionesDropdown}
            setCondicionesDropdown={setCondicionesDropdown}
            paisDropdown={paisDropdown}
            setPaisDropdown={setPaisDropdown}
            regionDropdown={regionDropdown}
            setRegionDropdown={setRegionDropdown}
            inputHovered={inputHovered}
            setInputHovered={setInputHovered}
            estadoRef={estadoRef}
            condicionesRef={condicionesRef}
            paisRef={paisRef}
            regionRef={regionRef}
          />
        </div>

        <div className='flex justify-end gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 mt-1.5 sm:mt-2 md:mt-3 lg:mt-4 xl:mt-6'>
          <button
            className={`inline-flex items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl font-semibold border transition-colors text-[9px] sm:text-[10px] md:text-xs lg:text-sm ${
              theme === 'light' ? 'text-gray-900' : 'text-zinc-300'
            }`}
            style={getBorderStyles(cancelButtonHovered, theme)}
            onMouseEnter={() => setCancelButtonHovered(true)}
            onMouseLeave={() => setCancelButtonHovered(false)}
            onClick={onClose}
            type='button'
          >
            {t('common.cancel')}
          </button>
          <button
            className='inline-flex items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl font-semibold text-white transition shadow-lg hover:shadow-xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm'
            style={{
              backgroundColor: theme === 'light' ? '#0468BF' : 'var(--brand)',
              borderColor: theme === 'light' ? '#0468BF' : 'var(--brand)',
            }}
            onClick={handleCreate}
            type='button'
          >
            {t('common.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
