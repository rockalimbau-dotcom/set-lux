import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ParamInput } from '../shared';
import { AnyRecord } from '@shared/types/common';
import { useTheme } from '@shared/hooks/useTheme';

interface ParametersSectionProps {
  showParams: boolean;
  setShowParams: (value: boolean | ((prev: boolean) => boolean)) => void;
  params: AnyRecord;
  setParam: (key: string, value: string) => void;
  readOnly: boolean;
}

export function ParametersSection({
  showParams,
  setShowParams,
  params,
  setParam,
  readOnly,
}: ParametersSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const paramsRef = useRef<HTMLDivElement | null>(null);
  const p = params;
  
  const buttonStyle: React.CSSProperties = {
    background: theme === 'light' ? '#A0D3F2' : '#f59e0b',
    color: theme === 'light' ? '#111827' : '#FFFFFF',
    borderColor: theme === 'light' ? '#A0D3F2' : '#f59e0b',
  };

  return (
    <section className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90 p-2 sm:p-2.5 md:p-3 lg:p-4 phase-panel'>
      <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1.5 sm:mb-2 md:mb-3'>
        <button
          onClick={() => setShowParams(v => !v)}
          className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded sm:rounded-md md:rounded-lg border flex items-center justify-center text-[10px] sm:text-xs md:text-sm'
          style={buttonStyle}
          title={showParams ? t('conditions.collapse') : t('conditions.expand')}
          aria-label={t('conditions.calculationParameters')}
          aria-expanded={showParams}
          aria-controls='semanal-params'
          type='button'
        >
          {showParams ? '−' : '+'}
        </button>
        <h4 className='text-brand font-semibold m-0 text-xs sm:text-sm md:text-base'>
          {t('conditions.calculationParameters')}
        </h4>
      </div>

      <div className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 mb-1.5 sm:mb-2 md:mb-3'>
        {t('conditions.calculationParametersDescription')}
      </div>

      {showParams && (
        <div
          id='semanal-params'
          ref={paramsRef}
          tabIndex={-1}
          role='region'
          aria-label={t('conditions.parametersWeekly')}
          className='space-y-3 sm:space-y-4 md:space-y-5'
        >
          {/* Sección 1: Tiempo y Jornada */}
          <div className='space-y-2 sm:space-y-2.5 md:space-y-3'>
            <h5 className='text-[10px] sm:text-xs md:text-sm font-semibold text-neutral-text dark:text-zinc-200 border-b border-neutral-border pb-1 sm:pb-1.5 mb-1.5 sm:mb-2'>
              {t('conditions.timeAndWorkday')}
            </h5>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4'>
              <ParamInput
                label={t('conditions.workDay')}
                suffix='h'
                duo={[
                  {
                    value: p.jornadaTrabajo ?? '9',
                    onChange: (v: string) => setParam('jornadaTrabajo', v),
                  },
                  {
                    value: p.jornadaComida ?? '1',
                    onChange: (v: string) => setParam('jornadaComida', v),
                  },
                ]}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.workDays')}
                value={p.diasJornada ?? '5'}
                onChange={(v: string) => setParam('diasJornada', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.dailyDays')}
                value={p.diasDiario ?? '7'}
                onChange={(v: string) => setParam('diasDiario', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.weeksPerMonth')}
                value={p.semanasMes ?? '4'}
                onChange={(v: string) => setParam('semanasMes', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.weeklyHours')}
                value={p.horasSemana ?? '45'}
                onChange={(v: string) => setParam('horasSemana', v)}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Sección 2: Factores y Multiplicadores */}
          <div className='space-y-2 sm:space-y-2.5 md:space-y-3'>
            <h5 className='text-[10px] sm:text-xs md:text-sm font-semibold text-neutral-text dark:text-zinc-200 border-b border-neutral-border pb-1 sm:pb-1.5 mb-1.5 sm:mb-2'>
              {t('conditions.factorsAndMultipliers')}
            </h5>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4'>
              <ParamInput
                label={t('conditions.extraDayHoliday')}
                value={p.factorFestivo ?? '1.75'}
                onChange={(v: string) => setParam('factorFestivo', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.extraHour')}
                value={p.factorHoraExtra ?? '1.5'}
                onChange={(v: string) => setParam('factorHoraExtra', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.travelDayDivisor')}
                value={p.divTravel ?? '2'}
                onChange={(v: string) => setParam('divTravel', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.courtesyMinutes')}
                value={p.cortesiaMin ?? '15'}
                onChange={(v: string) => setParam('cortesiaMin', v)}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Sección 3: Turn Around */}
          <div className='space-y-2 sm:space-y-2.5 md:space-y-3'>
            <h5 className='text-[10px] sm:text-xs md:text-sm font-semibold text-neutral-text dark:text-zinc-200 border-b border-neutral-border pb-1 sm:pb-1.5 mb-1.5 sm:mb-2'>
              {t('conditions.turnAround')}
            </h5>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4'>
              <ParamInput
                label={t('conditions.turnAroundDaily')}
                value={p.taDiario ?? '12'}
                onChange={(v: string) => setParam('taDiario', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.turnAroundWeekend')}
                value={p.taFinde ?? '48'}
                onChange={(v: string) => setParam('taFinde', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.nightShift')}
                duo={[
                  {
                    value: p.nocturnoIni ?? '22:00',
                    onChange: (v: string) => setParam('nocturnoIni', v),
                  },
                  {
                    value: p.nocturnoFin ?? '06:00',
                    onChange: (v: string) => setParam('nocturnoFin', v),
                  },
                ]}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Sección 4: Dietas y Alojamiento */}
          <div className='space-y-2 sm:space-y-2.5 md:space-y-3'>
            <h5 className='text-[10px] sm:text-xs md:text-sm font-semibold text-neutral-text dark:text-zinc-200 border-b border-neutral-border pb-1 sm:pb-1.5 mb-1.5 sm:mb-2'>
              {t('conditions.perDiemsAndAccommodation')}
            </h5>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4'>
              <ParamInput
                label={t('conditions.lunch')}
                value={p.dietaComida ?? '14.02'}
                onChange={(v: string) => setParam('dietaComida', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.dinner')}
                value={p.dietaCena ?? '16.36'}
                onChange={(v: string) => setParam('dietaCena', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.perDiemNoOvernight')}
                value={p.dietaSinPernocta ?? '30.38'}
                onChange={(v: string) => setParam('dietaSinPernocta', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.accommodationBreakfast')}
                value={p.dietaAlojDes ?? '51.39'}
                onChange={(v: string) => setParam('dietaAlojDes', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.pocketExpenses')}
                value={p.gastosBolsillo ?? '8.81'}
                onChange={(v: string) => setParam('gastosBolsillo', v)}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Sección 5: Transporte */}
          <div className='space-y-2 sm:space-y-2.5 md:space-y-3'>
            <h5 className='text-[10px] sm:text-xs md:text-sm font-semibold text-neutral-text dark:text-zinc-200 border-b border-neutral-border pb-1 sm:pb-1.5 mb-1.5 sm:mb-2'>
              {t('conditions.transport')}
            </h5>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4'>
              <ParamInput
                label={t('conditions.kilometers')}
                value={p.kilometrajeKm ?? '0.26'}
                onChange={(v: string) => setParam('kilometrajeKm', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.transportPerDay')}
                value={p.transporteDia ?? '12'}
                onChange={(v: string) => setParam('transporteDia', v)}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

