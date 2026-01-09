// condiciones/diario.tsx
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useMemo, useState, memo } from 'react';
import { createPortal } from 'react-dom';
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
import { usePublicidadHandlers } from './publicidad/usePublicidadHandlers';
import { useExportRegistration } from './publicidad/useExportRegistration';
import { AnyRecord } from '@shared/types/common';

function CondicionesPublicidad({
  project,
  onChange = () => {},
  onRegisterExport,
  readOnly = false,
}: { 
  project: AnyRecord | null | undefined; 
  onChange?: (p: AnyRecord) => void;
  onRegisterExport?: (fn: () => void) => void;
  readOnly?: boolean;
}) {
  const { translateHeader, translateRoleName } = useDiarioTranslations();
  
  const storageKey = useMemo(() => {
    const base = (project as AnyRecord)?.id || (project as AnyRecord)?.nombre || 'tmp';
    return `cond_${base}_diario`;
  }, [project?.id, project?.nombre]);

  const [showParams, setShowParams] = useState(false);
  const [model, setModel] = useLocalStorage<AnyRecord>(storageKey, () =>
    loadOrSeedDiario(storageKey)
  );

  // Custom hooks
  useLanguageSync({ model, setModel });
  useModelPersistence({ storageKey, model });
  useModelSync({ model, onChange });

  const {
    setParam,
    setText,
    handlePriceChange,
    addRole,
    removeRole,
    roleToDelete,
    setRoleToDelete,
  } = useDiarioHandlers({ model, setModel });

  const roles = model.roles || PRICE_ROLES_DIARIO;

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
          roleName={roleToDelete}
          onClose={() => setRoleToDelete(null)}
          onConfirm={() => {
            if (roleToDelete) {
              removeRole(roleToDelete);
            }
          }}
        />,
        document.body
      )}
    </div>
  );
}

export default memo(CondicionesPublicidad);
