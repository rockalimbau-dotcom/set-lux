import React from 'react';
import { Td } from '@shared/components';
import { useTranslation } from 'react-i18next';
import { SiNoCellProps } from './ReportPersonRowsTypes';

const SiNoCell: React.FC<SiNoCellProps> = ({
  pKey,
  concepto,
  fecha,
  val,
  cellClasses,
  readOnly,
  off,
  setCell,
}) => {
  const { t } = useTranslation();
  // Determinar si el checkbox está checked basándose en si el valor es "Sí", "SI" o "SÍ"
  const isChecked = val && (val.toString().trim().toLowerCase() === 'sí' || val.toString().trim().toLowerCase() === 'si');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || off) return;
    // Si está checked, poner "Sí" (traducido), si no, poner vacío
    // Guardamos en español para compatibilidad con el backend, pero mostramos traducido
    setCell(pKey, concepto, fecha, e.target.checked ? 'Sí' : '');
  };

  return (
    <Td key={`${pKey}_${concepto}_${fecha}`} className={`text-center ${cellClasses}`} align='center'>
      <div className='w-full flex justify-center items-center'>
        <input
          type='checkbox'
          checked={isChecked}
          onChange={handleChange}
          disabled={off || readOnly}
          className={`accent-blue-500 dark:accent-[#f59e0b] ${off || readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={readOnly ? t('conditions.projectClosed') : (off ? t('reports.notWorkingThisDay') : (isChecked ? t('reports.uncheck') : t('reports.check')))}
        />
      </div>
    </Td>
  );
};

export default SiNoCell;
