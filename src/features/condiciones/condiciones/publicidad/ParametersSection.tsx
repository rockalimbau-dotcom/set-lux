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
    background: theme === 'light' ? 'var(--bg)' : 'transparent',
    color: theme === 'light' ? '#111827' : '#FFFFFF',
    borderColor: theme === 'light' ? '#0476D9' : '#f59e0b',
  };

  return (
    <section
      className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90 p-2 sm:p-2.5 md:p-3 lg:p-4 phase-panel'
      data-tutorial='conditions-params'
    >
      <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1.5 sm:mb-2 md:mb-3'>
        <button
          onClick={() => setShowParams(v => !v)}
          className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded sm:rounded-md md:rounded-lg border flex items-center justify-center text-[10px] sm:text-xs md:text-sm'
          style={buttonStyle}
          title={showParams ? t('conditions.collapse') : t('conditions.expand')}
          aria-label={t('conditions.calculationParameters')}
          aria-expanded={showParams}
          aria-controls='diario-params'
          type='button'
        >
          {showParams ? '−' : '+'}
        </button>
        <div className='flex items-center gap-2'>
          <h4 className='text-brand font-semibold m-0 text-xs sm:text-sm md:text-base'>
            {t('conditions.calculationParameters')}
          </h4>
          <div className='inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] sm:text-xs md:text-sm font-semibold text-white dark:bg-amber-500'>
            <div className='inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-white text-[10px] font-bold'>
              !
            </div>
            {t('conditions.importantLabel')}
          </div>
        </div>
      </div>

      <div
        className={`text-[9px] sm:text-[10px] md:text-xs mb-1.5 sm:mb-2 md:mb-3 ${
          theme === 'light' ? 'text-black' : 'text-white'
        }`}
        dangerouslySetInnerHTML={{ __html: t('conditions.calculationParametersDescriptionWeekly') }}
      />

      {showParams && (
        <div
          id='diario-params'
          ref={paramsRef}
          tabIndex={-1}
          role='region'
          aria-label={t('conditions.parametersAdvertising')}
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
                    value: p.jornadaTrabajo ?? '10',
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
                label={t('conditions.courtesyMinutes')}
                value={p.cortesiaMin ?? '15'}
                onChange={(v: string) => setParam('cortesiaMin', v)}
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
                label={t('conditions.extraHourHolidayNight')}
                value={p.factorHoraExtraFestiva ?? '1.5'}
                onChange={(v: string) => setParam('factorHoraExtraFestiva', v)}
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
                value={p.taDiario ?? '10'}
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
                label={t('conditions.nightShiftComplement')}
                value={p.nocturnidadComplemento ?? '50'}
                onChange={(v: string) => setParam('nocturnidadComplemento', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.nightShift')}
                duo={[
                  {
                    value: p.nocturnoIni ?? '02:00',
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
                label={t('conditions.breakfast')}
                value={p.dietaDesayuno ?? '10'}
                onChange={(v: string) => setParam('dietaDesayuno', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.lunch')}
                readOnly={readOnly}
                value={p.dietaComida ?? '20'}
                onChange={(v: string) => setParam('dietaComida', v)}
              />
              <ParamInput
                label={t('conditions.dinner')}
                value={p.dietaCena ?? '30'}
                onChange={(v: string) => setParam('dietaCena', v)}
                readOnly={readOnly}
              />
            <div data-tutorial='conditions-pernocta-anchor'>
              <ParamInput
                label={t('conditions.perDiemNoOvernight')}
                value={p.dietaSinPernocta ?? '50'}
                onChange={(v: string) => setParam('dietaSinPernocta', v)}
                readOnly={readOnly}
              />
            </div>
              <ParamInput
                label={t('conditions.accommodationBreakfast')}
                value={p.dietaAlojDes ?? '70'}
                onChange={(v: string) => setParam('dietaAlojDes', v)}
                readOnly={readOnly}
              />
              <ParamInput
                label={t('conditions.pocketExpenses')}
                value={p.gastosBolsillo ?? '10'}
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
                value={p.kilometrajeKm ?? '0.40'}
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

