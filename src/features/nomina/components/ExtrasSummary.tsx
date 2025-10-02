// JSX runtime import not needed due to jsx: react-jsx

interface ExtrasSummaryProps {
  horasExtra: number;
  turnAround: number;
  nocturnidad: number;
  penaltyLunch: number;
}

export default function ExtrasSummary({ horasExtra, turnAround, nocturnidad, penaltyLunch }: ExtrasSummaryProps) {
  const parts: string[] = [];
  
  if (horasExtra > 0) {
    parts.push(`Horas extra x${horasExtra}`);
  }
  
  if (turnAround > 0) {
    parts.push(`Turn Around x${turnAround}`);
  }
  
  if (nocturnidad > 0) {
    parts.push(`Nocturnidad x${nocturnidad}`);
  }
  
  if (penaltyLunch > 0) {
    parts.push(`Penalty lunch x${penaltyLunch}`);
  }
  
  return (
    <span className='text-xs text-zinc-200'>{parts.join(' · ')}</span>
  );
}
