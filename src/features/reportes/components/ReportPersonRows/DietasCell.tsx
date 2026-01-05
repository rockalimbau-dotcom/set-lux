import React, { useRef } from 'react';
import { Td } from '@shared/components';
import { useTranslation } from 'react-i18next';
import { DietasCellProps } from './ReportPersonRowsTypes';
import { useClickOutside } from './useClickOutside';
import { useDietasHandlers } from './useDietasHandlers';
import { DietasDropdown } from './DietasDropdown';
import { DietasItemsList } from './DietasItemsList';
import { DietasRemoveModal } from './DietasRemoveModal';

const DietasCell: React.FC<DietasCellProps> = ({
  pKey,
  concepto,
  fecha,
  val,
  cellClasses,
  theme,
  focusColor,
  readOnly,
  dropdownKey,
  dropdownState,
  setDropdownState,
  parseDietas,
  formatDietas,
  dietasOptions,
  setCell,
}) => {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    parsed,
    itemToRemove,
    setItemToRemove,
    handleAddItem,
    handleRemoveItem,
    handleRemoveTicket,
    handleTicketChange,
  } = useDietasHandlers({
    val,
    pKey,
    concepto,
    fecha,
    readOnly,
    parseDietas,
    formatDietas,
    setCell,
  });

  useClickOutside(
    dropdownRef,
    dropdownState.isOpen,
    () => setDropdownState(dropdownKey, { isOpen: false })
  );

  return (
    <Td key={`${pKey}_${concepto}_${fecha}`} className={`text-center ${cellClasses}`} align='center'>
      <div className='flex flex-col gap-2 items-center justify-center'>
        <div className='w-full relative' ref={dropdownRef}>
          <button
            type='button'
            onClick={() => !readOnly && setDropdownState(dropdownKey, { isOpen: !dropdownState.isOpen })}
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setDropdownState(dropdownKey, { isButtonHovered: true })}
            onMouseLeave={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
            onBlur={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
            className={`w-full px-2 py-1 rounded-lg border focus:outline-none text-sm text-left transition-colors ${
              theme === 'light' 
                ? 'bg-white text-gray-900' 
                : 'bg-black/40 text-zinc-300'
            } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : t('reports.selectDiet')}
            style={{
              borderWidth: dropdownState.isButtonHovered ? '1.5px' : '1px',
              borderStyle: 'solid',
              borderColor: dropdownState.isButtonHovered && theme === 'light' 
                ? '#0476D9' 
                : (dropdownState.isButtonHovered && theme === 'dark'
                  ? '#fff'
                  : 'var(--border)'),
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              paddingRight: '2rem',
            }}
          >
            &nbsp;
          </button>
          <DietasDropdown
            isOpen={dropdownState.isOpen && !readOnly}
            theme={theme}
            focusColor={focusColor}
            dietasOptions={dietasOptions}
            dropdownState={dropdownState}
            onSelectOption={(opt) => {
              handleAddItem(opt);
              setDropdownState(dropdownKey, { isOpen: false, hoveredOption: null });
            }}
            onHoverOption={(opt) => setDropdownState(dropdownKey, { hoveredOption: opt })}
          />
        </div>

        <DietasItemsList
          items={parsed.items}
          ticket={parsed.ticket}
          readOnly={readOnly}
          onRemoveItem={(item) => setItemToRemove(item)}
          onRemoveTicket={() => setItemToRemove('Ticket')}
          onTicketChange={handleTicketChange}
        />
      </div>
      
      {itemToRemove && (
        <DietasRemoveModal
          itemToRemove={itemToRemove}
          onCancel={() => setItemToRemove(null)}
          onConfirm={() => {
            if (itemToRemove === 'Ticket') {
              handleRemoveTicket();
            } else {
              handleRemoveItem(itemToRemove);
            }
          }}
        />
      )}
    </Td>
  );
};

export default DietasCell;
