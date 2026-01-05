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
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
      <div className='w-full max-w-lg rounded-2xl border border-neutral-border bg-neutral-panel p-6'>
        <h3
          className='text-lg font-semibold mb-4'
          style={{ color: theme === 'light' ? '#0468BF' : '#F27405' }}
        >
          {t('common.newProject')}
        </h3>

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

        <div className='flex justify-end gap-3 mt-6'>
          <button
            className={`inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold border transition-colors ${
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
            className='inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-white transition shadow-lg hover:shadow-xl'
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
