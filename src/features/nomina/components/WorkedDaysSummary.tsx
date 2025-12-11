// JSX runtime import not needed due to jsx: react-jsx

interface WorkedDaysSummaryProps {
  carga: number;
  descarga: number;
  localizar: number;
  rodaje: number;
}

export default function WorkedDaysSummary({ carga, descarga, localizar, rodaje }: WorkedDaysSummaryProps) {
  const parts: string[] = [];
  
  // Orden: Localizar, Carga, Rodaje, Descarga
  if (localizar > 0) {
    parts.push(`Localizar x${localizar}`);
  }
  
  if (carga > 0) {
    parts.push(`Carga x${carga}`);
  }
  
  if (rodaje > 0) {
    parts.push(`Rodaje x${rodaje}`);
  }
  
  if (descarga > 0) {
    parts.push(`Descarga x${descarga}`);
  }
  
  // Si no hay ningún tipo de día, no mostrar nada
  if (parts.length === 0) {
    return null;
  }
  
  return (
    <div className='text-[10px] text-zinc-200 space-y-0.5'>
      {parts.map((part, index) => (
        <div key={index}>{part}</div>
      ))}
    </div>
  );
}

