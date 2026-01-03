// JSX runtime import not needed due to jsx: react-jsx
import { useTranslation } from 'react-i18next';

interface DietasSummaryProps {
  dietasCount: Map<string, number>;
  ticketTotal: number;
}

export default function DietasSummary({ dietasCount, ticketTotal }: DietasSummaryProps) {
  const { t } = useTranslation();
  
  // Helper para traducir items de dietas
  const translateDietItem = (item: string): string => {
    const itemMap: Record<string, string> = {
      'Comida': t('payroll.dietOptions.lunch'),
      'Cena': t('payroll.dietOptions.dinner'),
      'Desayuno': t('payroll.dietOptions.breakfast'),
      'Dieta sin pernoctar': t('payroll.dietOptions.dietNoOvernight'),
      'Dieta completa + desayuno': t('payroll.dietOptions.dietFullBreakfast'),
      'Gastos de bolsillo': t('payroll.dietOptions.pocketExpenses'),
      'Ticket': t('payroll.dietOptions.ticket'),
    };
    return itemMap[item] || item;
  };
  
  const want = [
    'Comida',
    'Cena',
    'Dieta sin pernoctar',
    'Dieta completa + desayuno',
    'Gastos de bolsillo',
    'Ticket',
  ];
  const parts: string[] = [];
  let totalDietas = 0;
  
  for (const label of want) {
    if (label === 'Ticket') {
      if (ticketTotal > 0) {
        parts.push(`${translateDietItem('Ticket')} €${ticketTotal.toFixed(2)}`);
        totalDietas += 1; // Contar ticket como 1 dieta
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
      <div className='text-center font-medium text-zinc-100 mb-1'>{totalDietas}</div>
      <div className='text-[10px] text-zinc-200 space-y-0.5'>
        {parts.map((part, index) => (
          <div key={index}>{part}</div>
        ))}
      </div>
    </div>
  );
}


