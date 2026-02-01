import { Th, Td } from '@shared/components';
import React from 'react';
import { stripRoleSuffix } from '@shared/constants/roles';
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
    materialPropio: boolean;
  };
  showRowSelection: boolean;
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
  showRowSelection,
  isRowSelected,
  toggleRowSelection,
  received,
  setRcv,
  ROLE_COLORS,
  roleLabelFromCode,
  readOnly = false,
}: MonthSectionTableProps) {
  const { t } = useTranslation();

  // Calcular número de columnas para colSpan
  const colSpanCount =
    (showRowSelection ? 2 : 1) + // Checkbox (optional), Persona
    (hasWorkedDaysData ? 2 : 0) + // Días trabajados, Total días
    (hasLocalizacionData ? 2 : 0) + // Localización técnica, Total
    (hasCargaDescargaData ? 2 : 0) + // Carga/Descarga, Total
    (columnVisibility.holidays ? 2 : 0) + // Días festivos, Total
    (columnVisibility.travel ? 2 : 0) + // Travel Day, Total
    (columnVisibility.extras ? 2 : 0) + // Horas extra, Total
    (columnVisibility.materialPropio ? 2 : 0) + // Material propio, Total
    (columnVisibility.dietas ? 2 : 0) + // Dietas, Total
    (columnVisibility.transporte ? 2 : 0) + // Transportes, Total
    (columnVisibility.km ? 2 : 0) + // Kilometraje, Total
    2; // TOTAL BRUTO, Nómina recibida

  // Función para determinar el tipo de equipo de una fila
  const getTeamType = (r: any): 'base' | 'refuerzos' | 'prelight' | 'recogida' => {
    const originalRole = (r as any)._originalRole || r.role || '';
    const role = String(originalRole).toUpperCase();
    
    // Refuerzos: empiezan con REF y tienen más de 3 caracteres
    if (role.startsWith('REF') && role.length > 3) {
      return 'refuerzos';
    }
    
    // Prelight: termina con P o tiene workedPre > 0
    if (role.endsWith('P') || (r._workedPre && r._workedPre > 0 && r._workedBase === 0 && r._workedPick === 0)) {
      return 'prelight';
    }
    
    // Recogida: termina con R o tiene workedPick > 0
    if (role.endsWith('R') || (r._workedPick && r._workedPick > 0 && r._workedBase === 0 && r._workedPre === 0)) {
      return 'recogida';
    }
    
    // Base: el resto
    return 'base';
  };

  // Agrupar filas por tipo
  const groupedRows = React.useMemo(() => {
    const groups: { type: 'base' | 'refuerzos' | 'prelight' | 'recogida'; rows: any[] }[] = [
      { type: 'base', rows: [] },
      { type: 'refuerzos', rows: [] },
      { type: 'prelight', rows: [] },
      { type: 'recogida', rows: [] },
    ];

    enriched.forEach(r => {
      const type = getTeamType(r);
      const group = groups.find(g => g.type === type);
      if (group) {
        group.rows.push(r);
      }
    });

    // Filtrar grupos vacíos y mantener el orden
    return groups.filter(g => g.rows.length > 0);
  }, [enriched]);

  // Títulos de sección
  const sectionTitles: Record<string, string> = {
    base: t('team.baseTeam') || 'Equipo base',
    refuerzos: t('team.reinforcements') || 'Refuerzos',
    prelight: t('team.prelightTeam') || 'Equipo prelight',
    recogida: t('team.pickupTeam') || 'Equipo recogida',
  };

  // Componente para renderizar fila de título de sección
  const renderSectionHeader = (title: string) => (
    <tr key={`section-${title}`}>
      <Td
        colSpan={colSpanCount}
        className='bg-zinc-100/50 dark:bg-zinc-800/50 border-t border-b border-neutral-border'
      >
        <div className='px-2 py-1.5 sm:px-3 sm:py-2'>
          <span className='text-[10px] sm:text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide'>
            {title}
          </span>
        </div>
      </Td>
    </tr>
  );

  return (
    <div className='px-3 pb-3 sm:px-4 sm:pb-4 md:px-5 md:pb-5 overflow-x-auto' data-tutorial='payroll-table'>
      <table className='min-w-[800px] sm:min-w-[1000px] md:min-w-[1200px] w-full border-collapse text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>
        <thead>
          <tr>
            {showRowSelection && (
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
            )}
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
            {columnVisibility.materialPropio && <Th align='center'>{t('payroll.ownMaterial')}</Th>}
            {columnVisibility.materialPropio && <Th align='center'>{t('payroll.totalOwnMaterial')}</Th>}
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
          {groupedRows.map((group, groupIdx) => (
            <React.Fragment key={group.type}>
              {renderSectionHeader(sectionTitles[group.type])}
              {group.rows.map((r, idx) => {
                const pKey = `${r.role}__${r.name}`;
                let roleForColor = stripRoleSuffix(String(r.role || ''));
                // Si el rol empieza con REF (REFG, REFBB, etc.), usar el rol base para el color
                if (roleForColor.startsWith('REF') && roleForColor.length > 3) {
                  roleForColor = roleForColor.substring(3);
                }
                const col =
                  ROLE_COLORS[roleForColor] ||
                  ROLE_COLORS[roleLabelFromCode(roleForColor)] ||
                  (roleForColor === 'REF' || (r.role && r.role.startsWith('REF'))
                    ? { bg: '#F59E0B', fg: '#111' }
                    : { bg: '#444', fg: '#fff' });

                return (
                  <MonthSectionPersonRow
                    key={`${group.type}-${idx}`}
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
                    showRowSelection={showRowSelection}
                    readOnly={readOnly}
                  />
                );
              })}
            </React.Fragment>
          ))}

          {enriched.length === 0 && (
            <tr>
              <Td colSpan={
                (showRowSelection ? 6 : 5) + // Base columns (checkbox optional)
                (columnVisibility.holidays ? 2 : 0) + // Días festivos + Total días festivos
                (columnVisibility.travel ? 2 : 0) + // Travel Day + Total travel days
                (columnVisibility.extras ? 2 : 0) + // Horas extra + Total horas extra
                (columnVisibility.materialPropio ? 2 : 0) + // Material propio + Total
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

