import { normalizeJornadaType } from '@shared/utils/jornadaTranslations';

export type NeedsTheme = 'light' | 'dark';

type DayTypePalette = {
  key: string;
  bg: string;
  headerBg: string;
  border: string;
  controlBg: string;
  controlBorder: string;
  controlText: string;
};

const LIGHT_PALETTE: Record<string, DayTypePalette> = {
  shooting: {
    key: 'shooting',
    bg: '#EFF6FF',
    headerBg: '#BFDBFE',
    border: '#60A5FA',
    controlBg: '#DBEAFE',
    controlBorder: '#60A5FA',
    controlText: '#1D4ED8',
  },
  holidayShooting: {
    key: 'holidayShooting',
    bg: '#FFE4E6',
    headerBg: '#FDA4AF',
    border: '#FB7185',
    controlBg: '#FFE4E6',
    controlBorder: '#FB7185',
    controlText: '#BE123C',
  },
  logistics: {
    key: 'logistics',
    bg: '#FFF7ED',
    headerBg: '#FED7AA',
    border: '#FDBA74',
    controlBg: '#FFEDD5',
    controlBorder: '#FB923C',
    controlText: '#C2410C',
  },
  advance: {
    key: 'advance',
    bg: '#FFFBEB',
    headerBg: '#FDE68A',
    border: '#FCD34D',
    controlBg: '#FEF3C7',
    controlBorder: '#F59E0B',
    controlText: '#92400E',
  },
  locationOffice: {
    key: 'locationOffice',
    bg: '#ECFEFF',
    headerBg: '#A5F3FC',
    border: '#67E8F9',
    controlBg: '#CFFAFE',
    controlBorder: '#22D3EE',
    controlText: '#0E7490',
  },
  camera: {
    key: 'camera',
    bg: '#F5F3FF',
    headerBg: '#DDD6FE',
    border: '#C4B5FD',
    controlBg: '#EDE9FE',
    controlBorder: '#A78BFA',
    controlText: '#6D28D9',
  },
  travelHalf: {
    key: 'travelHalf',
    bg: '#F0FDFA',
    headerBg: '#99F6E4',
    border: '#5EEAD4',
    controlBg: '#CCFBF1',
    controlBorder: '#2DD4BF',
    controlText: '#0F766E',
  },
  rest: {
    key: 'rest',
    bg: '#E2E8F0',
    headerBg: '#CBD5E1',
    border: '#94A3B8',
    controlBg: '#CBD5E1',
    controlBorder: '#94A3B8',
    controlText: '#334155',
  },
  end: {
    key: 'end',
    bg: '#E5E7EB',
    headerBg: '#D1D5DB',
    border: '#6B7280',
    controlBg: '#D1D5DB',
    controlBorder: '#6B7280',
    controlText: '#1F2937',
  },
};

const DARK_PALETTE: Record<string, DayTypePalette> = {
  shooting: {
    key: 'shooting',
    bg: 'rgba(37, 99, 235, 0.18)',
    headerBg: 'rgba(37, 99, 235, 0.52)',
    border: '#60A5FA',
    controlBg: 'rgba(37, 99, 235, 0.30)',
    controlBorder: '#60A5FA',
    controlText: '#DBEAFE',
  },
  holidayShooting: {
    key: 'holidayShooting',
    bg: 'rgba(244, 63, 94, 0.18)',
    headerBg: 'rgba(244, 63, 94, 0.52)',
    border: '#FB7185',
    controlBg: 'rgba(244, 63, 94, 0.30)',
    controlBorder: '#FB7185',
    controlText: '#FFE4E6',
  },
  logistics: {
    key: 'logistics',
    bg: 'rgba(249, 115, 22, 0.18)',
    headerBg: 'rgba(249, 115, 22, 0.52)',
    border: '#FDBA74',
    controlBg: 'rgba(249, 115, 22, 0.30)',
    controlBorder: '#FDBA74',
    controlText: '#FFEDD5',
  },
  advance: {
    key: 'advance',
    bg: 'rgba(245, 158, 11, 0.18)',
    headerBg: 'rgba(245, 158, 11, 0.52)',
    border: '#FCD34D',
    controlBg: 'rgba(245, 158, 11, 0.30)',
    controlBorder: '#FCD34D',
    controlText: '#FEF3C7',
  },
  locationOffice: {
    key: 'locationOffice',
    bg: 'rgba(6, 182, 212, 0.16)',
    headerBg: 'rgba(6, 182, 212, 0.50)',
    border: '#67E8F9',
    controlBg: 'rgba(6, 182, 212, 0.28)',
    controlBorder: '#67E8F9',
    controlText: '#CFFAFE',
  },
  camera: {
    key: 'camera',
    bg: 'rgba(139, 92, 246, 0.18)',
    headerBg: 'rgba(139, 92, 246, 0.52)',
    border: '#C4B5FD',
    controlBg: 'rgba(139, 92, 246, 0.30)',
    controlBorder: '#C4B5FD',
    controlText: '#EDE9FE',
  },
  travelHalf: {
    key: 'travelHalf',
    bg: 'rgba(20, 184, 166, 0.16)',
    headerBg: 'rgba(20, 184, 166, 0.50)',
    border: '#5EEAD4',
    controlBg: 'rgba(20, 184, 166, 0.28)',
    controlBorder: '#5EEAD4',
    controlText: '#CCFBF1',
  },
  rest: {
    key: 'rest',
    bg: 'rgba(148, 163, 184, 0.22)',
    headerBg: 'rgba(148, 163, 184, 0.32)',
    border: '#CBD5E1',
    controlBg: 'rgba(148, 163, 184, 0.34)',
    controlBorder: '#CBD5E1',
    controlText: '#F8FAFC',
  },
  end: {
    key: 'end',
    bg: 'rgba(107, 114, 128, 0.26)',
    headerBg: 'rgba(107, 114, 128, 0.38)',
    border: '#D1D5DB',
    controlBg: 'rgba(107, 114, 128, 0.40)',
    controlBorder: '#D1D5DB',
    controlText: '#F9FAFB',
  },
};

function getPaletteKey(tipo: string | null | undefined): string {
  switch (normalizeJornadaType(tipo)) {
    case 'Rodaje':
      return 'shooting';
    case 'Rodaje Festivo':
      return 'holidayShooting';
    case 'Carga':
    case 'Descarga':
      return 'logistics';
    case 'Prelight':
    case 'Recogida':
      return 'advance';
    case 'Localizar':
    case 'Oficina':
      return 'locationOffice';
    case 'Pruebas de cámara':
      return 'camera';
    case 'Travel Day':
    case '1/2 jornada':
      return 'travelHalf';
    case 'Descanso':
      return 'rest';
    case 'Fin':
      return 'end';
    default:
      return '';
  }
}

export function getNeedsDayTypePalette(
  tipo: string | null | undefined,
  theme: NeedsTheme = 'light'
): DayTypePalette | null {
  const key = getPaletteKey(tipo);
  if (!key) return null;
  return (theme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE)[key] || null;
}
