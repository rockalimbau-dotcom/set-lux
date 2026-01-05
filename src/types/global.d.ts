// Global type declarations for JSX modules

declare module '@features/condiciones/pages/CondicionesTab.jsx' {
  const CondicionesTab: React.ComponentType<any>;
  export default CondicionesTab;
}

declare module '@features/equipo/pages/EquipoTab.jsx' {
  const EquipoTab: React.ComponentType<any>;
  export default EquipoTab;
}

declare module '@features/necesidades/pages/NecesidadesTab.jsx' {
  const NecesidadesTab: React.ComponentType<any>;
  export default NecesidadesTab;
}

declare module '@features/nomina/pages/NominaTab.jsx' {
  const NominaTab: React.ComponentType<any>;
  export default NominaTab;
}

declare module '@features/planificacion/pages/PlanificacionTab.jsx' {
  const PlanificacionTab: React.ComponentType<any>;
  export default PlanificacionTab;
}

declare module '@features/reportes/pages/ReportesTab.jsx' {
  const ReportesTab: React.ComponentType<any>;
  export default ReportesTab;
}

declare module '@shared/components/LogoSetLux' {
  const LogoSetLux: React.ComponentType<any>;
  export default LogoSetLux;
}

declare module '@shared/components' {
  export const Th: React.ComponentType<any>;
  export const Td: React.ComponentType<any>;
  export const Row: React.ComponentType<any>;
  const _default: any;
  export default _default;
}

declare module '@features/nomina/components/DietasSummary.jsx' {
  const DietasSummary: React.ComponentType<any>;
  export default DietasSummary;
}

declare module '*.jsx' {
  const Component: React.ComponentType<any>;
  export default Component;
}
