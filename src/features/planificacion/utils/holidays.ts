import { mdKey } from '../constants';
import { norm } from '@shared/utils/normalize';

interface Conditions {
  festivosDates?: string[];
  mensual?: {
    festivosDates?: string[];
    festivosTemplate?: string;
  };
  semanal?: {
    festivosDates?: string[];
    festivosTemplate?: string;
  };
  diario?: {
    festivosDates?: string[];
    festivosTemplate?: string;
  };
  publicidad?: {
    festivosDates?: string[];
    festivosTemplate?: string;
  }; // Compatibilidad hacia atrás
  festivosTemplate?: string;
  festivos?: string;
}

export function extractHolidaySets(conditions: Conditions): {
  full: Set<string>;
  md: Set<string>;
} {
  const full = new Set<string>();
  const md = new Set<string>();

  const norm = (s: any): string =>
    String(s ?? '')
      .replace(/\u00A0/g, ' ')
      .replace(/[–—−]/g, '-')
      .replace(/[。·•]/g, '.')
      .replace(/\s+/g, ' ')
      .trim();

  const explicitArrays = [
    conditions?.festivosDates,
    conditions?.mensual?.festivosDates,
    conditions?.semanal?.festivosDates,
    conditions?.diario?.festivosDates,
    conditions?.publicidad?.festivosDates, // Compatibilidad hacia atrás
  ].filter(Array.isArray);

  for (const arr of explicitArrays) {
    for (const s of arr) {
      const ds = norm(s);
      if (/^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/.test(ds)) {
        const [d, m, yRaw] = ds.split('/').map(Number);
        const y = yRaw < 100 ? 2000 + yRaw : yRaw;
        full.add(
          `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        );
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) {
        full.add(ds);
      } else if (/^\d{1,2}[\/\-]\d{1,2}$/.test(ds)) {
        const [d, m] = ds.split(/[\/\-]/).map(Number);
        md.add(mdKey(m, d));
      }
    }
  }

  const texts = [
    conditions?.mensual?.festivosTemplate,
    conditions?.semanal?.festivosTemplate,
    conditions?.diario?.festivosTemplate,
    conditions?.publicidad?.festivosTemplate, // Compatibilidad hacia atrás
    conditions?.festivosTemplate,
    conditions?.festivos,
  ]
    .filter(Boolean)
    .map(norm);

  const re = /(?:^|[\s(),;:.\-])(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/g;

  for (const t of texts) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(String(t)))) {
      const d = Number(m[1]);
      const mo = Number(m[2]);
      const yPart = m[3];
      if (yPart) {
        const yNum = Number(yPart);
        const y = yNum < 100 ? 2000 + yNum : yNum;
        full.add(
          `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        );
      } else {
        md.add(mdKey(mo, d));
      }
    }
  }

  return { full, md };
}
