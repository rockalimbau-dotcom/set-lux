// JSX runtime import not needed due to jsx: react-jsx
import { useTranslation } from 'react-i18next';

interface ExtrasSummaryProps {
  horasExtra: number;
  turnAround: number;
  nocturnidad: number;
  penaltyLunch: number;
}

export default function ExtrasSummary({ horasExtra, turnAround, nocturnidad, penaltyLunch }: ExtrasSummaryProps) {
  const { t } = useTranslation();
  const totalExtras = horasExtra + turnAround + nocturnidad + penaltyLunch;
  const parts: string[] = [];
  
  if (horasExtra > 0) {
    parts.push(`${t('payroll.concepts.extraHours')} x${horasExtra}`);
  }
  
  if (turnAround > 0) {
    parts.push(`${t('payroll.concepts.turnAround')} x${turnAround}`);
  }
  
  if (nocturnidad > 0) {
    parts.push(`${t('payroll.concepts.nightShift')} x${nocturnidad}`);
  }
  
  if (penaltyLunch > 0) {
    parts.push(`${t('payroll.concepts.penaltyLunch')} x${penaltyLunch}`);
  }
  
  // Si no hay ningún extra, no mostrar nada
  if (totalExtras === 0 && parts.length === 0) {
    return null;
  }
  
  return (
    <div>
      {totalExtras > 0 && (
        <div className='text-center font-medium text-zinc-100 mb-1'>{totalExtras}</div>
      )}
      {parts.length > 0 && (
        <div className='text-[10px] text-zinc-200 space-y-0.5'>
          {parts.map((part, index) => (
            <div key={index}>{part}</div>
          ))}
        </div>
      )}
    </div>
  );
}
