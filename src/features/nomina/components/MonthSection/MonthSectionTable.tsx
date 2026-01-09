import { Th, Td } from '@shared/components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MonthSectionPersonRow } from './MonthSectionPersonRow';

type MonthSectionTableProps = {
  enriched: any[];
  projectMode?: 'semanal' | 'mensual' | 'diario';
  hasWorkedDaysData: boolean;
  hasLocalizacionData: boolean;
  hasCargaDescargaData: boolean;
  columnVisibility: {
    holidays: boolean;
    travel: boolean;
    extras: boolean;
    transporte: boolean;
    km: boolean;
    dietas: boolean;
  };
  isRowSelected: (key: string) => boolean;
  toggleRowSelection: (key: string) => void;
  received: Record<string, { ok?: boolean; note?: string }>;
  setRcv: (key: string, patch: { ok?: boolean; note?: string }) => void;
  ROLE_COLORS: Record<string, { bg: string; fg: string }>;
  roleLabelFromCode: (code: string) => string;
  readOnly?: boolean;
};

export function MonthSectionTable({
  enriched,
  projectMode,
  hasWorkedDaysData,
  hasLocalizacionData,
  hasCargaDescargaData,
  columnVisibility,
  isRowSelected,
  toggleRowSelection,
  received,
  setRcv,
  ROLE_COLORS,
  roleLabelFromCode,
  readOnly = false,
}: MonthSectionTableProps) {
  const { t } = useTranslation();

  return (
    <div className='px-3 pb-3 sm:px-4 sm:pb-4 md:px-5 md:pb-5 overflow-x-auto'>
      <table className='min-w-[800px] sm:min-w-[1000px] md:min-w-[1200px] w-full border-collapse text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>
        <thead>
          <tr>
            <Th align='center'>
              <div className='flex justify-center'>
                <input
                  type='checkbox'
                  checked={enriched.length > 0 && enriched.every(r => {
                    const pKey = `${r.role}__${r.name}`;
                    return isRowSelected(pKey);
                  })}
                  onChange={e => {
                    if (readOnly) return;
                    if (e.target.checked) {
                      // Seleccionar todas
                      const allKeys = enriched.map(r => `${r.role}__${r.name}`);
                      enriched.forEach(r => {
                        const pKey = `${r.role}__${r.name}`;
                        if (!isRowSelected(pKey)) {
                          toggleRowSelection(pKey);
                        }
                      });
                    } else {
                      // Deseleccionar todas
                      enriched.forEach(r => {
                        const pKey = `${r.role}__${r.name}`;
                        if (isRowSelected(pKey)) {
                          toggleRowSelection(pKey);
                        }
                      });
                    }
                  }}
                  disabled={readOnly}
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  title={enriched.length > 0 && enriched.every(r => {
                    const pKey = `${r.role}__${r.name}`;
                    return isRowSelected(pKey);
                  }) ? t('payroll.deselectAll') : t('payroll.selectAll')}
                  className='accent-blue-500 dark:accent-[#f59e0b] cursor-pointer'
                />
              </div>
            </Th>
            <Th align='center'>{t('payroll.person')}</Th>
            {hasWorkedDaysData && <Th align='center'>{t('payroll.workedDays')}</Th>}
            {hasWorkedDaysData && <Th align='center'>{t('payroll.totalDays')}</Th>}
            {hasLocalizacionData && <Th align='center'>{t('payroll.localizacionTecnica')}</Th>}
            {hasLocalizacionData && <Th align='center'>{t('payroll.totalLocalizacionTecnica')}</Th>}
            {hasCargaDescargaData && <Th align='center'>{t('payroll.cargaDescarga')}</Th>}
            {hasCargaDescargaData && <Th align='center'>{t('payroll.totalCargaDescarga')}</Th>}
            {columnVisibility.holidays && <Th align='center'>{t('payroll.holidayDays')}</Th>}
            {columnVisibility.holidays && <Th align='center'>{t('payroll.totalHolidayDays')}</Th>}
            {columnVisibility.travel && <Th align='center'>{t('payroll.travelDays')}</Th>}
            {columnVisibility.travel && <Th align='center'>{t('payroll.totalTravelDays')}</Th>}
            {columnVisibility.extras && <Th align='center'>{t('payroll.extraHours')}</Th>}
            {columnVisibility.extras && <Th align='center'>{t('payroll.totalExtraHours')}</Th>}
            {columnVisibility.dietas && <Th align='center'>{t('payroll.dietas')}</Th>}
            {columnVisibility.dietas && <Th align='center'>{t('payroll.totalDietas')}</Th>}
            {columnVisibility.transporte && <Th align='center'>{t('payroll.transportes')}</Th>}
            {columnVisibility.transporte && <Th align='center'>{t('payroll.totalTransportes')}</Th>}
            {columnVisibility.km && <Th align='center'>{t('payroll.kilometraje')}</Th>}
            {columnVisibility.km && <Th align='center'>{t('payroll.totalKilometraje')}</Th>}
            <Th align='center'>{t('payroll.totalBruto')}</Th>
            <Th align='center'>{t('payroll.received')}</Th>
          </tr>
        </thead>
        <tbody>
          {enriched.map((r, idx) => {
            const pKey = `${r.role}__${r.name}`;
            const roleForColor = String(r.role || '').replace(/[PR]$/, '');
            const col =
              ROLE_COLORS[roleForColor] ||
              ROLE_COLORS[roleLabelFromCode(roleForColor)] ||
              (roleForColor === 'REF'
                ? { bg: '#F59E0B', fg: '#111' }
                : { bg: '#444', fg: '#fff' });

            return (
              <MonthSectionPersonRow
                key={idx}
                row={r}
                personKey={pKey}
                roleForColor={roleForColor}
                col={col}
                received={received}
                isSelected={isRowSelected(pKey)}
                toggleRowSelection={toggleRowSelection}
                setRcv={setRcv}
                projectMode={projectMode}
                hasWorkedDaysData={hasWorkedDaysData}
                hasLocalizacionData={hasLocalizacionData}
                hasCargaDescargaData={hasCargaDescargaData}
                columnVisibility={columnVisibility}
                readOnly={readOnly}
              />
            );
          })}

          {enriched.length === 0 && (
            <tr>
              <Td colSpan={
                6 + // Base columns: Checkbox, Persona, Días trabajados, Total días, TOTAL BRUTO, Nómina recibida
                (columnVisibility.holidays ? 2 : 0) + // Días festivos + Total días festivos
                (columnVisibility.travel ? 2 : 0) + // Travel Day + Total travel days
                (columnVisibility.extras ? 2 : 0) + // Horas extra + Total horas extra
                (columnVisibility.dietas ? 2 : 0) + // Dietas + Total dietas
                (columnVisibility.transporte ? 2 : 0) + // Transportes + Total transportes
                (columnVisibility.km ? 2 : 0) + // Kilometraje + Total kilometraje
                (hasLocalizacionData ? 2 : 0) + // Localización técnica + Total
                (hasCargaDescargaData ? 2 : 0) // Carga/Descarga + Total
              } align='center' className='text-center'>
                <div className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-zinc-400'>
                  {t('payroll.noDataThisMonth')}
                </div>
              </Td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

