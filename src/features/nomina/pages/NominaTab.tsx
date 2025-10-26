import NominaMensual from '@features/nomina/nominas/NominaMensual';
import NominaSemanal from '@features/nomina/nominas/NominaSemanal';
import NominaPublicidad from '@features/nomina/nominas/NominaPublicidad';

type AnyRecord = Record<string, any>;

interface NominaTabProps extends AnyRecord {
  project?: any;
  mode?: 'semanal' | 'mensual' | 'publicidad';
}

export default function NominaTab({ project, mode, ...props }: NominaTabProps) {
  // Debug para ver qué está recibiendo
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.TAB] mode:', mode, 'project.conditions?.tipo:', project?.conditions?.tipo);
    console.debug('[NOMINA.TAB] project:', project);
  }
  
  // Usar el componente específico según el modo
  if (mode === 'publicidad') {
    return <NominaPublicidad project={project} {...props} />;
  }
  
  if (mode === 'semanal') {
    return <NominaSemanal project={project} {...props} />;
  }
  
  // Por defecto, usar NominaMensual para mensual
  return <NominaMensual project={project} {...props} />;
}


