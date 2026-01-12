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
  // Asegurar que todos los valores sean números (igual que nocturnidad)
  const horasExtraNum = Number(horasExtra) || 0;
  const turnAroundNum = Number(turnAround) || 0;
  const nocturnidadNum = Number(nocturnidad) || 0;
  const penaltyLunchNum = Number(penaltyLunch) || 0;
  const totalExtras = horasExtraNum + turnAroundNum + nocturnidadNum + penaltyLunchNum;
  const parts: string[] = [];
  
  if (horasExtraNum > 0) {
    parts.push(`${t('payroll.concepts.extraHours')} x${horasExtraNum}`);
  }
  
  if (turnAroundNum > 0) {
    parts.push(`${t('payroll.concepts.turnAround')} x${turnAroundNum}`);
  }
  
  if (nocturnidadNum > 0) {
    parts.push(`${t('payroll.concepts.nightShift')} x${nocturnidadNum}`);
  }
  
  if (penaltyLunchNum > 0) {
    parts.push(`${t('payroll.concepts.penaltyLunch')} x${penaltyLunchNum}`);
  }
  
  // Si no hay ningún extra, no mostrar nada
  if (totalExtras === 0 && parts.length === 0) {
    return null;
  }
  
  return (
    <div>
      {totalExtras > 0 && (
        <div className='text-center font-medium text-zinc-100 mb-1 text-[9px] sm:text-[10px] md:text-xs'>{totalExtras}</div>
      )}
      {parts.length > 0 && (
        <div className='text-[8px] sm:text-[9px] md:text-[10px] text-zinc-200 space-y-0.5'>
          {parts.map((part, index) => (
            <div key={index}>{part}</div>
          ))}
        </div>
      )}
    </div>
  );
}
