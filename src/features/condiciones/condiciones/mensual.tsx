import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect, useMemo, useState, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { AnyRecord } from '@shared/types/common';
import { loadOrSeed, updateDynamicFestivos } from './mensual/mensualData';
import { PRICE_ROLES } from './shared.constants';
import { DeleteRoleConfirmModal } from './publicidad/DeleteRoleConfirmModal';
import { ParametersSection } from './mensual/ParametersSection';
import { PricesTable } from './mensual/PricesTable';
import { InfoSections } from './mensual/InfoSections';
import { useMensualTranslations } from './mensual/mensualHelpers';
import { normalizeConditionModel } from './roleCatalog';
import { useMensualDefaults } from './mensual/useMensualDefaults';
import { useMensualLanguageSync } from './mensual/useMensualLanguageSync';
import { useMensualModel } from './mensual/useMensualModel';
import { useMensualRoles } from './mensual/useMensualRoles';
import { useMensualExport } from './mensual/useMensualExport';
import type { CustomConditionSection } from './shared';
import type { CondicionesExportSections } from '../utils/exportPDF';

interface CondicionesMensualProps {
  project: AnyRecord | null | undefined;
  onChange?: (payload: AnyRecord) => void;
  onRegisterExport?: (fn: (sections?: Partial<CondicionesExportSections>) => void) => void;
  readOnly?: boolean;
}

function CondicionesMensual({ project, onChange = () => {}, onRegisterExport, readOnly = false }: CondicionesMensualProps) {
  const { t } = useTranslation();
  const { translateHeader, translateRoleName } = useMensualTranslations(project);
  
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'tmp';
    return `cond_${base}_mensual`;
  }, [project?.id, project?.nombre]);
  const projectModel = (project as AnyRecord)?.conditions?.mensual as AnyRecord | undefined;
  const normalizedProjectModel = useMemo(
    () => (projectModel ? normalizeConditionModel(project, projectModel, PRICE_ROLES, true) : null),
    [project, projectModel]
  );

  useEffect(() => {
    updateDynamicFestivos();
  }, []);

  const [showParams, setShowParams] = useState(false);
  const [pendingScrollSectionId, setPendingScrollSectionId] = useState<string | null>(null);
  const [syncReady, setSyncReady] = useState(() => !normalizedProjectModel);
  const [model, setModel] = useLocalStorage<AnyRecord>(storageKey, () =>
    normalizeConditionModel(project, projectModel || loadOrSeed(storageKey), PRICE_ROLES, true)
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

    const normalizedModel = normalizeConditionModel(project, model, PRICE_ROLES, true);
    if (JSON.stringify(normalizedModel) === JSON.stringify(model)) return;
    setModel(() => normalizedModel);
  }, [model, project, storageKey, setModel]);

  const {
    getDefaultLegend,
    getDefaultHorarios,
    getDefaultDietas,
    getDefaultTransportes,
    getDefaultAlojamiento,
    getDefaultPrepro,
    getDefaultConvenio,
  } = useMensualDefaults();

  useMensualLanguageSync({
    model,
    setModel,
    getDefaultLegend,
    getDefaultHorarios,
    getDefaultDietas,
    getDefaultTransportes,
    getDefaultAlojamiento,
    getDefaultPrepro,
    getDefaultConvenio,
  });

  useMensualModel({ model, onChange, enabled: syncReady });

  const [roleToDelete, setRoleToDelete] = useState<{ sectionKey: 'base' | 'prelight' | 'pickup'; role: string } | null>(null);

  const setText = (key: string, value: string) => setModel((m: AnyRecord) => ({ ...m, [key]: value }));
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

  const setParam = (key: string, value: string) =>
    setModel((m: AnyRecord) => ({ ...m, params: { ...(m.params || {}), [key]: value } }));

  const { roles, addRole, removeRole, handleRoleChange } = useMensualRoles({ project, model, setModel });
  
  const handleSetRoleToDelete = (sectionKey: 'base' | 'prelight' | 'pickup', role: string | null) => {
    if (role === null) {
      setRoleToDelete(null);
    } else {
      setRoleToDelete({ sectionKey, role });
    }
  };

  useMensualExport({ project, model, roles, onRegisterExport });

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
        handleRoleChange={handleRoleChange}
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

export default memo(CondicionesMensual);
