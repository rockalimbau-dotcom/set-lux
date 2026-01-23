import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Th, Td } from '@shared/components';
import { PRICE_HEADERS_DIARIO, PRICE_ROLES_DIARIO } from './publicidadConstants';
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!showRoleSelect) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowRoleSelect(false);
      }
    };

    // Usar click en lugar de mousedown y agregar delay
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showRoleSelect]);

  // Obtener los precios de la sección correspondiente
  const prices = sectionKey === 'base' 
    ? (model?.prices || {})
    : sectionKey === 'prelight'
    ? (model?.pricesPrelight || {})
    : (model?.pricesPickup || {});

  // IMPORTANTE: Antes del commit ab1a5e5, PricesTable usaba roles.map() directamente
  // Para la sección base, SIEMPRE debemos mostrar los roles del equipo base, independientemente de prices
  // Prioridad: roles prop > model.roles > ['Gaffer', 'Eléctrico']
  const baseRoles: string[] = (() => {
    if (sectionKey === 'base') {
      // Para base, siempre asegurar que hay roles - FALLBACK ABSOLUTO
      // Verificar que roles tenga elementos, no solo que exista
      if (roles && Array.isArray(roles) && roles.length > 0) {
        return roles;
      }
      // Si roles está vacío, verificar model.roles
      if (model?.roles && Array.isArray(model.roles) && model.roles.length > 0) {
        return model.roles;
      }
      // FALLBACK ABSOLUTO: siempre devolver estos roles para base
      // Esto asegura que la tabla nunca esté vacía (como funcionaba antes con roles.map())
      return ['Gaffer', 'Eléctrico'];
    }
    // Para prelight/pickup, usar roles si están disponibles
    return (roles && Array.isArray(roles) && roles.length > 0) ? roles : [];
  })();
  
  // Asegurar que baseRoles nunca esté vacío para la sección base (doble verificación)
  const finalBaseRoles = (sectionKey === 'base' && (!baseRoles || baseRoles.length === 0))
    ? ['Gaffer', 'Eléctrico']
    : baseRoles;

  // IMPORTANTE: Antes del commit ab1a5e5, PricesTable usaba roles.map() directamente
  // Esto significa que siempre mostraba los roles del array roles, independientemente de prices
  // Para la sección base, debemos usar finalBaseRoles directamente (como antes), no Object.keys(prices)
  // Para prelight y pickup: mostrar roles que están en prices, pero ordenados según PRICE_ROLES_DIARIO
  const pricesKeys = Object.keys(prices || {});
  
  // Función para ordenar roles según el orden de PRICE_ROLES_DIARIO
  const sortRolesByPriceRolesOrder = (rolesToSort: string[]): string[] => {
    const sorted: string[] = [];
    const rolesSet = new Set(rolesToSort);
    
    // Primero añadir roles en el orden de PRICE_ROLES_DIARIO
    for (const role of PRICE_ROLES_DIARIO) {
      if (rolesSet.has(role)) {
        sorted.push(role);
        rolesSet.delete(role);
      }
    }
    
    // Luego añadir cualquier rol que no esté en PRICE_ROLES_DIARIO
    for (const role of rolesToSort) {
      if (rolesSet.has(role)) {
        sorted.push(role);
      }
    }
    
    return sorted;
  };
  
  // Para la sección base: usar finalBaseRoles directamente (como funcionaba antes con roles.map())
  // Para prelight/pickup: mostrar roles que están en prices, ordenados según PRICE_ROLES_DIARIO
  const rolesToDisplay = sectionKey === 'base' 
    ? finalBaseRoles
    : sortRolesByPriceRolesOrder(pricesKeys);

  // Para prelight y pickup, mostrar todos los roles disponibles, no solo los del equipo base
  // Para base, availableRoles son los roles que NO están en el equipo base (para el dropdown)
  const availableRoles = PRICE_ROLES_DIARIO;

  // En diario no hay "Precio refuerzo", así que todos los headers son visibles
  const visibleHeaders = PRICE_HEADERS_DIARIO;


  return (
    <div className='space-y-1 sm:space-y-1.5 md:space-y-2' style={{ overflow: 'visible' }}>
      {/* Header de la sección */}
      <div className='flex items-center justify-between gap-2'>
        <h4 className='text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-brand'>
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
      <div className='text-[9px] sm:text-[10px] md:text-xs text-white mb-1 sm:mb-1.5 md:mb-2 flex items-center justify-between gap-1 sm:gap-2' style={{ overflow: 'visible', position: 'relative', zIndex: 50 }}>
        {sectionKey === 'base' && (
          <span className='flex-1' dangerouslySetInnerHTML={{ __html: t('conditions.pricesBaseDescription') }} />
        )}
        {sectionKey !== 'base' && <span className='flex-1' dangerouslySetInnerHTML={{ __html: t('conditions.introducePricesForSection') }} />}
        <div ref={dropdownContainerRef} className='relative flex-shrink-0' style={{ position: 'relative', zIndex: 100 }}>
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) setShowRoleSelect(!showRoleSelect);
            }}
            disabled={readOnly}
            className={`px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 lg:px-3 lg:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm bg-brand text-white rounded sm:rounded-md md:rounded-lg hover:bg-brand/80 whitespace-nowrap ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ color: 'white' }}
            title={readOnly ? t('conditions.projectClosed') : t('conditions.addRole')}
          >
            {t('conditions.addRole')}
          </button>
          {showRoleSelect && (
            <div 
              ref={dropdownRef}
              className='absolute right-0 top-full mt-0.5 sm:mt-1 bg-white dark:bg-amber-800 border border-neutral-border dark:border-amber-600 rounded sm:rounded-md md:rounded-lg shadow-xl z-[100] min-w-[100px] sm:min-w-[120px] md:min-w-[150px] max-h-40 sm:max-h-48 md:max-h-60 overflow-y-auto'
              style={{ position: 'absolute', zIndex: 9999 }}
              tabIndex={-1}
            >
              {availableRoles.filter((r: string) => {
                // Para base: mostrar roles que NO están en el equipo base
                // Para prelight/pickup: mostrar roles que NO están en prices
                if (sectionKey === 'base') {
                  return !finalBaseRoles.includes(r);
                }
                return !Object.keys(prices).includes(r);
              }).map((role: string) => (
                <button
                  key={role}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (sectionKey === 'base') {
                      // Para la sección base, añadir el rol a model.roles y crear entrada en prices
                      // addRole ya copia los precios preestablecidos si existen
                      addRole(role);
                      // Si el rol tiene precios preestablecidos, handlePriceChange los mantendrá
                      // Si no, inicializar vacío
                      if (!prices[role] || Object.keys(prices[role]).length === 0) {
                        handlePriceChange(sectionKey, role, 'Precio jornada', '');
                      }
                    } else {
                      // Para prelight y pickup, solo crear entrada en prices (no añadir a model.roles)
                      handlePriceChange(sectionKey, role, 'Precio jornada', '');
                    }
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
      <section className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90 overflow-x-auto'>
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
            {rolesToDisplay.length === 0 ? (
              <tr>
                <Td colSpan={visibleHeaders.length + 1} align='center' className='text-zinc-400 text-[9px] sm:text-[10px] md:text-xs py-3 sm:py-4 md:py-5'>
                  {t('conditions.noRolesInSection')}
                </Td>
              </tr>
            ) : (
              rolesToDisplay.map((role: string) => {
                const hasJornadaValue = prices[role]?.['Precio jornada'];
                
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
                      const isJornada = h === 'Precio jornada';
                      
                      return (
                        <Td key={h} align='center'>
                          <input
                            type='number'
                            value={prices[role]?.[h] ?? ''}
                            onChange={e => !readOnly && handlePriceChange(sectionKey, role, h, (e.target as HTMLInputElement).value)}
                            placeholder={isJornada ? '€' : ''}
                            step='0.01'
                            disabled={readOnly || (!isJornada && !hasJornadaValue)}
                            readOnly={readOnly}
                            className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg border border-neutral-border focus:outline-none focus:ring-1 text-center text-[9px] sm:text-[10px] md:text-xs ${
                              readOnly || (!isJornada && !hasJornadaValue)
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
