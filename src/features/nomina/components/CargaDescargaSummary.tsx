// JSX runtime import not needed due to jsx: react-jsx

interface CargaDescargaSummaryProps {
  carga: number;
  descarga: number;
}

export default function CargaDescargaSummary({ carga, descarga }: CargaDescargaSummaryProps) {
  const parts: string[] = [];
  
  if (carga > 0) {
    parts.push(`Carga x${carga}`);
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

