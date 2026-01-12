// JSX runtime import not needed due to jsx: react-jsx
import { useTranslation } from 'react-i18next';

interface WorkedDaysSummaryProps {
  carga: number;
  descarga: number;
  localizar: number;
  rodaje: number;
  oficina: number;
}

export default function WorkedDaysSummary({ carga, descarga, localizar, rodaje, oficina }: WorkedDaysSummaryProps) {
  const { t } = useTranslation();
  const parts: string[] = [];
  
  // Orden: Localizar, Oficina, Carga, Rodaje, Descarga
  if (localizar > 0) {
    parts.push(`${t('payroll.dayTypes.location')} x${localizar}`);
  }
  
  if (oficina > 0) {
    parts.push(`${t('payroll.dayTypes.office')} x${oficina}`);
  }
  
  if (carga > 0) {
    parts.push(`${t('payroll.dayTypes.loading')} x${carga}`);
  }
  
  if (rodaje > 0) {
    parts.push(`${t('payroll.dayTypes.shooting')} x${rodaje}`);
  }
  
  if (descarga > 0) {
    parts.push(`${t('payroll.dayTypes.unloading')} x${descarga}`);
  }
  
  // Si no hay ningún tipo de día, no mostrar nada
  if (parts.length === 0) {
    return null;
  }
  
  return (
    <div className='text-[8px] sm:text-[9px] md:text-[10px] text-zinc-200 space-y-0.5'>
      {parts.map((part, index) => (
        <div key={index}>{part}</div>
      ))}
    </div>
  );
}

