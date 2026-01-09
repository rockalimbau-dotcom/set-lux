import { useTranslation } from 'react-i18next';
import { renderWithParams, visibleToTemplate, TextAreaAuto, InfoCard, restoreStrongTags } from '../shared';
import { getDefaultsDiario } from '../../utils/translationHelpers';
import { globalDynamicFestivosText } from './publicidadData';
import { AnyRecord } from '@shared/types/common';

interface InfoSectionsProps {
  model: AnyRecord;
  setText: (key: string, value: string) => void;
  readOnly: boolean;
}

export function InfoSections({ model, setText, readOnly }: InfoSectionsProps) {
  const { t } = useTranslation();
  const defaults = getDefaultsDiario();

  return (
    <>
      <section className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90 p-2 sm:p-2.5 md:p-3 lg:p-4'>
        <div className='flex items-center justify-between mb-1 sm:mb-1.5 md:mb-2'>
          <h4 className='text-brand font-semibold text-xs sm:text-sm md:text-base'>{t('conditions.calculationLegend')}</h4>
        </div>
        <TextAreaAuto
          value={restoreStrongTags(renderWithParams(model.legendTemplate, model.params))}
          onChange={v =>
            setText('legendTemplate', visibleToTemplate(v, model.params))
          }
          className='min-h-[90px] sm:min-h-[110px] md:min-h-[130px] lg:min-h-[160px]'
          readOnly={readOnly}
        />
      </section>

      <InfoCard
        title={t('conditions.holidays')}
        value={renderWithParams(model.festivosTemplate, model.params)}
        onChange={v =>
          setText('festivosTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
        template={model.festivosTemplate}
        params={model.params}
        translationKey='conditions.defaultHolidays'
        onRestore={() => setText('festivosTemplate', globalDynamicFestivosText)}
      />
      <InfoCard
        title={t('conditions.schedules')}
        value={restoreStrongTags(renderWithParams(model.horariosTemplate, model.params))}
        onChange={v =>
          setText('horariosTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
        template={model.horariosTemplate}
        params={model.params}
        translationKey='conditions.defaultSchedulesAdvertising'
        onRestore={() => setText('horariosTemplate', defaults.horarios)}
      />
      <InfoCard
        title={t('conditions.perDiems')}
        value={restoreStrongTags(renderWithParams(model.dietasTemplate, model.params))}
        onChange={v =>
          setText('dietasTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
        template={model.dietasTemplate}
        params={model.params}
        translationKey='conditions.defaultPerDiemsAdvertising'
        onRestore={() => setText('dietasTemplate', defaults.dietas)}
      />
      <InfoCard
        title={t('conditions.transportation')}
        value={renderWithParams(model.transportesTemplate, model.params)}
        onChange={v =>
          setText('transportesTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
        template={model.transportesTemplate}
        params={model.params}
        translationKey='conditions.defaultTransportation'
        onRestore={() => setText('transportesTemplate', defaults.transportes)}
      />
      <InfoCard
        title={t('conditions.accommodation')}
        value={renderWithParams(model.alojamientoTemplate, model.params)}
        onChange={v =>
          setText('alojamientoTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
        template={model.alojamientoTemplate}
        params={model.params}
        translationKey='conditions.defaultAccommodation'
        onRestore={() => setText('alojamientoTemplate', defaults.alojamiento)}
      />
      <InfoCard
        title={t('conditions.agreement')}
        value={renderWithParams(model.convenioTemplate, model.params)}
        onChange={v =>
          setText('convenioTemplate', visibleToTemplate(v, model.params))
        }
        readOnly={readOnly}
        template={model.convenioTemplate}
        params={model.params}
        translationKey='conditions.defaultAgreement'
        onRestore={() => setText('convenioTemplate', defaults.convenio)}
        rightAddon={
          readOnly ? (
            <span className='text-brand text-[9px] sm:text-[10px] md:text-sm opacity-50 cursor-not-allowed' title='El proyecto está cerrado'>
              BOE
            </span>
          ) : (
            <a
              href='https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-6846'
              target='_blank'
              rel='noreferrer'
              className='text-brand hover:underline text-[9px] sm:text-[10px] md:text-sm'
              title={t('conditions.openBOE')}
            >
              BOE
            </a>
          )
        }
      />
    </>
  );
}

