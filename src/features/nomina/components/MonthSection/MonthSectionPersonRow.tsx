import { Td } from '@shared/components';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getRoleBadgeCode, applyGenderToBadge } from '@shared/constants/roles';
import { stripRoleSuffix } from '@shared/constants/roles';
import { displayValue, displayMoney } from '../../utils/displayHelpers';
import WorkedDaysSummary from '../WorkedDaysSummary.tsx';
import CargaDescargaSummary from '../CargaDescargaSummary.tsx';
import ExtrasSummary from '../ExtrasSummary.jsx';
import DietasSummary from '../DietasSummary.jsx';

type MonthSectionPersonRowProps = {
  row: any;
  personKey: string;
  roleForColor: string;
  col: { bg: string; fg: string };
  roleLabelFromCode: (code: string) => string;
  received: Record<string, { ok?: boolean; note?: string; irpf?: number; estado?: number; extraHoursPercent?: number }>;
  irpfByPerson: Record<string, number>;
  isSelected: boolean;
  toggleRowSelection: (key: string) => void;
  setRcv: (key: string, patch: { ok?: boolean; note?: string; irpf?: number; estado?: number; extraHoursPercent?: number }) => void;
  projectMode?: 'semanal' | 'mensual' | 'diario';
  hasWorkedDaysData: boolean;
  hasHalfDaysData: boolean;
  hasLocalizacionData: boolean;
  hasCargaDescargaData: boolean;
  columnVisibility: {
    holidays: boolean;
    travel: boolean;
    extras: boolean;
    transporte: boolean;
    km: boolean;
    gasolina: boolean;
    dietas: boolean;
    materialPropio: boolean;
  };
  showRowSelection: boolean;
  showNetColumns: boolean;
  showExtraHoursPercentColumn: boolean;
  readOnly?: boolean;
};

export function MonthSectionPersonRow({
  row: r,
  personKey: pKey,
  roleForColor,
  col,
  roleLabelFromCode,
  received,
  irpfByPerson,
  isSelected,
  toggleRowSelection,
  setRcv,
  projectMode,
  hasWorkedDaysData,
  hasHalfDaysData,
  hasLocalizacionData,
  hasCargaDescargaData,
  columnVisibility,
  showRowSelection,
  showNetColumns,
  showExtraHoursPercentColumn,
  readOnly = false,
}: MonthSectionPersonRowProps) {
  const { t, i18n } = useTranslation();
  const rc = (received as any)[pKey] || { ok: false, note: '' };
  const irpfPercent =
    rc.irpf === undefined || rc.irpf === null || rc.irpf === ''
      ? Number(irpfByPerson[pKey] || 0)
      : Number(rc.irpf);
  const estadoPercent =
    rc.estado === undefined || rc.estado === null || rc.estado === ''
      ? 6.6
      : Number(rc.estado);
  const extraHoursPercent =
    rc.extraHoursPercent === undefined || rc.extraHoursPercent === null || rc.extraHoursPercent === ''
      ? 4.7
      : Number(rc.extraHoursPercent);
  const totalBruto = Number(r._totalBruto || 0);
  const totalExtras = Number(r._totalExtras || 0);
  const totalNeto =
    totalBruto -
    totalBruto * irpfPercent / 100 -
    totalBruto * estadoPercent / 100 -
    totalExtras * extraHoursPercent / 100;

  // Detectar el tema actual
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
      }
    };

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Colores uniformes basados en tema: Best Boy en claro, Eléctrico en oscuro
  const roleBgColor = theme === 'light' 
    ? 'linear-gradient(135deg,#60A5FA,#0369A1)' // Color de Best Boy (más oscuro)
    : 'linear-gradient(135deg,#FDE047,#F59E0B)'; // Color de Eléctrico
  const roleFgColor = theme === 'light' ? 'white' : '#000000'; // Blanco en claro, negro en oscuro

  // Calcular el código del badge usando el rol original (preservado para REFs)
  const roleForBadge = (r as any)._originalRole || r.role || '';
  const roleCodeRaw = getRoleBadgeCode(roleForBadge, i18n.language) || '';
  const roleCode = applyGenderToBadge(roleCodeRaw, (r as any).gender);
  // Para refuerzos (REFG, REFGP, etc.) y roles con sufijos (GP, GR) usar ancho adaptativo
  const isLongCode = roleCode.length > 3 || roleCode.startsWith('REF') || roleCode.endsWith('P') || roleCode.endsWith('R');
  // Aumentar min-w para códigos largos como REFE, REFBB, etc.
  const badgeWidthClass = isLongCode
    ? 'min-w-[32px] sm:min-w-[36px] md:min-w-[40px] px-2 sm:px-2.5 md:px-3'
    : 'w-4 sm:w-5 md:w-6';

  const materialPropioType =
    (r as any)._materialPropioType === 'unico'
      ? 'unico'
      : (r as any)._materialPropioType === 'diario'
      ? 'diario'
      : 'semanal';
  const materialPropioCount =
    materialPropioType === 'unico'
      ? ((r as any)._materialPropioUnique || 0)
      : materialPropioType === 'semanal'
      ? ((r as any)._materialPropioWeeks || 0)
      : ((r as any)._materialPropioDays || 0);
  const materialPropioLabel =
    materialPropioCount > 0
      ? materialPropioType === 'unico'
        ? t('common.unique')
        : `${materialPropioCount} ${materialPropioType === 'semanal' ? 'semanas' : 'días'}`
      : '';

  const roleVariants = React.useMemo(() => {
    const variants = Array.isArray((r as any)._roleVariants) ? (r as any)._roleVariants : [];
    const seen = new Set<string>();
    return variants
      .map((variant: any) => {
        const rawRole = String(variant?.originalRole || variant?.role || r.role || '').trim();
        const roleCode = stripRoleSuffix(rawRole);
        const label =
          String(variant?.roleLabel || '').trim() ||
          roleLabelFromCode(roleCode) ||
          rawRole;
        return {
          key: `${variant?.roleId || rawRole}__${label}`,
          label,
          totalBruto: Number(variant?.totalBruto || 0),
        };
      })
      .filter((variant: { key: string; label: string }) => {
        if (!variant.label || seen.has(variant.key)) return false;
        seen.add(variant.key);
        return true;
      });
  }, [r, roleLabelFromCode]);

  return (
    <tr>
      {showRowSelection && (
        <Td align='middle' className='payroll-sticky-checkbox-col'>
          <div className='flex justify-center'>
            <input
              type='checkbox'
              checked={isSelected}
              onChange={() => !readOnly && toggleRowSelection(pKey)}
              disabled={readOnly}
              title={readOnly ? t('conditions.projectClosed') : (isSelected ? t('payroll.deselectForExport') : t('payroll.selectForExport'))}
              className={`accent-blue-500 dark:accent-[#f59e0b] ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            />
          </div>
        </Td>
      )}
      <Td className='payroll-sticky-first-col whitespace-nowrap align-middle'>
        <div className='flex items-start gap-1 sm:gap-1.5 md:gap-2'>
          <span
            className='inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded sm:rounded-md md:rounded-lg border border-neutral-border bg-black/40'
            title={`${r.role} - ${r.name}`}
          >
            <span
              className={`inline-flex items-center justify-center h-3.5 sm:h-4 md:h-5 rounded sm:rounded-md md:rounded-lg font-bold text-[8px] sm:text-[9px] md:text-[10px] ${badgeWidthClass}`}
              style={{ 
                background: roleBgColor, 
                color: roleFgColor,
                WebkitTextFillColor: roleFgColor,
                textFillColor: roleFgColor
              } as React.CSSProperties}
              >
                {roleCode || '—'}
              </span>
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-200'>{r.name}</span>
          </span>
          {roleVariants.length > 1 && (
            <div className='flex flex-col items-start gap-0.5 text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400'>
              {roleVariants.map((variant: { key: string; label: string; totalBruto: number }) => (
                <span key={variant.key} className='whitespace-normal leading-tight'>
                  {variant.label}: {displayMoney(variant.totalBruto, 2)}
                </span>
              ))}
            </div>
          )}
        </div>
      </Td>

      {hasWorkedDaysData && (
        <Td align='middle' className='text-center'>
          <div className='flex flex-col items-center'>
            {r._worked > 0 && (
              <div className='text-right font-medium text-zinc-100 mb-0.5 sm:mb-1 text-[9px] sm:text-[10px] md:text-xs'>{r._worked}</div>
            )}
            <WorkedDaysSummary
              carga={projectMode === 'diario' ? 0 : (r._carga || 0)}
              descarga={projectMode === 'diario' ? 0 : (r._descarga || 0)}
              localizar={r._localizar || 0}
              showLocalizar={projectMode !== 'diario'}
              rodaje={r._rodaje || 0}
              pruebasCamara={r._pruebasCamara || 0}
              oficina={r._oficina || 0}
              prelight={r._prelight || 0}
              recogida={r._recogida || 0}
            />
          </div>
        </Td>
      )}
      {hasWorkedDaysData && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.jornada ? (
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalDias, 2)}</span>
          )}
        </Td>
      )}
      {hasHalfDaysData && (
        <Td align='middle' className='text-center'>
          <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayValue(r._halfDays)}</span>
        </Td>
      )}
      {hasHalfDaysData && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.halfJornada ? (
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalHalfDays, 2)}</span>
          )}
        </Td>
      )}

      {hasLocalizacionData && (
        <Td align='middle' className='text-center'>
          <span className='text-[9px] sm:text-[10px] md:text-xs'>{r._localizarDays > 0 ? r._localizarDays : '—'}</span>
        </Td>
      )}
      {hasLocalizacionData && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.localizacionTecnica ? (
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalLocalizacion, 2)}</span>
          )}
        </Td>
      )}

      {hasCargaDescargaData && (
        <Td align='middle' className='text-center'>
          <div className='flex flex-col items-center'>
            {(r._cargaDays || 0) + (r._descargaDays || 0) > 0 && (
              <div className='text-right font-medium text-zinc-100 mb-0.5 sm:mb-1 text-[9px] sm:text-[10px] md:text-xs'>
                {(r._cargaDays || 0) + (r._descargaDays || 0)}
              </div>
            )}
            <CargaDescargaSummary
              carga={r._cargaDays || 0}
              descarga={r._descargaDays || 0}
            />
          </div>
        </Td>
      )}
      {hasCargaDescargaData && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.cargaDescarga ? (
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalCargaDescarga, 2)}</span>
          )}
        </Td>
      )}

      {columnVisibility.holidays && <Td align='middle' className='text-center'><span className='text-[9px] sm:text-[10px] md:text-xs'>{displayValue(r._holidays)}</span></Td>}
      {columnVisibility.holidays && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.holidayDay ? (
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalHolidays, 2)}</span>
          )}
        </Td>
      )}

      {columnVisibility.travel && <Td align='middle' className='text-center'><span className='text-[9px] sm:text-[10px] md:text-xs'>{displayValue(r._travel)}</span></Td>}
      {columnVisibility.travel && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.travelDay ? (
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalTravel, 2)}</span>
          )}
        </Td>
      )}

      {columnVisibility.extras && (
        <Td align='middle' className='text-center'>
          <div className='flex justify-center'>
          <ExtrasSummary
            horasExtra={r.horasExtra}
            turnAround={r.turnAround}
            nocturnidad={r.nocturnidad}
            penaltyLunch={r.penaltyLunch}
          />
          </div>
        </Td>
      )}
      {columnVisibility.extras && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.horaExtra ? (
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalExtras, 2)}</span>
          )}
        </Td>
      )}

      {columnVisibility.materialPropio && (
        <Td align='middle' className='text-center'>
          <span className='text-[9px] sm:text-[10px] md:text-xs'>{materialPropioLabel}</span>
        </Td>
      )}
      {columnVisibility.materialPropio && (
        <Td align='middle' className='text-center'>
          <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalMaterialPropio, 2)}</span>
        </Td>
      )}

      {columnVisibility.dietas && (
        <Td align='middle' className='text-center'>
          <div className='flex justify-center'>
          <DietasSummary
            dietasCount={r.dietasCount}
            ticketTotal={r.ticketTotal}
            otherTotal={r.otherTotal}
          />
          </div>
        </Td>
      )}
      {columnVisibility.dietas && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.dietas ? (
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalDietas, 2)}</span>
          )}
        </Td>
      )}

      {columnVisibility.transporte && <Td align='middle' className='text-center'><span className='text-[9px] sm:text-[10px] md:text-xs'>{displayValue(r.transporte)}</span></Td>}
      {columnVisibility.transporte && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.transporte ? (
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalTrans, 2)}</span>
          )}
        </Td>
      )}

      {columnVisibility.km && <Td align='middle' className='text-center'><span className='text-[9px] sm:text-[10px] md:text-xs'>{displayValue(r.km, 1)}</span></Td>}
      {columnVisibility.km && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.km ? (
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalKm, 2)}</span>
          )}
        </Td>
      )}

      {columnVisibility.gasolina && (
        <Td align='middle' className='text-center'>
          <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalGasolina, 2)}</span>
        </Td>
      )}

      <Td align='middle' className='text-center font-semibold'>
        <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(r._totalBruto, 2)}</span>
      </Td>

      {showNetColumns && (
        <Td align='middle' className='text-center payroll-extra-col'>
          <div className='flex items-center justify-center gap-1'>
            <input
              type='number'
              min='0'
              max='100'
              step='0.1'
              value={rc.irpf ?? irpfByPerson[pKey] ?? ''}
              onChange={e => !readOnly && setRcv(pKey, { irpf: e.target.value === '' ? 0 : Number(e.target.value) })}
              disabled={readOnly}
              readOnly={readOnly}
              className={`w-14 sm:w-16 md:w-20 px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs text-right ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={readOnly ? t('conditions.projectClosed') : t('payroll.irpfPercent')}
            />
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>%</span>
          </div>
        </Td>
      )}

      {showNetColumns && (
        <Td align='middle' className='text-center payroll-extra-col'>
          <div className='flex items-center justify-center gap-1'>
            <input
              type='number'
              min='0'
              max='100'
              step='0.1'
              value={rc.estado ?? 6.6}
              onChange={e => !readOnly && setRcv(pKey, { estado: e.target.value === '' ? 0 : Number(e.target.value) })}
              disabled={readOnly}
              readOnly={readOnly}
              className={`w-14 sm:w-16 md:w-20 px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs text-right ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={readOnly ? t('conditions.projectClosed') : t('payroll.statePercent')}
            />
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>%</span>
          </div>
        </Td>
      )}

      {showExtraHoursPercentColumn && (
        <Td align='middle' className='text-center payroll-extra-col'>
          <div className='flex items-center justify-center gap-1'>
            <input
              type='number'
              min='0'
              max='100'
              step='0.1'
              value={rc.extraHoursPercent ?? 4.7}
              onChange={e => !readOnly && setRcv(pKey, { extraHoursPercent: e.target.value === '' ? undefined : Number(e.target.value) })}
              disabled={readOnly}
              readOnly={readOnly}
              className={`w-14 sm:w-16 md:w-20 px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs text-right ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={readOnly ? t('conditions.projectClosed') : t('payroll.extraHoursPercentTitle')}
            />
            <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>%</span>
          </div>
        </Td>
      )}

      {showNetColumns && (
        <Td align='middle' className='text-center font-semibold'>
          <span className='text-[9px] sm:text-[10px] md:text-xs'>{displayMoney(totalNeto, 2)}</span>
        </Td>
      )}

      <Td align='middle' className='text-center'>
        <div className='flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2'>
          <input
            type='checkbox'
            checked={!!rc.ok}
            onChange={e => !readOnly && setRcv(pKey, { ok: e.target.checked })}
            disabled={readOnly}
            className={`w-3 h-3 sm:w-4 sm:h-4 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : t('payroll.markAsReceived')}
          />
          <input
            type='text'
            placeholder={t('payroll.notePlaceholder')}
            value={rc.note || ''}
            onChange={e => !readOnly && setRcv(pKey, { note: e.target.value })}
            disabled={readOnly}
            readOnly={readOnly}
            size={rc.note ? Math.max(10, Math.min(rc.note.length + 2, 30)) : 15}
            className={`min-w-[60px] max-w-[200px] px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : t('payroll.noteTitle')}
          />
        </div>
      </Td>
    </tr>
  );
}
