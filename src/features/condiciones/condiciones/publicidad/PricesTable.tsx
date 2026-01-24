import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { PriceSection } from './PriceSection';

interface PricesTableProps {
  model: AnyRecord;
  setModel: (updater: (m: AnyRecord) => AnyRecord) => void;
  roles: string[];
  handlePriceChange: (sectionKey: 'base' | 'prelight' | 'pickup', role: string, header: string, value: string) => void;
  translateHeader: (header: string) => string;
  translateRoleName: (roleName: string, sectionKey?: 'base' | 'prelight' | 'pickup') => string;
  setRoleToDelete: (sectionKey: 'base' | 'prelight' | 'pickup', role: string | null) => void;
  addRole: (newRole: string) => void;
  readOnly: boolean;
}

export function PricesTable({
  model,
  setModel,
  roles,
  handlePriceChange,
  translateHeader,
  translateRoleName,
  setRoleToDelete,
  addRole,
  readOnly,
}: PricesTableProps) {
  const { t } = useTranslation();
  const hasPrelight = model.pricesPrelight !== undefined;
  const hasPickup = model.pricesPickup !== undefined;

  const addPrelightSection = () => {
    if (readOnly) return;
    setModel((m: AnyRecord) => ({
      ...m,
      pricesPrelight: m.pricesPrelight || {},
    }));
  };

  const addPickupSection = () => {
    if (readOnly) return;
    setModel((m: AnyRecord) => ({
      ...m,
      pricesPickup: m.pricesPickup || {},
    }));
  };

  const removePrelightSection = () => {
    if (readOnly) return;
    setModel((m: AnyRecord) => {
      const next = { ...m };
      delete next.pricesPrelight;
      return next;
    });
  };

  const removePickupSection = () => {
    if (readOnly) return;
    setModel((m: AnyRecord) => {
      const next = { ...m };
      delete next.pricesPickup;
      return next;
    });
  };

  return (
    <div className='space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6' data-tutorial='conditions-prices'>
      {/* Sección Equipo Base */}
      <PriceSection
        title={t('conditions.baseTeam')}
        sectionKey='base'
        model={model}
        roles={roles}
        handlePriceChange={handlePriceChange}
        translateHeader={translateHeader}
        translateRoleName={translateRoleName}
        setRoleToDelete={setRoleToDelete}
        addRole={addRole}
        readOnly={readOnly}
      />

      {/* Botones para añadir secciones */}
      <div className='flex items-center justify-end gap-2 sm:gap-3 flex-wrap'>
        {!hasPrelight && (
          <button
            onClick={addPrelightSection}
            disabled={readOnly}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1 text-[8px] sm:text-[9px] md:text-[10px] bg-brand text-white rounded sm:rounded-md md:rounded-lg hover:bg-brand/80 whitespace-nowrap ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ color: 'white' }}
            title={readOnly ? t('conditions.projectClosed') : t('conditions.addPrelightSection')}
          >
            {t('conditions.addPrelightSection')}
          </button>
        )}
        {!hasPickup && (
          <button
            onClick={addPickupSection}
            disabled={readOnly}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1 text-[8px] sm:text-[9px] md:text-[10px] bg-brand text-white rounded sm:rounded-md md:rounded-lg hover:bg-brand/80 whitespace-nowrap ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ color: 'white' }}
            title={readOnly ? t('conditions.projectClosed') : t('conditions.addPickupSection')}
          >
            {t('conditions.addPickupSection')}
          </button>
        )}
      </div>

      {/* Sección Equipo Prelight */}
      {hasPrelight && (
        <PriceSection
          title={t('conditions.prelightTeam')}
          sectionKey='prelight'
          model={model}
          roles={roles}
          handlePriceChange={handlePriceChange}
          translateHeader={translateHeader}
          translateRoleName={translateRoleName}
          setRoleToDelete={setRoleToDelete}
          addRole={addRole}
          onRemove={removePrelightSection}
          readOnly={readOnly}
        />
      )}

      {/* Sección Equipo Recogida */}
      {hasPickup && (
        <PriceSection
          title={t('conditions.pickupTeam')}
          sectionKey='pickup'
          model={model}
          roles={roles}
          handlePriceChange={handlePriceChange}
          translateHeader={translateHeader}
          translateRoleName={translateRoleName}
          setRoleToDelete={setRoleToDelete}
          addRole={addRole}
          onRemove={removePickupSection}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
