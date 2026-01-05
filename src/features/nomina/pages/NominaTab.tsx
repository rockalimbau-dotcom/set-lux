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
  // Debug para ver qué está recibiendo
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.TAB] mode:', mode, 'project.conditions?.tipo:', project?.conditions?.tipo);
    console.debug('[NOMINA.TAB] project:', project);
  }
  
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


