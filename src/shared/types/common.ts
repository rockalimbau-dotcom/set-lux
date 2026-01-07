/**
 * Tipos compartidos comunes en toda la aplicación
 */

/**
 * Tipo genérico para objetos con propiedades dinámicas
 * Útil cuando no se conoce la estructura exacta del objeto
 */
export type AnyRecord = Record<string, any>;

/**
 * Tipo para objetos de proyecto
 */
interface Project {
  id?: string;
  nombre?: string;
  [key: string]: any;
}

/**
 * Tipo para semanas de planificación
 */
interface Week {
  id?: string;
  label?: string;
  startDate?: string;
  days?: Day[];
  [key: string]: any;
}

/**
 * Tipo para días de planificación
 */
interface Day {
  name?: string;
  tipo?: string;
  team?: Member[];
  prelight?: Member[];
  pickup?: Member[];
  [key: string]: any;
}

/**
 * Tipo para miembros del equipo
 */
interface Member {
  name?: string;
  role?: string;
  [key: string]: any;
}

