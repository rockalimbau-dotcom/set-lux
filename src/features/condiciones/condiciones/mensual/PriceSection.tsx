import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Th, Td } from '@shared/components';
import { PRICE_HEADERS, PRICE_ROLES } from '../shared.constants';
import { AnyRecord } from '@shared/types/common';

interface PriceSectionProps {
  title: string;
  sectionKey: 'base' | 'prelight' | 'pickup';
  model: AnyRecord;
  roles: string[];
  handlePriceChange: (sectionKey: 'base' | 'prelight' | 'pickup', role: string, header: string, value: string) => void;
  translateHeader: (header: string) => string;
  translateRoleName: (roleName: string, sectionKey?: 'base' | 'prelight' | 'pickup') => string;
  setRoleToDelete: (sectionKey: 'base' | 'prelight' | 'pickup', role: string | null) => void;
  addRole: (newRole: string) => void;
  onRemove?: () => void;
  readOnly: boolean;
}

export function PriceSection({
  title,
  sectionKey,
  model,
  roles,
  handlePriceChange,
  translateHeader,
  translateRoleName,
  setRoleToDelete,
  addRole,
  onRemove,
  readOnly,
}: PriceSectionProps) {
  const { t } = useTranslation();
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  // Obtener los precios de la sección correspondiente
  const prices = sectionKey === 'base' 
    ? model.prices || {}
    : sectionKey === 'prelight'
    ? model.pricesPrelight || {}
    : model.pricesPickup || {};

  // Para prelight y pickup, mostrar todos los roles disponibles, no solo los del equipo base
  const availableRoles = sectionKey === 'base' ? roles : PRICE_ROLES;

  // Filtrar headers: quitar "Precio refuerzo" de prelight y pickup
  const visibleHeaders = sectionKey === 'base' 
    ? PRICE_HEADERS 
    : PRICE_HEADERS.filter(h => h !== 'Precio refuerzo');

  return (
    <div className='space-y-1 sm:space-y-1.5 md:space-y-2'>
      {/* Header de la sección */}
      <div className='flex items-center justify-between gap-2'>
        <h4 className='text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-zinc-700 dark:text-zinc-200'>
          {title}
        </h4>
        {onRemove && (
          <button
            onClick={onRemove}
            disabled={readOnly}
            className={`text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 rounded sm:rounded-md md:rounded-lg remove-section-btn ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : t('conditions.removeSection')}
          >
            {t('conditions.removeSection')}
          </button>
        )}
      </div>

      {/* Texto informativo y botón añadir rol */}
      <div className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 mb-1 sm:mb-1.5 md:mb-2 flex items-center justify-between gap-1 sm:gap-2'>
        {sectionKey === 'base' && (
          <span className='flex-1' dangerouslySetInnerHTML={{ __html: t('conditions.introduceMonthlyPrice') }} />
        )}
        {sectionKey !== 'base' && <span className='flex-1' dangerouslySetInnerHTML={{ __html: t('conditions.introducePricesForSection') }} />}
        <div className='relative flex-shrink-0'>
          <button
            onClick={() => !readOnly && setShowRoleSelect(!showRoleSelect)}
            disabled={readOnly}
            className={`px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 lg:px-3 lg:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm bg-brand text-white rounded sm:rounded-md md:rounded-lg hover:bg-brand/80 whitespace-nowrap ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ color: 'white' }}
            title={readOnly ? t('conditions.projectClosed') : t('conditions.addRole')}
          >
            {t('conditions.addRole')}
          </button>
          {showRoleSelect && (
            <div 
              className='absolute right-0 top-full mt-0.5 sm:mt-1 bg-white dark:bg-amber-800 border border-neutral-border dark:border-amber-600 rounded sm:rounded-md md:rounded-lg shadow-lg z-10 min-w-[100px] sm:min-w-[120px] md:min-w-[150px] max-h-40 sm:max-h-48 md:max-h-60 overflow-y-auto'
              tabIndex={-1}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setTimeout(() => setShowRoleSelect(false), 200);
                }
              }}
            >
              {availableRoles.filter((r: string) => !Object.keys(prices).includes(r)).map((role: string) => (
                <button
                  key={role}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    // Inicializar el rol vacío (no copiar del base)
                    handlePriceChange(sectionKey, role, 'Precio mensual', '');
                    setShowRoleSelect(false);
                  }}
                  className='w-full text-left px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-2 text-[8px] sm:text-[9px] md:text-[10px] lg:text-sm text-gray-900 dark:text-white hover:bg-blue-100 dark:hover:bg-amber-600/40 transition-colors'
                >
                  {translateRoleName(role, sectionKey)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de precios */}
      <section className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90 overflow-x-auto relative'>
        <table className='min-w-[600px] sm:min-w-[720px] md:min-w-[920px] w-full border-collapse text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>
          <thead>
            <tr>
              <Th align='left'>{t('conditions.rolePrice')}</Th>
              {visibleHeaders.map(col => (
                <Th key={col} align='center'>{translateHeader(col)}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(prices).length === 0 ? (
              <tr>
                <Td colSpan={visibleHeaders.length + 1} align='center' className='text-zinc-400 text-[9px] sm:text-[10px] md:text-xs py-3 sm:py-4 md:py-5'>
                  {t('conditions.noRolesInSection')}
                </Td>
              </tr>
            ) : (
              Object.keys(prices).map((role: string) => {
                const hasMensualValue = prices[role]?.['Precio mensual'];
                
                return (
                  <tr key={role} className='relative'>
                    <Td className='font-semibold whitespace-nowrap' align='middle'>
                      <div className='flex items-center gap-0.5 sm:gap-1'>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (readOnly) return;
                            setRoleToDelete(sectionKey, role);
                          }}
                          disabled={readOnly}
                          className={`text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:text-amber-500 dark:hover:bg-amber-900/20 font-bold text-[9px] sm:text-[10px] md:text-xs lg:text-sm w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center rounded sm:rounded-md transition-all hover:scale-110 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={readOnly ? t('conditions.projectClosed') : t('conditions.deleteRole')}
                          type='button'
                        >
                          ✕
                        </button>
                        <span>{translateRoleName(role, sectionKey)}</span>
                      </div>
                    </Td>
                    {visibleHeaders.map(h => {
                      const isMensual = h === 'Precio mensual';
                      const isRefuerzo = h === 'Precio refuerzo';
                      
                      return (
                        <Td key={h} align='center'>
                          <input
                            type='number'
                            value={prices[role]?.[h] ?? ''}
                            onChange={e => !readOnly && handlePriceChange(sectionKey, role, h, (e.target as HTMLInputElement).value)}
                            placeholder={isMensual ? '€' : ''}
                            step='0.01'
                            disabled={readOnly || (!isMensual && !isRefuerzo && !hasMensualValue)}
                            readOnly={readOnly}
                            className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg border border-neutral-border focus:outline-none focus:ring-1 text-center text-[9px] sm:text-[10px] md:text-xs ${
                              readOnly || (!isMensual && !isRefuerzo && !hasMensualValue)
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-50' 
                                : 'dark:bg-transparent'
                            }`}
                          />
                        </Td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
