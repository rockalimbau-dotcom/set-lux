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
      <div className='text-xs text-zinc-400 mb-4 flex items-center justify-between'>
        <span dangerouslySetInnerHTML={{ __html: t('conditions.introduceMonthlyPrice') }} />
        <div className='relative'>
          {PRICE_ROLES.filter(r => !roles.includes(r)).length === 0 ? (
            <button
              disabled
              className='px-3 py-1 text-sm bg-gray-500 text-white rounded-lg cursor-not-allowed'
            >
              {t('conditions.allRoles')}
            </button>
          ) : (
            <>
              <button
                onClick={() => !readOnly && setShowRoleSelect(!showRoleSelect)}
                disabled={readOnly}
                className={`${btnAddRole} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={readOnly ? t('conditions.projectClosed') : t('conditions.addRole')}
              >
                {t('conditions.addRole')}
              </button>
              {showRoleSelect && (
                <div 
                  className='absolute right-0 top-full mt-1 bg-blue-200 border border-blue-300 dark:bg-amber-800 dark:border-amber-600 rounded-lg shadow-lg z-10 min-w-[150px] max-h-60 overflow-y-auto'
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
                      onClick={() => addRole(role)}
                      className='w-full text-left px-3 py-2 text-sm text-white hover:bg-blue-300 dark:hover:bg-amber-600/40 transition-colors'
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
      <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 overflow-x-auto'>
        <table className='min-w-[920px] w-full border-collapse text-sm'>
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
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => {
                        if (readOnly) return;
                        setRoleToDelete(role);
                      }}
                      disabled={readOnly}
                      className={`text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:text-amber-500 dark:hover:bg-amber-900/20 font-bold text-sm w-6 h-6 flex items-center justify-center rounded transition-all hover:scale-110 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      className={`w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-center ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
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

