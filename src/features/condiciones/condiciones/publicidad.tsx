// condiciones/diario.tsx
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useMemo, useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useDiarioTranslations } from './publicidad/publicidadHelpers';
import { loadOrSeedDiario } from './publicidad/publicidadData';
import { PRICE_ROLES_DIARIO } from './publicidad/publicidadConstants';
import { DeleteRoleConfirmModal } from './publicidad/DeleteRoleConfirmModal';
import { ParametersSection } from './publicidad/ParametersSection';
import { PricesTable } from './publicidad/PricesTable';
import { InfoSections } from './publicidad/InfoSections';
import { useLanguageSync } from './publicidad/useLanguageSync';
import { useModelPersistence } from './publicidad/useModelPersistence';
import { useModelSync } from './publicidad/useModelSync';
import { useDiarioHandlers } from './publicidad/usePublicidadHandlers';
import { useExportRegistration } from './publicidad/useExportRegistration';
import { AnyRecord } from '@shared/types/common';
import type { CondicionesExportSections } from '../utils/exportPDF';
import type { CustomConditionSection } from './shared';
import { normalizeConditionModel } from './roleCatalog';

function CondicionesPublicidad({
  project,
  onChange = () => {},
  onRegisterExport,
  readOnly = false,
}: { 
  project: AnyRecord | null | undefined; 
  onChange?: (p: AnyRecord) => void;
  onRegisterExport?: (fn: (sections?: Partial<CondicionesExportSections>) => void) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const { translateHeader, translateRoleName } = useDiarioTranslations(project);
  
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'tmp';
    return `cond_${base}_diario`;
  }, [project?.id, project?.nombre]);
  const projectModel = (project as AnyRecord)?.conditions?.diario as AnyRecord | undefined;
  const normalizedProjectModel = useMemo(
    () => (projectModel ? normalizeConditionModel(project, projectModel, PRICE_ROLES_DIARIO, true) : null),
    [project, projectModel]
  );

  const [showParams, setShowParams] = useState(false);
  const [pendingScrollSectionId, setPendingScrollSectionId] = useState<string | null>(null);
  const [syncReady, setSyncReady] = useState(() => !normalizedProjectModel);
  const [model, setModel] = useLocalStorage<AnyRecord>(storageKey, () =>
    normalizeConditionModel(project, projectModel || loadOrSeedDiario(storageKey), PRICE_ROLES_DIARIO, true)
  );

  useEffect(() => {
    if (!normalizedProjectModel) {
      setSyncReady(true);
      return;
    }
    if (JSON.stringify(normalizedProjectModel) === JSON.stringify(model)) {
      setSyncReady(true);
      return;
    }
    setSyncReady(false);
    setModel(() => normalizedProjectModel);
  }, [model, normalizedProjectModel, setModel]);

  // Sincronizar roles con prices inmediatamente después de cargar
  // IMPORTANTE: Esto debe ejecutarse siempre para asegurar que prices tenga entradas para todos los roles
  // Similar a como funciona en diario, donde prices siempre tiene valores desde loadOrSeedDiario
  const syncedKeyRef = useRef<string>('');
  useEffect(() => {
    if (!model) return;
    if (syncedKeyRef.current !== storageKey) syncedKeyRef.current = storageKey;

    const normalizedModel = normalizeConditionModel(project, model, PRICE_ROLES_DIARIO, true);
    if (JSON.stringify(normalizedModel) === JSON.stringify(model)) return;
    setModel(() => normalizedModel);
  }, [model, project, storageKey, setModel]);

  // Custom hooks
  useLanguageSync({ model, setModel });
  useModelPersistence({ storageKey, model });
  useModelSync({ model, onChange, enabled: syncReady });

  const {
    setParam,
    setText,
    handlePriceChange,
    addRole,
    removeRole,
    roleToDelete,
    setRoleToDelete,
  } = useDiarioHandlers({ project, model, setModel });

  const customSections = (Array.isArray(model.customSections) ? model.customSections : []) as CustomConditionSection[];
  const createCustomSection = (): CustomConditionSection => ({
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: t('conditions.customSectionDefaultTitle'),
    content: '',
  });
  const addCustomSection = () => {
    const newSection = createCustomSection();
    setPendingScrollSectionId(newSection.id);
    setModel((m: AnyRecord) => ({
      ...m,
      customSections: [...(Array.isArray(m.customSections) ? m.customSections : []), newSection],
    }));
  };
  const updateCustomSection = (id: string, patch: Partial<CustomConditionSection>) =>
    setModel((m: AnyRecord) => ({
      ...m,
      customSections: (Array.isArray(m.customSections) ? m.customSections : []).map((section: CustomConditionSection) =>
        section.id === id ? { ...section, ...patch } : section
      ),
    }));
  const removeCustomSection = (id: string) =>
    setModel((m: AnyRecord) => ({
      ...m,
      customSections: (Array.isArray(m.customSections) ? m.customSections : []).filter(
        (section: CustomConditionSection) => section.id !== id
      ),
    }));
  
  const handleSetRoleToDelete = (sectionKey: 'base' | 'prelight' | 'pickup', role: string | null) => {
    if (role === null) {
      setRoleToDelete(null);
    } else {
      setRoleToDelete({ sectionKey, role });
    }
  };

  // IMPORTANTE: Solo usar roles del modelo si tiene elementos, sino usar Gaffer y Eléctrico
  // Esto asegura que la tabla base siempre muestre estos dos roles
  const roles = (model.roles && Array.isArray(model.roles) && model.roles.length > 0) 
    ? model.roles 
    : ['Gaffer', 'Eléctrico'];

  useExportRegistration({
    project,
    model,
    roles,
    onRegisterExport,
  });

  useEffect(() => {
    if (!pendingScrollSectionId) return;
    if (!customSections.some(section => section.id === pendingScrollSectionId)) return;

    const scrollToSection = () => {
      const element = document.querySelector(`[data-custom-section-id="${pendingScrollSectionId}"]`);
      if (element instanceof HTMLElement) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const input = element.querySelector('input, textarea') as HTMLElement | null;
        input?.focus();
        setPendingScrollSectionId(null);
      }
    };

    const timeoutId = window.setTimeout(scrollToSection, 80);
    return () => window.clearTimeout(timeoutId);
  }, [customSections, pendingScrollSectionId]);

  return (
    <div className='space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6'>
      <ParametersSection
        showParams={showParams}
        setShowParams={setShowParams}
        params={model.params || {}}
        setParam={setParam}
        readOnly={readOnly}
      />

      <PricesTable
        project={project}
        model={model}
        setModel={setModel}
        roles={roles}
        handlePriceChange={handlePriceChange}
        translateHeader={translateHeader}
        translateRoleName={translateRoleName}
        setRoleToDelete={handleSetRoleToDelete}
        addRole={addRole}
        readOnly={readOnly}
      />

      <div className='flex justify-end'>
        <button
          type='button'
          onClick={addCustomSection}
          disabled={readOnly}
          className={`btn-export-conditions rounded px-3 py-1.5 text-xs font-semibold ${
            readOnly ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          {t('conditions.addCustomSection')}
        </button>
      </div>

      <InfoSections
        model={model}
        setText={setText}
        customSections={customSections}
        onUpdateCustomSection={updateCustomSection}
        onRemoveCustomSection={removeCustomSection}
        readOnly={readOnly}
      />

      {roleToDelete && typeof document !== 'undefined' && createPortal(
        <DeleteRoleConfirmModal
          roleName={translateRoleName(roleToDelete.role, roleToDelete.sectionKey)}
          onClose={() => setRoleToDelete(null)}
          onConfirm={() => {
            if (roleToDelete) {
              removeRole(roleToDelete.sectionKey, roleToDelete.role);
              setRoleToDelete(null);
            }
          }}
        />,
        document.body
      )}
    </div>
  );
}

export default memo(CondicionesPublicidad);
