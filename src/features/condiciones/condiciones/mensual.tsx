import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect, useMemo, useState, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { AnyRecord } from '@shared/types/common';
import { loadOrSeed, updateDynamicFestivos } from './mensual/mensualData';
import { DeleteRoleConfirmModal } from './publicidad/DeleteRoleConfirmModal';
import { ParametersSection } from './mensual/ParametersSection';
import { PricesTable } from './mensual/PricesTable';
import { InfoSections } from './mensual/InfoSections';
import { useMensualTranslations } from './mensual/mensualHelpers';
import { useMensualDefaults } from './mensual/useMensualDefaults';
import { useMensualLanguageSync } from './mensual/useMensualLanguageSync';
import { useMensualModel } from './mensual/useMensualModel';
import { useMensualRoles } from './mensual/useMensualRoles';
import { useMensualExport } from './mensual/useMensualExport';

interface CondicionesMensualProps {
  project: AnyRecord | null | undefined;
  onChange?: (payload: AnyRecord) => void;
  onRegisterExport?: (fn: () => void) => void;
  readOnly?: boolean;
}

function CondicionesMensual({ project, onChange = () => {}, onRegisterExport, readOnly = false }: CondicionesMensualProps) {
  const { t } = useTranslation();
  const { translateHeader, translateRoleName } = useMensualTranslations();
  
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'tmp';
    return `cond_${base}_mensual`;
  }, [project?.id, project?.nombre]);

  useEffect(() => {
    updateDynamicFestivos();
  }, []);

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

  useMensualModel({ model, onChange });

  const [roleToDelete, setRoleToDelete] = useState<{ sectionKey: 'base' | 'prelight' | 'pickup'; role: string } | null>(null);

  const setText = (key: string, value: string) => setModel((m: AnyRecord) => ({ ...m, [key]: value }));

  const setParam = (key: string, value: string) =>
    setModel((m: AnyRecord) => ({ ...m, params: { ...(m.params || {}), [key]: value } }));

  const { roles, addRole, removeRole, handleRoleChange } = useMensualRoles({ model, setModel });
  
  const handleSetRoleToDelete = (sectionKey: 'base' | 'prelight' | 'pickup', role: string | null) => {
    if (role === null) {
      setRoleToDelete(null);
    } else {
      setRoleToDelete({ sectionKey, role });
    }
  };

  useMensualExport({ project, model, roles, onRegisterExport });

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
        handleRoleChange={handleRoleChange}
        translateHeader={translateHeader}
        translateRoleName={translateRoleName}
        setRoleToDelete={handleSetRoleToDelete}
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
