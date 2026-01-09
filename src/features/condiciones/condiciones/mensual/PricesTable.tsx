import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Th, Td } from '@shared/components';
import { PRICE_HEADERS, PRICE_ROLES } from '../shared.constants';
import { btnAddRole } from '@shared/utils/tailwindClasses';
import { AnyRecord } from '@shared/types/common';

interface PricesTableProps {
  model: AnyRecord;
  roles: string[];
  handleRoleChange: (role: string, header: string, value: string) => void;
  translateHeader: (header: string) => string;
  translateRoleName: (roleName: string) => string;
  setRoleToDelete: (role: string | null) => void;
  addRole: (newRole: string) => void;
  readOnly: boolean;
}

export function PricesTable({
  model,
  roles,
  handleRoleChange,
  translateHeader,
  translateRoleName,
  setRoleToDelete,
  addRole,
  readOnly,
}: PricesTableProps) {
  const { t } = useTranslation();
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  return (
    <>
      <div className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4 flex items-center justify-between gap-1 sm:gap-2'>
        <span className='flex-1' dangerouslySetInnerHTML={{ __html: t('conditions.introduceMonthlyPrice') }} />
        <div className='relative flex-shrink-0'>
          {PRICE_ROLES.filter(r => !roles.includes(r)).length === 0 ? (
            <button
              disabled
              className='px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 lg:px-3 lg:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm bg-gray-500 text-white rounded sm:rounded-md md:rounded-lg cursor-not-allowed whitespace-nowrap'
            >
              {t('conditions.allRoles')}
            </button>
          ) : (
            <>
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
                  {PRICE_ROLES.filter(r => !roles.includes(r)).map((role: string) => (
                    <button
                      key={role}
                      onClick={() => {
                        addRole(role);
                        setShowRoleSelect(false);
                      }}
                      className='w-full text-left px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-2 text-[8px] sm:text-[9px] md:text-[10px] lg:text-sm text-gray-900 dark:text-white hover:bg-blue-100 dark:hover:bg-amber-600/40 transition-colors'
                    >
                      {translateRoleName(role)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <section className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90 overflow-x-auto'>
        <table className='min-w-[600px] sm:min-w-[720px] md:min-w-[920px] w-full border-collapse text-[9px] sm:text-[10px] md:text-xs lg:text-sm'>
          <thead>
            <tr>
              <Th align='left'>{t('conditions.rolePrice')}</Th>
              {PRICE_HEADERS.map(col => (
                <Th key={col} align='center'>{translateHeader(col)}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role: string) => (
              <tr key={role} className='relative'>
                <Td className='font-semibold whitespace-nowrap' align='middle'>
                  <div className='flex items-center gap-0.5 sm:gap-1'>
                    <button
                      onClick={() => {
                        if (readOnly) return;
                        setRoleToDelete(role);
                      }}
                      disabled={readOnly}
                      className={`text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:text-amber-500 dark:hover:bg-amber-900/20 font-bold text-[9px] sm:text-[10px] md:text-xs lg:text-sm w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center rounded sm:rounded-md transition-all hover:scale-110 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={readOnly ? t('conditions.projectClosed') : t('conditions.deleteRole')}
                    >
                      ✕
                    </button>
                    <span>{translateRoleName(role)}</span>
                  </div>
                </Td>
                {PRICE_HEADERS.map(h => (
                  <Td key={h} align='center'>
                    <input
                      type='number'
                      value={model.prices?.[role]?.[h] ?? ''}
                      onChange={e => !readOnly && handleRoleChange(role, h, e.target.value)}
                      placeholder='€'
                      step='0.01'
                      disabled={readOnly}
                      readOnly={readOnly}
                      className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-center text-[9px] sm:text-[10px] md:text-xs ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

