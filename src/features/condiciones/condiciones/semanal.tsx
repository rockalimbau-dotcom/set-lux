import { useMemo, useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useSemanalTranslations } from './semanal/semanalHelpers';
import { loadOrSeed } from './semanal/semanalData';
import { PRICE_ROLES } from './shared.constants';
import { DeleteRoleConfirmModal } from './publicidad/DeleteRoleConfirmModal';
import { ParametersSection } from './semanal/ParametersSection';
import { PricesTable } from './semanal/PricesTable';
import { InfoSections } from './semanal/InfoSections';
import { useLanguageSync } from './semanal/useLanguageSync';
import { useModelSync } from './semanal/useModelSync';
import { useSemanalHandlers } from './semanal/useSemanalHandlers';
import { useExportRegistration } from './semanal/useExportRegistration';
import { AnyRecord } from '@shared/types/common';

interface CondicionesSemanalProps {
  project: { id?: string; nombre?: string };
  onChange?: (patch: any) => void;
  onRegisterExport?: (fn: () => void) => void;
  readOnly?: boolean;
}

function CondicionesSemanal({ project, onChange = () => {}, onRegisterExport, readOnly = false }: CondicionesSemanalProps) {
  const { translateHeader, translateRoleName } = useSemanalTranslations();
  
  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `cond_${base}_semanal`;
  }, [project?.id, project?.nombre]);

  const [showParams, setShowParams] = useState(false);
  const [model, setModel] = useLocalStorage<AnyRecord>(storageKey, () =>
    loadOrSeed(storageKey)
  );
  
  // Sincronizar roles con prices inmediatamente después de cargar
  // IMPORTANTE: Esto debe ejecutarse siempre para asegurar que prices tenga entradas para todos los roles
  // Similar a como funciona en diario, donde prices siempre tiene valores desde loadOrSeedDiario
  const syncedKeyRef = useRef<string>('');
  useEffect(() => {
    if (!model) return;
    
    // Resetear el ref si cambió el storageKey (nuevo proyecto)
    if (syncedKeyRef.current !== storageKey) {
      syncedKeyRef.current = storageKey;
    } else {
      // Si ya sincronizamos para este storageKey, solo verificar si necesita sincronización
      // pero no ejecutar de nuevo para evitar loops
      const currentRoles = model.roles && Array.isArray(model.roles) && model.roles.length > 0 
        ? model.roles 
        : ['Gaffer', 'Eléctrico'];
      
      const currentPrices = model.prices || {};
      const allRolesHavePrices = currentRoles.every((role: string) => currentPrices[role] !== undefined);
      
      // Si todos los roles tienen precios, no hacer nada
      if (allRolesHavePrices && currentRoles.length > 0) return;
    }
    
    const currentRoles = model.roles && Array.isArray(model.roles) && model.roles.length > 0 
      ? model.roles 
      : ['Gaffer', 'Eléctrico'];
    
    const currentPrices = model.prices || {};
    let needsSync = false;
    const syncedPrices = { ...currentPrices };
    
    // Inicializar precios vacíos para todos los roles del equipo base
    // Esto es crítico: asegurar que prices tenga entradas para Gaffer y Eléctrico
    for (const role of currentRoles) {
      if (!syncedPrices[role]) {
        syncedPrices[role] = {};
        needsSync = true;
      }
    }
    
    // Verificar si roles está vacío o mal formado
    const needsRolesSync = !model.roles || !Array.isArray(model.roles) || model.roles.length === 0;
    
    // Si necesita sincronización, actualizar el modelo
    if (needsSync || needsRolesSync) {
      setModel((m: AnyRecord) => ({ 
        ...m, 
        roles: currentRoles,
        prices: syncedPrices 
      }));
      syncedKeyRef.current = storageKey;
    }
  }, [model, storageKey, setModel]); // Ejecutar cuando cambie el modelo o el proyecto

  // Custom hooks
  useLanguageSync({ model, setModel });
  useModelSync({ model, onChange });

  const {
    setParam,
    setText,
    handlePriceChange,
    addRole,
    removeRole,
    roleToDelete,
    setRoleToDelete: setRoleToDeleteInternal,
  } = useSemanalHandlers({ model, setModel });

  const setRoleToDelete = (sectionKey: 'base' | 'prelight' | 'pickup', role: string | null) => {
    if (role) {
      setRoleToDeleteInternal({ sectionKey, role });
    } else {
      setRoleToDeleteInternal(null);
    }
  };

  // Para el dropdown, necesitamos usar model.roles si existe y tiene elementos, sino usar los roles por defecto
  // IMPORTANTE: Si model.roles es un array vacío [], también usar PRICE_ROLES como fallback
  // Esto asegura que siempre haya roles para mostrar en la tabla base
  const roles = (model.roles && Array.isArray(model.roles) && model.roles.length > 0)
    ? model.roles 
    : ['Gaffer', 'Eléctrico']; // Usar solo los roles del equipo base, no todos los PRICE_ROLES

  useExportRegistration({
    project,
    model,
    roles,
    onRegisterExport,
  });

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
        model={model}
        setModel={setModel}
        roles={roles}
        handlePriceChange={handlePriceChange}
        translateHeader={translateHeader}
        translateRoleName={translateRoleName}
        setRoleToDelete={setRoleToDelete}
        addRole={addRole}
        readOnly={readOnly}
      />

      <InfoSections
        model={model}
        setText={setText}
        readOnly={readOnly}
      />

      {roleToDelete && typeof document !== 'undefined' && createPortal(
        <DeleteRoleConfirmModal
          roleName={roleToDelete.role}
          onClose={() => setRoleToDelete(roleToDelete.sectionKey, null)}
          onConfirm={() => {
            if (roleToDelete) {
              removeRole(roleToDelete.sectionKey, roleToDelete.role);
              setRoleToDelete(roleToDelete.sectionKey, null);
            }
          }}
        />,
        document.body
      )}
    </div>
  );
}

export default memo(CondicionesSemanal);
