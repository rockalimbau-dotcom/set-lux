import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClickOutsideMultiple } from '@shared/hooks/useClickOutside';
import { useTheme } from '@shared/hooks/useTheme';
import { Project, ProjectForm, ProjectMode } from '../types';
import { EditProjectModalProps, DropdownState, InputHoverState } from './EditProjectModal/EditProjectModalTypes';
import { EditProjectModalForm } from './EditProjectModal/EditProjectModalForm';
import { formatMode, getBorderStyles } from './EditProjectModal/EditProjectModalUtils';

export function EditProjectModal({ project, onClose, onSave }: EditProjectModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [form, setForm] = useState<ProjectForm>(() => ({
    nombre: project?.nombre || '',
    dop: project?.dop || '',
    almacen: project?.almacen || '',
    productora: project?.productora || '',
    estado: project?.estado || 'Activo',
    condicionesTipo: project?.conditions?.tipo || 'semanal',
    country: project?.country || 'ES',
    region: project?.region || 'CT',
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

  const handleSave = () => {
    if (!form.nombre.trim()) return;

    const updated: Project = {
      ...project,
      nombre: form.nombre.trim(),
      dop: form.dop,
      almacen: form.almacen,
      productora: form.productora,
      estado: form.estado,
      conditions: {
        ...(project?.conditions || {}),
        tipo: formatMode(form.condicionesTipo),
      },
      country: form.country || 'ES',
      region: form.region || 'CT',
    };

    onSave?.(updated);
    onClose?.();
  };

  return (
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
      <div className='w-full max-w-lg rounded-2xl border border-neutral-border bg-neutral-panel p-6'>
        <h3
          className='text-lg font-semibold mb-4'
          style={{ color: theme === 'light' ? '#0468BF' : '#F27405' }}
        >
          {t('common.editProject')}
        </h3>

        <EditProjectModalForm
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
            onClick={handleSave}
            type='button'
          >
            {t('common.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
}
