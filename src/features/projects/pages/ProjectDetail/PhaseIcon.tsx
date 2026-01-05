// Monochrome project icons (orange/blue friendly). Using currentColor so parent can control color
export function PhaseIcon({ name, color = '#60a5fa', stroke = '#ffffff' }: { name: 'condiciones' | 'equipo' | 'planificacion' | 'reportes' | 'nomina' | 'necesidades'; color?: string; stroke?: string }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24' } as const;
  const themeNow = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';
  const fill = themeNow === 'light' ? '#f97316' : color;
  const strokeColor = themeNow === 'light' ? '#111827' : stroke;
  switch (name) {
    case 'condiciones':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M6 2h9a2 2 0 0 1 1.414.586l3 3A2 2 0 0 1 20 7v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h12V7.828L14.172 4H6zm3 6h6v2H9v-2zm0 4h6v2H9v-2z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
    case 'equipo':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M8 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm8 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM2 20a6 6 0 0 1 12 0v2H2v-2zm12 2v-2a6 6 0 0 1 10 0v2H14z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
    case 'planificacion':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h2V2zm15 8v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8h20zM7 14h4v4H7v-4z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
    case 'reportes':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M4 3h16v2H4V3zm2 6h3v12H6V9zm5 4h3v8h-3v-8zm5-6h3v14h-3V7z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
    case 'nomina':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zm2 2v6h14V8H5zm7 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
    case 'necesidades':
      return (
        <svg {...common} fill={fill} xmlns='http://www.w3.org/2000/svg'>
          <path d='M21 7l-4-4-3 3 4 4 3-3zM2 20l7-2-5-5-2 7zm11.586-9.414l-7.172 7.172 2.828 2.828 7.172-7.172-2.828-2.828z' stroke={strokeColor} strokeWidth='1'/>
        </svg>
      );
  }
}

