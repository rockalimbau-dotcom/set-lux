import React from 'react';
import { Td } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import { translateConcept, translateDietItem, personaKeyFrom, calculateTotal } from './ReportPersonRowsHelpers';
import DietasCell from './DietasCell';
import SiNoCell from './SiNoCell';

interface ConceptRowProps {
  person: AnyRecord;
  concepto: string;
  block: 'base' | 'pre' | 'pick' | string;
  semana: readonly string[];
  data: AnyRecord;
  offMap: Map<string, boolean>;
  readOnly: boolean;
  horasExtraTipo: string;
  theme: 'dark' | 'light';
  focusColor: string;
  getDropdownState: (key: string) => { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean };
  setDropdownState: (key: string, updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>) => void;
  dietasOptions: string[];
  parseDietas: (raw: string) => { items: Set<string>; ticket: number | null };
  formatDietas: (items: Set<string>, ticket: number | null) => string;
  setCell: (pKey: string, concepto: string, fecha: string, value: any) => void;
  t: (key: string) => string;
}

export function ConceptRow({
  person,
  concepto,
  block,
  semana,
  data,
  offMap,
  readOnly,
  horasExtraTipo,
  theme,
  focusColor,
  getDropdownState,
  setDropdownState,
  dietasOptions,
  parseDietas,
  formatDietas,
  setCell,
  t,
}: ConceptRowProps) {
  const visualRole = person?.role || '';
  const name = person?.name || '';
  const pKey = personaKeyFrom(visualRole, name, block);

  return (
    <tr id={`person-${pKey}-rows`}>
      <Td className='whitespace-nowrap align-middle'>
        <div className='text-[9px] sm:text-[10px] md:text-xs text-zinc-300'>{translateConcept(concepto, t)}</div>
      </Td>

      {semana.map(fecha => {
        const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
        const key = `${visualRole}_${name}_${fecha}_${block}`;
        const off = offMap.get(key) ?? false;
        const cellClasses = off ? 'report-off-cell' : '';

        if (concepto === 'Dietas') {
          const dietasDropdownKey = `dietas_${pKey}_${concepto}_${fecha}`;
          const dropdownState = getDropdownState(dietasDropdownKey);
          return (
            <DietasCell
              key={`${pKey}_${concepto}_${fecha}`}
              pKey={pKey}
              concepto={concepto}
              fecha={fecha}
              val={val}
              cellClasses={cellClasses}
              theme={theme}
              focusColor={focusColor}
              readOnly={readOnly}
              dropdownKey={dietasDropdownKey}
              dropdownState={dropdownState}
              setDropdownState={setDropdownState}
              parseDietas={parseDietas}
              formatDietas={formatDietas}
              dietasOptions={dietasOptions}
              setCell={setCell}
            />
          );
        }

        if (
          concepto === 'Transporte' ||
          concepto === 'Nocturnidad' ||
          concepto === 'Penalty lunch'
        ) {
          return (
            <SiNoCell
              key={`${pKey}_${concepto}_${fecha}`}
              pKey={pKey}
              concepto={concepto}
              fecha={fecha}
              val={val}
              cellClasses={cellClasses}
              readOnly={readOnly}
              off={off}
              setCell={setCell}
            />
          );
        }

        // Para "Horas extra" con formato decimal, usar type="text" para permitir valores formateados
        const isHorasExtraFormatted = concepto === 'Horas extra' && 
          (horasExtraTipo === 'Hora Extra - Minutaje desde corte' || 
           horasExtraTipo === 'Hora Extra - Minutaje + Cortesía');
        
        const numericProps =
          isHorasExtraFormatted
            ? {
                type: 'text' as const,
                placeholder: '',
              }
            : concepto === 'Kilometraje'
            ? {
                type: 'number' as const,
                min: '0',
                step: '0.1',
                placeholder: '',
              }
            : {
                type: 'number' as const,
                min: '0',
                step: '1',
                placeholder: '',
              };

        return (
          <Td key={`${pKey}_${concepto}_${fecha}`} className={`text-center ${cellClasses}`} align='center'>
            <input
              {...numericProps}
              className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={val}
              onChange={e =>
                !readOnly && setCell(pKey, concepto, fecha, (e.target as HTMLInputElement).value)
              }
              disabled={off || readOnly}
              readOnly={readOnly}
            />
          </Td>
        );
      })}
      
      <Td className='text-center align-middle whitespace-nowrap'>
        <TotalCell
          pKey={pKey}
          concepto={concepto}
          semana={semana}
          data={data}
          parseDietas={parseDietas}
          horasExtraTipo={horasExtraTipo}
          t={t}
        />
      </Td>
    </tr>
  );
}

interface TotalCellProps {
  pKey: string;
  concepto: string;
  semana: readonly string[];
  data: AnyRecord;
  parseDietas: (raw: string) => { items: Set<string>; ticket: number | null };
  horasExtraTipo: string;
  t: (key: string) => string;
}

function TotalCell({ pKey, concepto, semana, data, parseDietas, horasExtraTipo, t }: TotalCellProps) {
  const total = calculateTotal(pKey, concepto, semana, data, parseDietas, horasExtraTipo);
  
  if (total === '') return null;
  
  // Si es dietas, mostrar desglose en píldoras
  if (concepto === 'Dietas' && typeof total === 'object' && total !== null && 'breakdown' in total) {
    const breakdown = (total as { breakdown: Map<string, number> }).breakdown;
    if (breakdown.size === 0) return null;
    
    return (
      <div className='flex flex-wrap gap-0.5 sm:gap-1 justify-center'>
        {Array.from(breakdown.entries()).map(([item, count]) => (
          <span
            key={item}
            className='inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded sm:rounded-md md:rounded-lg border border-neutral-border bg-black/40 text-[9px] sm:text-[10px] md:text-xs'
          >
            <span className='text-zinc-400'>x{count}</span>
            <span className='text-zinc-200'>{translateDietItem(item, t)}</span>
          </span>
        ))}
      </div>
    );
  }
  
  if (typeof total === 'number') {
    // Para números, mostrar con formato (sin decimales si es entero)
    return total % 1 === 0 ? total.toString() : total.toFixed(2);
  }
  
  return total.toString();
}

