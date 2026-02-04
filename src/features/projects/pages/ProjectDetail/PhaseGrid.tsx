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

  const cards: Array<{
    key: ProjectTab;
    title: string;
    icon: JSX.Element;
    desc: string;
    onClick: () => void;
    tutorialId?: string;
    iconFrame?: boolean;
  }> = [
    {
      key: 'condiciones',
      title: condModeLabel === 'semanales' ? t('conditions.weekly') : condModeLabel === 'mensuales' ? t('conditions.monthly') : t('conditions.advertising'),
      icon: <PhaseIcon name='condiciones' color='#60a5fa' />,
      desc: t('conditions.description'),
      onClick: () => onTabChange('condiciones'),
      tutorialId: 'phase-condiciones',
      iconFrame: false,
    },
    {
      key: 'equipo',
      title: t('navigation.team'),
      icon: <PhaseIcon name='equipo' color='#60a5fa' />,
      desc: condTipo === 'diario' ? t('team.descriptionAdvertising') : t('team.description'),
      onClick: () => onTabChange('equipo'),
      tutorialId: 'phase-equipo',
      iconFrame: false,
    },
    {
      key: 'necesidades',
      title: t('needs.title'),
      icon: <PhaseIcon name='necesidades' color='#60a5fa' />,
      desc: t('needs.description'),
      onClick: () => onTabChange('necesidades'),
      tutorialId: 'phase-necesidades',
      iconFrame: false,
    },
    {
      key: 'reportes',
      title: t('navigation.reports'),
      icon: <PhaseIcon name='reportes' color='#60a5fa' />,
      desc: t('reports.description'),
      onClick: () => onTabChange('reportes'),
      tutorialId: 'phase-reportes',
      iconFrame: false,
    },
    {
      key: 'nomina',
      title: t('navigation.payroll'),
      icon: <PhaseIcon name='nomina' color='#60a5fa' />,
      desc: t('payroll.description'),
      onClick: () => onTabChange('nomina'),
      tutorialId: 'phase-nomina',
      iconFrame: false,
    },
  ];
  const lastIndex = cards.length - 1;

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-4'>
      {cards.map((card, idx) => {
        const isLastOdd = cards.length % 2 === 1 && idx === lastIndex;
        return (
          <PhaseCard
            key={card.key}
            title={card.title}
            icon={card.icon}
            desc={card.desc}
            onClick={card.onClick}
            tutorialId={card.tutorialId}
            iconFrame={card.iconFrame ?? true}
            className={isLastOdd ? 'sm:col-span-2 sm:justify-self-center sm:w-[calc(50%-0.5rem)]' : undefined}
          />
        );
      })}
    </div>
  );
}
