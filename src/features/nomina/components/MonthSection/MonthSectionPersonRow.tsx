import { Td } from '@shared/components';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getRoleBadgeCode } from '@shared/constants/roles';
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
  received: Record<string, { ok?: boolean; note?: string }>;
  isSelected: boolean;
  toggleRowSelection: (key: string) => void;
  setRcv: (key: string, patch: { ok?: boolean; note?: string }) => void;
  projectMode?: 'semanal' | 'mensual' | 'publicidad';
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
  readOnly?: boolean;
};

export function MonthSectionPersonRow({
  row: r,
  personKey: pKey,
  roleForColor,
  col,
  received,
  isSelected,
  toggleRowSelection,
  setRcv,
  projectMode,
  hasWorkedDaysData,
  hasLocalizacionData,
  hasCargaDescargaData,
  columnVisibility,
  readOnly = false,
}: MonthSectionPersonRowProps) {
  const { t, i18n } = useTranslation();
  const rc = (received as any)[pKey] || { ok: false, note: '' };

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

  return (
    <tr>
      <Td align='middle'>
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
      <Td align='middle' className='text-center'>
        <div className='flex justify-center'>
        <span
          className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'
          title={`${r.role} - ${r.name}`}
        >
          <span
            className='inline-flex items-center justify-center w-6 h-5 rounded-md font-bold text-[10px]'
            style={{ 
              background: roleBgColor, 
              color: roleFgColor,
              WebkitTextFillColor: roleFgColor,
              textFillColor: roleFgColor
            } as React.CSSProperties}
            >
              {getRoleBadgeCode(r.role || '', i18n.language) || '—'}
            </span>
          <span className='text-xs text-zinc-200'>{r.name}</span>
        </span>
        </div>
      </Td>

      {hasWorkedDaysData && (
        <Td align='middle' className='text-center'>
          <div className='flex flex-col items-center'>
            {r._worked > 0 && (
              <div className='text-right font-medium text-zinc-100 mb-1'>{r._worked}</div>
            )}
            {projectMode !== 'publicidad' && (
              <WorkedDaysSummary
                carga={r._carga || 0}
                descarga={r._descarga || 0}
                localizar={r._localizar || 0}
                rodaje={r._rodaje || 0}
                oficina={r._oficina || 0}
              />
            )}
          </div>
        </Td>
      )}
      {hasWorkedDaysData && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.jornada ? (
            <span className='text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            displayMoney(r._totalDias, 2)
          )}
        </Td>
      )}

      {hasLocalizacionData && (
        <Td align='middle' className='text-center'>
          {r._localizarDays > 0 ? r._localizarDays : '—'}
        </Td>
      )}
      {hasLocalizacionData && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.localizacionTecnica ? (
            <span className='text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            displayMoney(r._totalLocalizacion, 2)
          )}
        </Td>
      )}

      {hasCargaDescargaData && (
        <Td align='middle' className='text-center'>
          <div className='flex flex-col items-center'>
            {(r._cargaDays || 0) + (r._descargaDays || 0) > 0 && (
              <div className='text-right font-medium text-zinc-100 mb-1'>
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
            <span className='text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            displayMoney(r._totalCargaDescarga, 2)
          )}
        </Td>
      )}

      {columnVisibility.holidays && <Td align='middle' className='text-center'>{displayValue(r._holidays)}</Td>}
      {columnVisibility.holidays && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.holidayDay ? (
            <span className='text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            displayMoney(r._totalHolidays, 2)
          )}
        </Td>
      )}

      {columnVisibility.travel && <Td align='middle' className='text-center'>{displayValue(r._travel)}</Td>}
      {columnVisibility.travel && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.travelDay ? (
            <span className='text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            displayMoney(r._totalTravel, 2)
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
            <span className='text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            displayMoney(r._totalExtras, 2)
          )}
        </Td>
      )}

      {columnVisibility.dietas && (
        <Td align='middle' className='text-center'>
          <div className='flex justify-center'>
          <DietasSummary
            dietasCount={r.dietasCount}
            ticketTotal={r.ticketTotal}
          />
          </div>
        </Td>
      )}
      {columnVisibility.dietas && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.dietas ? (
            <span className='text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            displayMoney(r._totalDietas, 2)
          )}
        </Td>
      )}

      {columnVisibility.transporte && <Td align='middle' className='text-center'>{displayValue(r.transporte)}</Td>}
      {columnVisibility.transporte && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.transporte ? (
            <span className='text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            displayMoney(r._totalTrans, 2)
          )}
        </Td>
      )}

      {columnVisibility.km && <Td align='middle' className='text-center'>{displayValue(r.km, 1)}</Td>}
      {columnVisibility.km && (
        <Td align='middle' className='text-center'>
          {r._missingPrices?.km ? (
            <span className='text-xs text-zinc-400 italic'>{t('payroll.addPriceInConditions')}</span>
          ) : (
            displayMoney(r._totalKm, 2)
          )}
        </Td>
      )}

      <Td align='middle' className='text-center font-semibold'>
        {displayMoney(r._totalBruto, 2)}
      </Td>

      <Td align='middle' className='text-center'>
        <div className='flex items-center justify-center gap-2'>
          <input
            type='checkbox'
            checked={!!rc.ok}
            onChange={e => !readOnly && setRcv(pKey, { ok: e.target.checked })}
            disabled={readOnly}
            className={readOnly ? 'opacity-50 cursor-not-allowed' : ''}
            title={readOnly ? t('conditions.projectClosed') : t('payroll.markAsReceived')}
          />
          <input
            type='text'
            placeholder={t('payroll.notePlaceholder')}
            value={rc.note || ''}
            onChange={e => !readOnly && setRcv(pKey, { note: e.target.value })}
            disabled={readOnly}
            readOnly={readOnly}
            className={`px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-xs ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : t('payroll.noteTitle')}
          />
        </div>
      </Td>
    </tr>
  );
}

