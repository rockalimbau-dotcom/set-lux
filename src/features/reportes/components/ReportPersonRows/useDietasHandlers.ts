import { useState } from 'react';
import { DietasCellProps } from './ReportPersonRowsTypes';

interface UseDietasHandlersProps {
  val: string;
  pKey: string;
  concepto: string;
  fecha: string;
  readOnly: boolean;
  parseDietas: (raw: string) => { items: Set<string>; ticket: number | null };
  formatDietas: (items: Set<string>, ticket: number | null) => string;
  setCell: (pKey: string, concepto: string, fecha: string, value: any) => void;
}

interface UseDietasHandlersReturn {
  parsed: { items: Set<string>; ticket: number | null };
  itemToRemove: string | null;
  setItemToRemove: (item: string | null) => void;
  handleAddItem: (item: string) => void;
  handleRemoveItem: (item: string) => void;
  handleRemoveTicket: () => void;
  handleTicketChange: (value: string) => void;
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
    const items = new Set(parsed.items);
    items.add(item);
    const newStr = formatDietas(
      items,
      items.has('Ticket') ? parsed.ticket : null
    );
    setCell(pKey, concepto, fecha, newStr);
  };

  const handleRemoveItem = (item: string) => {
    if (readOnly) return;
    const currentParsed = parseDietas(val);
    const items = new Set(currentParsed.items);
    items.delete(item);
    const newStr = formatDietas(
      items,
      items.has('Ticket') ? currentParsed.ticket : null
    );
    setCell(pKey, concepto, fecha, newStr);
    setItemToRemove(null);
  };

  const handleRemoveTicket = () => {
    if (readOnly) return;
    const currentParsed = parseDietas(val);
    const items = new Set(currentParsed.items);
    items.delete('Ticket');
    const newStr = formatDietas(items, null);
    setCell(pKey, concepto, fecha, newStr);
    setItemToRemove(null);
  };

  const handleTicketChange = (value: string) => {
    if (readOnly) return;
    const n = value === '' ? null : Number(value);
    const newStr = formatDietas(parsed.items, n);
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
  };
}

