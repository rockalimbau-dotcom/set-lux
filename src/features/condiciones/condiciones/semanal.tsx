import { useMemo, useState, memo } from 'react';
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

  const roles = model.roles || PRICE_ROLES;

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
