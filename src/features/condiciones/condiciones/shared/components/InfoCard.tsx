import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoCardProps } from '../types';
import { TextAreaAuto } from './TextAreaAuto';
import { renderWithParams } from '../utils';
import { normalizeText } from '../../../utils/translationHelpers';

export function InfoCard({
  title,
  value,
  onChange,
  titleValue,
  onTitleChange,
  titlePlaceholder,
  rightAddon = null,
  readOnly = false,
  template,
  defaultTemplate,
  params = {},
  translationKey,
  onRestore,
  onRemove,
  removeLabel,
}: InfoCardProps) {
  const { t, i18n } = useTranslation();

  // Detectar si el texto está modificado (no es default) - usando useMemo para recalcular cuando cambia template o idioma
  const modified = useMemo(() => {
    if (!template || template.trim() === '' || !translationKey) return false;

    const languages = ['es', 'en', 'ca'];
    const currentLanguage = i18n.language;

    // Primero comparar el template directamente (sin renderizar) con los defaults
    const normalizedTemplate = normalizeText(template);
    const templateMatchesDirectly = languages.some(lang => {
      try {
        const defaultText = i18n.t(translationKey, { lng: lang });
        const normalizedDefault = normalizeText(defaultText);

        // Comparación exacta del template
        if (normalizedTemplate === normalizedDefault) return true;

        // Comparación de estructura (reemplazando variables)
        if (template.includes('{{') && template.includes('}}')) {
          const templateStructure = normalizedTemplate.replace(/\{\{[^}]+\}\}/g, '{{VAR}}');
          const defaultStructure = normalizedDefault.replace(/\{\{[^}]+\}\}/g, '{{VAR}}');
          if (templateStructure === defaultStructure) return true;
        }

        return false;
      } catch {
        return false;
      }
    });

    if (templateMatchesDirectly) return false;

    // Si no coincide directamente, comparar los renderizados
    const currentRendered = renderWithParams(template, params);
    const normalizedCurrent = normalizeText(currentRendered);

    const matchesAnyDefault = languages.some(lang => {
      try {
        const defaultText = i18n.t(translationKey, { lng: lang });
        const defaultRendered = renderWithParams(defaultText, params);
        const normalizedDefault = normalizeText(defaultRendered);

        if (normalizedCurrent === normalizedDefault) return true;

        return false;
      } catch {
        return false;
      }
    });

    return !matchesAnyDefault;
  }, [template, translationKey, params, i18n.language]);

  const showRestoreButton = modified && !readOnly && onRestore;

  return (
    <section
      className={`rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90 p-2 sm:p-2.5 md:p-3 lg:p-4 transition-colors ${
        readOnly ? '' : 'hover:border-brand/50'
      }`}
    >
      <div className='flex items-center justify-between mb-1 sm:mb-1.5 md:mb-2'>
        {onTitleChange ? (
          <input
            type='text'
            value={titleValue ?? title}
            onChange={event => onTitleChange(event.target.value)}
            placeholder={titlePlaceholder}
            readOnly={readOnly}
            disabled={readOnly}
            className={`w-full rounded-lg border border-neutral-border bg-neutral-surface px-2 py-1 text-xs font-semibold text-brand focus:outline-none focus:ring-1 focus:ring-brand sm:text-sm md:text-base ${
              readOnly ? 'cursor-not-allowed opacity-50' : 'hover:border-brand/50'
            }`}
          />
        ) : (
          <h4 className='text-brand font-semibold text-xs sm:text-sm md:text-base'>{title}</h4>
        )}
        <div className='flex items-center gap-1 sm:gap-2'>
          {onRemove && (
            <button
              type='button'
              onClick={onRemove}
              disabled={readOnly}
              className={`rounded border border-neutral-border px-2 py-1 text-[10px] font-semibold text-gray-700 dark:text-zinc-200 ${
                readOnly ? 'cursor-not-allowed opacity-50' : 'hover:border-brand/50'
              }`}
              title={removeLabel || t('conditions.removeSection')}
              aria-label={removeLabel || t('conditions.removeSection')}
            >
              x
            </button>
          )}
          {rightAddon}
        </div>
      </div>
      <TextAreaAuto value={value} onChange={onChange} className='min-h-[80px] sm:min-h-[100px] md:min-h-[120px] lg:min-h-[140px]' readOnly={readOnly} />
    </section>
  );
}
