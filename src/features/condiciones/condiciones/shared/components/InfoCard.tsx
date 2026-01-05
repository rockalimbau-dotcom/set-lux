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
  rightAddon = null,
  readOnly = false,
  template,
  defaultTemplate,
  params = {},
  translationKey,
  onRestore,
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
      className={`rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4 transition-colors ${
        readOnly ? '' : 'hover:border-brand/50'
      }`}
    >
      <div className='flex items-center justify-between mb-2'>
        <h4 className='text-brand font-semibold'>{title}</h4>
        <div className='flex items-center gap-2'>
          {rightAddon}
        </div>
      </div>
      <TextAreaAuto value={value} onChange={onChange} className='min-h-[140px]' readOnly={readOnly} />
    </section>
  );
}

