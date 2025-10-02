// JSX runtime import not needed due to jsx: react-jsx

interface ExtrasSummaryProps {
  horasExtra: number;
  turnAround: number;
  nocturnidad: number;
  penaltyLunch: number;
}

export default function ExtrasSummary({ horasExtra, turnAround, nocturnidad, penaltyLunch }: ExtrasSummaryProps) {
  const totalExtras = horasExtra + turnAround + nocturnidad + penaltyLunch;
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
    <div>
      <div className='text-right font-medium text-zinc-100 mb-1'>{totalExtras}</div>
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
