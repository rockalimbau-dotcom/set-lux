import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ParamInput } from '../shared';
import { AnyRecord } from '@shared/types/common';

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
  const paramsRef = useRef<HTMLDivElement | null>(null);
  const p = params;

  return (
    <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4'>
      <div className='flex items-center gap-2 mb-3'>
        <button
          onClick={() => setShowParams(v => !v)}
          className='w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-accent'
          title={showParams ? t('conditions.collapse') : t('conditions.expand')}
          aria-label={t('conditions.calculationParameters')}
          aria-expanded={showParams}
          aria-controls='publicidad-params'
          type='button'
        >
          {showParams ? '−' : '+'}
        </button>
        <h4 className='text-brand font-semibold m-0'>
          {t('conditions.calculationParameters')}
        </h4>
      </div>

      <div className='text-xs text-zinc-400 mb-3' dangerouslySetInnerHTML={{ __html: t('conditions.amountsCalculatedFrom') }} />

      {showParams && (
        <div
          id='publicidad-params'
          ref={paramsRef}
          tabIndex={-1}
          role='region'
          aria-label={t('conditions.parametersAdvertising')}
          className='grid grid-cols-1 sm:grid-cols-3 gap-3'
        >
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
          <ParamInput
            label={t('conditions.courtesyMinutes')}
            value={p.cortesiaMin ?? '15'}
            onChange={(v: string) => setParam('cortesiaMin', v)}
            readOnly={readOnly}
          />
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
          <ParamInput
            label={t('conditions.perDiemNoOvernight')}
            value={p.dietaSinPernocta ?? '50'}
            onChange={(v: string) => setParam('dietaSinPernocta', v)}
            readOnly={readOnly}
          />
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
      )}
    </section>
  );
}

