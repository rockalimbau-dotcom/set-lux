import { useTranslation } from 'react-i18next';
import {
  JORNADA_SEXTO_DIA,
  JORNADA_SEXTO_DIA_HALF,
} from '@shared/constants/jornadaTypes';
import { DayTypeSummaryLines, type DayTypeSummaryItem } from './DayTypeSummaryLines';

interface WorkedDaysSummaryProps {
  carga: number;
  descarga: number;
  localizar: number;
  rodaje: number;
  pruebasCamara?: number;
  oficina: number;
  prelight?: number;
  recogida?: number;
  sextoDia?: number;
  sextoDiaHalf?: number;
  showLocalizar?: boolean;
  showSextoDiaInBreakdown?: boolean;
  showSextoDiaHalfInBreakdown?: boolean;
}

export default function WorkedDaysSummary({
  carga,
  descarga,
  localizar,
  rodaje,
  pruebasCamara = 0,
  oficina,
  prelight = 0,
  recogida = 0,
  sextoDia = 0,
  sextoDiaHalf = 0,
  showLocalizar = false,
  showSextoDiaInBreakdown = true,
  showSextoDiaHalfInBreakdown = true,
}: WorkedDaysSummaryProps) {
  const { t } = useTranslation();

  const items: DayTypeSummaryItem[] = [
    ...(showLocalizar && localizar > 0
      ? [{ canonicalType: 'Localizar', label: t('payroll.dayTypes.location'), count: localizar }]
      : []),
    ...(oficina > 0
      ? [{ canonicalType: 'Oficina', label: t('payroll.dayTypes.office'), count: oficina }]
      : []),
    ...(carga > 0
      ? [{ canonicalType: 'Carga', label: t('payroll.dayTypes.loading'), count: carga }]
      : []),
    ...(pruebasCamara > 0
      ? [
          {
            canonicalType: 'Pruebas de cámara',
            label: t('payroll.dayTypes.cameraTests'),
            count: pruebasCamara,
          },
        ]
      : []),
    ...(rodaje > 0
      ? [{ canonicalType: 'Rodaje', label: t('payroll.dayTypes.shooting'), count: rodaje }]
      : []),
    ...(showSextoDiaInBreakdown && sextoDia > 0
      ? [{ canonicalType: JORNADA_SEXTO_DIA, label: t('payroll.dayTypes.sixthDay'), count: sextoDia }]
      : []),
    ...(showSextoDiaHalfInBreakdown && sextoDiaHalf > 0
      ? [
          {
            canonicalType: JORNADA_SEXTO_DIA_HALF,
            label: t('payroll.dayTypes.sixthDayHalf'),
            count: sextoDiaHalf,
          },
        ]
      : []),
    ...(prelight > 0
      ? [{ canonicalType: 'Prelight', label: t('payroll.dayTypes.prelight'), count: prelight }]
      : []),
    ...(recogida > 0
      ? [{ canonicalType: 'Recogida', label: t('payroll.dayTypes.pickup'), count: recogida }]
      : []),
    ...(descarga > 0
      ? [{ canonicalType: 'Descarga', label: t('payroll.dayTypes.unloading'), count: descarga }]
      : []),
  ];

  return <DayTypeSummaryLines items={items} />;
}
