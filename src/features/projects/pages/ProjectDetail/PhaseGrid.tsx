import { useTranslation } from 'react-i18next';
import { PhaseCard } from './PhaseCard';
import { PhaseIcon } from './PhaseIcon';
import { ProjectTab } from './ProjectDetailTypes';

interface PhaseGridProps {
  condModeLabel: string;
  condTipo: string;
  onTabChange: (tab: ProjectTab) => void;
}

export function PhaseGrid({ condModeLabel, condTipo, onTabChange }: PhaseGridProps) {
  const { t } = useTranslation();

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-4'>
      <PhaseCard
        title={condModeLabel === 'semanales' ? t('conditions.weekly') : condModeLabel === 'mensuales' ? t('conditions.monthly') : t('conditions.advertising')}
        icon={<PhaseIcon name='condiciones' color='#60a5fa' />}
        desc={t('conditions.description')}
        onClick={() => onTabChange('condiciones')}
        tutorialId='phase-condiciones'
      />
      <PhaseCard
        title={t('navigation.team')}
        icon={<PhaseIcon name='equipo' color='#60a5fa' />}
        desc={condTipo === 'diario' ? t('team.descriptionAdvertising') : t('team.description')}
        onClick={() => onTabChange('equipo')}
        tutorialId='phase-equipo'
      />

      <PhaseCard
        title={t('navigation.planning')}
        icon={<PhaseIcon name='planificacion' color='#60a5fa' />}
        desc={t('planning.description')}
        onClick={() => onTabChange('planificacion')}
        tutorialId='phase-planificacion'
      />
      <PhaseCard
        title={t('navigation.reports')}
        icon={<PhaseIcon name='reportes' color='#60a5fa' />}
        desc={t('reports.description')}
        onClick={() => onTabChange('reportes')}
        tutorialId='phase-reportes'
      />

      <PhaseCard
        title={t('navigation.payroll')}
        icon={<PhaseIcon name='nomina' color='#60a5fa' />}
        desc={t('payroll.description')}
        onClick={() => onTabChange('nomina')}
        tutorialId='phase-nomina'
      />

      <PhaseCard
        title={t('needs.title')}
        icon={<PhaseIcon name='necesidades' color='#60a5fa' />}
        desc={t('needs.description')}
        onClick={() => onTabChange('necesidades')}
        tutorialId='phase-necesidades'
      />
    </div>
  );
}

