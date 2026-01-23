// JSX runtime import not needed due to jsx: react-jsx
import { useTranslation } from 'react-i18next';

interface DietasSummaryProps {
  dietasCount: Map<string, number>;
  ticketTotal: number;
  otherTotal: number;
}

export default function DietasSummary({ dietasCount, ticketTotal, otherTotal }: DietasSummaryProps) {
  const { t } = useTranslation();
  
  // Helper para traducir items de dietas
  const translateDietItem = (item: string): string => {
    const itemMap: Record<string, string> = {
      'Comida': t('payroll.dietOptions.lunch'),
      'Cena': t('payroll.dietOptions.dinner'),
      'Dieta sin pernoctar': t('payroll.dietOptions.dietNoOvernight'),
      'Dieta con pernocta': t('payroll.dietOptions.dietWithOvernight'),
      'Gastos de bolsillo': t('payroll.dietOptions.pocketExpenses'),
      'Ticket': t('payroll.dietOptions.ticket'),
      'Otros': t('payroll.dietOptions.other'),
    };
    return itemMap[item] || item;
  };
  
  const want = [
    'Comida',
    'Cena',
    'Dieta sin pernoctar',
    'Dieta con pernocta',
    'Gastos de bolsillo',
    'Ticket',
    'Otros',
  ];
  const parts: string[] = [];
  let totalDietas = 0;
  
  for (const label of want) {
    if (label === 'Ticket') {
      if (ticketTotal > 0) {
        parts.push(`${translateDietItem('Ticket')} ${ticketTotal.toFixed(2)}€`);
        totalDietas += 1; // Contar ticket como 1 dieta
      }
    } else if (label === 'Otros') {
      if (otherTotal > 0) {
        parts.push(`${translateDietItem('Otros')} ${otherTotal.toFixed(2)}€`);
        totalDietas += 1; // Contar otros como 1 dieta
      }
    } else {
      const cnt = dietasCount.get(label) || 0;
      if (cnt > 0) {
        parts.push(`${translateDietItem(label)} x${cnt}`);
        totalDietas += cnt;
      }
    }
  }
  
  if (parts.length === 0) {
    return <span></span>;
  }
  
  return (
    <div>
      <div className='text-center font-medium text-zinc-100 mb-1 text-[9px] sm:text-[10px] md:text-xs'>{totalDietas}</div>
      <div className='text-[8px] sm:text-[9px] md:text-[10px] text-zinc-200 space-y-0.5'>
        {parts.map((part, index) => (
          <div key={index}>{part}</div>
        ))}
      </div>
    </div>
  );
}


