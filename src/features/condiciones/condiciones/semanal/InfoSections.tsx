import { useTranslation } from 'react-i18next';
import { renderWithParams, visibleToTemplate, TextAreaAuto, InfoCard, restoreStrongTags } from '../shared';
import { getDefaultsSemanal } from '../../utils/translationHelpers';
import { globalDynamicFestivosText } from './semanalData';
import { AnyRecord } from '@shared/types/common';
import { useTheme } from '@shared/hooks/useTheme';

interface InfoSectionsProps {
  model: AnyRecord;
  setText: (key: string, value: string) => void;
  readOnly: boolean;
}

export function InfoSections({ model, setText, readOnly }: InfoSectionsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const defaults = getDefaultsSemanal();
  
  const boeButtonStyle: React.CSSProperties = {
    background: theme === 'light' ? '#A0D3F2' : '#f59e0b',
    color: theme === 'light' ? '#111827' : '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <>
      <section className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90 p-2 sm:p-2.5 md:p-3 lg:p-4'>
        <div className='flex items-center justify-between mb-1 sm:mb-1.5 md:mb-2'>
          <h4 className='text-brand font-semibold text-xs sm:text-sm md:text-base'>{t('conditions.calculationLegend')}</h4>
        </div>
        <TextAreaAuto
          value={restoreStrongTags(renderWithParams(model.legendTemplate, model.params))}
          onChange={v => setText('legendTemplate', visibleToTemplate(v, model.params))}
          className='min-h-[100px] sm:min-h-[120px] md:min-h-[150px] lg:min-h-[180px]'
          readOnly={readOnly}
        />
      </section>

      <InfoCard
        title={t('conditions.holidays')}
        value={renderWithParams(model.festivosTemplate, model.params)}
        onChange={v => setText('festivosTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
        template={model.festivosTemplate}
        params={model.params}
        translationKey='conditions.defaultHolidays'
        onRestore={() => setText('festivosTemplate', globalDynamicFestivosText)}
      />
      <InfoCard
        title={t('conditions.schedules')}
        value={restoreStrongTags(renderWithParams(model.horariosTemplate, model.params))}
        onChange={v => setText('horariosTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
        template={model.horariosTemplate}
        params={model.params}
        translationKey='conditions.defaultSchedules'
        onRestore={() => setText('horariosTemplate', defaults.horarios)}
      />
      <InfoCard
        title={t('conditions.perDiems')}
        value={restoreStrongTags(renderWithParams(model.dietasTemplate, model.params))}
        onChange={v => setText('dietasTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
        template={model.dietasTemplate}
        params={model.params}
        translationKey='conditions.defaultPerDiems'
        onRestore={() => setText('dietasTemplate', defaults.dietas)}
      />
      <InfoCard
        title={t('conditions.transportation')}
        value={renderWithParams(model.transportesTemplate, model.params)}
        onChange={v => setText('transportesTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
        template={model.transportesTemplate}
        params={model.params}
        translationKey='conditions.defaultTransportation'
        onRestore={() => setText('transportesTemplate', defaults.transportes)}
      />
      <InfoCard
        title={t('conditions.accommodation')}
        value={renderWithParams(model.alojamientoTemplate, model.params)}
        onChange={v => setText('alojamientoTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
        template={model.alojamientoTemplate}
        params={model.params}
        translationKey='conditions.defaultAccommodation'
        onRestore={() => setText('alojamientoTemplate', defaults.alojamiento)}
      />
      <InfoCard
        title={t('conditions.preProduction')}
        value={renderWithParams(model.preproTemplate, model.params)}
        onChange={v => setText('preproTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
        template={model.preproTemplate}
        params={model.params}
        translationKey='conditions.defaultPreProduction'
        onRestore={() => setText('preproTemplate', defaults.prepro)}
      />
      <InfoCard
        title={t('conditions.agreement')}
        value={renderWithParams(model.convenioTemplate, model.params)}
        onChange={v => setText('convenioTemplate', visibleToTemplate(v, model.params))}
        readOnly={readOnly}
        template={model.convenioTemplate}
        params={model.params}
        translationKey='conditions.defaultAgreement'
        onRestore={() => setText('convenioTemplate', defaults.convenio)}
        rightAddon={
          readOnly ? (
            <button
              disabled
              className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded text-[10px] sm:text-xs md:text-sm font-semibold opacity-50 cursor-not-allowed'
              style={boeButtonStyle}
              title='El proyecto está cerrado'
            >
              BOE
            </button>
          ) : (
            <button
              onClick={() => window.open('https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-6846', '_blank', 'noopener,noreferrer')}
              className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded text-[10px] sm:text-xs md:text-sm font-semibold'
              style={boeButtonStyle}
              title={t('conditions.openBOE')}
              type='button'
            >
              BOE
            </button>
          )
        }
      />
    </>
  );
}

