import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect, useMemo, useState, memo } from 'react';
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

  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  const setText = (key: string, value: string) => setModel((m: AnyRecord) => ({ ...m, [key]: value }));

  const setParam = (key: string, value: string) =>
    setModel((m: AnyRecord) => ({ ...m, params: { ...(m.params || {}), [key]: value } }));

  const { roles, addRole, removeRole, handleRoleChange } = useMensualRoles({ model, setModel });

  useMensualExport({ project, model, roles, onRegisterExport });

  return (
    <div className='space-y-6'>
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
        handleRoleChange={handleRoleChange}
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

export default memo(CondicionesMensual);
