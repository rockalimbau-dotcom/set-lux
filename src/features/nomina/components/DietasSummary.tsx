// JSX runtime import not needed due to jsx: react-jsx

interface DietasSummaryProps {
  dietasCount: Map<string, number>;
  ticketTotal: number;
}

export default function DietasSummary({ dietasCount, ticketTotal }: DietasSummaryProps) {
  const want = [
    'Comida',
    'Cena',
    'Dieta sin pernoctar',
    'Dieta completa + desayuno',
    'Gastos de bolsillo',
    'Ticket',
  ];
  const parts: string[] = [];
  for (const label of want) {
    if (label === 'Ticket') {
      if (ticketTotal > 0) parts.push(`Ticket €${ticketTotal.toFixed(2)}`);
    } else {
      const cnt = dietasCount.get(label) || 0;
      if (cnt > 0) parts.push(`${label} x${cnt}`);
    }
  }
  return (
    <span className='text-xs text-zinc-200'>{parts.join(' · ')}</span>
  );
}


