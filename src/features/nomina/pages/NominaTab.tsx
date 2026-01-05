import NominaMensual from '@features/nomina/nominas/NominaMensual';
import NominaSemanal from '@features/nomina/nominas/NominaSemanal';
import NominaPublicidad from '@features/nomina/nominas/NominaPublicidad';
import { AnyRecord } from '@shared/types/common';

interface NominaTabProps extends AnyRecord {
  project?: any;
  mode?: 'semanal' | 'mensual' | 'publicidad';
  readOnly?: boolean;
}

export default function NominaTab({ project, mode, readOnly = false, ...props }: NominaTabProps) {
  // Usar el componente específico según el modo
  if (mode === 'publicidad') {
    return <NominaPublicidad project={project} readOnly={readOnly} {...props} />;
  }
  
  if (mode === 'semanal') {
    return <NominaSemanal project={project} readOnly={readOnly} {...props} />;
  }
  
  // Por defecto, usar NominaMensual para mensual
  return <NominaMensual project={project} readOnly={readOnly} {...props} />;
}


