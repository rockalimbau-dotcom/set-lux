import { useState } from 'react';
import { DietasCellProps } from './ReportPersonRowsTypes';

interface UseDietasHandlersProps {
  val: string;
  pKey: string;
  concepto: string;
  fecha: string;
  readOnly: boolean;
  parseDietas: (raw: string) => { items: Set<string>; ticket: number | null; other: number | null };
  formatDietas: (items: Set<string>, ticket: number | null, other: number | null) => string;
  setCell: (pKey: string, concepto: string, fecha: string, value: any) => void;
}

/**
 * Convierte una traducción de dieta de vuelta al valor original en español
 * Esto asegura que siempre se guarde el valor canónico, independientemente del idioma
 */
function normalizeDietaToOriginal(translated: string): string {
  const t = translated.toLowerCase().trim();
  
  // Mapeo inverso: traducción -> valor original
  if (t === 'lunch' || t === 'dinar' || t === 'comida') return 'Comida';
  if (t === 'dinner' || t === 'sopar' || t === 'cena') return 'Cena';
  if (t.includes('diet without overnight') || t.includes('dieta sense pernoctar') || t.startsWith('dieta sin')) return 'Dieta sin pernoctar';
  if (t.includes('diet with overnight') || t.includes('dieta amb pernocta') || t.includes('dieta con pernocta') || t.includes('full diet') || t.includes('dieta completa')) return 'Dieta con pernocta';
  if (t === 'pocket expenses' || t === 'despeses de butxaca' || t.startsWith('gastos')) return 'Gastos de bolsillo';
  if (t === 'ticket' || t === 'bitllet') return 'Ticket';
  if (t === 'otros' || t === 'other' || t === 'altres') return 'Otros';
  
  // Si no coincide con ninguna traducción, devolver el valor original (por si ya está normalizado)
  return translated;
}

interface UseDietasHandlersReturn {
  parsed: { items: Set<string>; ticket: number | null; other: number | null };
  itemToRemove: string | null;
  setItemToRemove: (item: string | null) => void;
  handleAddItem: (item: string) => void;
  handleRemoveItem: (item: string) => void;
  handleRemoveTicket: () => void;
  handleTicketChange: (value: string) => void;
  handleRemoveOther: () => void;
  handleOtherChange: (value: string) => void;
}

/**
 * Hook to manage dietas cell handlers
 */
export function useDietasHandlers({
  val,
  pKey,
  concepto,
  fecha,
  readOnly,
  parseDietas,
  formatDietas,
  setCell,
}: UseDietasHandlersProps): UseDietasHandlersReturn {
  const parsed = parseDietas(val);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  const handleAddItem = (item: string) => {
    if (readOnly) return;
    // Normalizar la traducción al valor original antes de guardar
    const normalizedItem = normalizeDietaToOriginal(item);
    const items = new Set(parsed.items);
    const wasAlreadyAdded = items.has(normalizedItem);
    items.add(normalizedItem);
    // Si se añade "Ticket" por primera vez, siempre empezar con precio null (individual)
    // Si ya existía, mantener su precio actual
    const ticketPrice = items.has('Ticket') 
      ? (normalizedItem === 'Ticket' && !wasAlreadyAdded ? null : parsed.ticket)
      : null;
    const otherPrice = items.has('Otros')
      ? (normalizedItem === 'Otros' && !wasAlreadyAdded ? null : parsed.other)
      : null;
    const newStr = formatDietas(items, ticketPrice, otherPrice);
    setCell(pKey, concepto, fecha, newStr);
  };

  const handleRemoveItem = (item: string) => {
    if (readOnly) return;
    const currentParsed = parseDietas(val);
    const items = new Set(currentParsed.items);
    
    // Eliminar el item tal como viene del Set
    items.delete(item);
    
    const newStr = formatDietas(
      items,
      items.has('Ticket') ? currentParsed.ticket : null,
      items.has('Otros') ? currentParsed.other : null
    );
    setCell(pKey, concepto, fecha, newStr);
    setItemToRemove(null);
  };

  const handleRemoveTicket = () => {
    if (readOnly) return;
    const currentParsed = parseDietas(val);
    const items = new Set(currentParsed.items);
    items.delete('Ticket');
    const newStr = formatDietas(items, null, currentParsed.other);
    setCell(pKey, concepto, fecha, newStr);
    setItemToRemove(null);
  };

  const handleTicketChange = (value: string) => {
    if (readOnly) return;
    const n = value === '' ? null : Number(value);
    const newStr = formatDietas(parsed.items, n, parsed.other);
    setCell(pKey, concepto, fecha, newStr);
  };

  const handleRemoveOther = () => {
    if (readOnly) return;
    const currentParsed = parseDietas(val);
    const items = new Set(currentParsed.items);
    items.delete('Otros');
    const newStr = formatDietas(items, currentParsed.ticket, null);
    setCell(pKey, concepto, fecha, newStr);
    setItemToRemove(null);
  };

  const handleOtherChange = (value: string) => {
    if (readOnly) return;
    const n = value === '' ? null : Number(value);
    const newStr = formatDietas(parsed.items, parsed.ticket, n);
    setCell(pKey, concepto, fecha, newStr);
  };

  return {
    parsed,
    itemToRemove,
    setItemToRemove,
    handleAddItem,
    handleRemoveItem,
    handleRemoveTicket,
    handleTicketChange,
    handleRemoveOther,
    handleOtherChange,
  };
}

