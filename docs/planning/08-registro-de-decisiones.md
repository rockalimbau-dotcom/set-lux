# Registro de decisiones de arquitectura y producto

Fecha de creación: 2026-04-25  
Estado: vivo.

Este documento registra decisiones ya tomadas para evitar reabrir debates sin motivo. Las preguntas todavía abiertas viven en [`06-decisiones-pendientes.md`](06-decisiones-pendientes.md).

## ADR-001 — Laravel + Inertia React

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

SetLux se reconstruirá como aplicación Laravel 13 con React 19 mediante Inertia.

### Motivo

Permite un monolito productivo con sesiones, policies, validación y rutas Laravel, manteniendo UI React moderna sin separar inicialmente una SPA/API independiente.

### Consecuencias

- La navegación principal se implementará con Inertia pages.
- El backend Laravel será la fuente de verdad para auth, permisos y validación.
- Podrán existir endpoints JSON internos para interacciones complejas, pero no se diseñará una API pública desde el día 1.
- Se reduce complejidad de CORS, tokens y despliegues separados.

## ADR-002 — TypeScript desde el inicio

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

El nuevo frontend React se escribirá en TypeScript desde el principio.

### Motivo

SetLux tiene estructuras de datos complejas, cálculos económicos, permisos y pantallas densas. TypeScript ayuda a mantener contratos claros entre frontend, backend y dominio.

### Consecuencias

- Los DTOs que lleguen desde Inertia deben tiparse.
- Se priorizarán tipos compartidos o generados cuando el proyecto crezca.
- Las nuevas pantallas/componentes deben evitar JavaScript sin tipos.

## ADR-003 — Propiedad directa de proyectos por usuario

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

Los proyectos pertenecerán siempre a un usuario concreto, normalmente Best Boy o Gaffer.

### Motivo

El producto nace alrededor de profesionales concretos que gestionan proyectos. No hace falta introducir workspaces/organizaciones en el MVP.

### Consecuencias

- `projects.owner_user_id` será obligatorio.
- Las membresías permitirán colaboración por proyecto.
- La monetización Education/Pro no debe forzar todavía un modelo de organización.
- Si en el futuro se añaden organizaciones, se hará como capa nueva sin romper propiedad directa.

## ADR-004 — Permisos MVP: Admin proyecto y miembro invitado

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

El MVP empezará con dos niveles prácticos de acceso:

1. **Admin de proyecto**: owner/Gaffer/Best Boy, con control completo del proyecto.
2. **Miembro invitado**: acceso restringido a su información y a lo que se le permita explícitamente.

### Motivo

Reduce complejidad inicial y permite implementar seguridad real sin sobrediseñar una matriz de roles avanzada.

### Consecuencias

- Las policies Laravel deben distinguir admin vs invitado.
- Gaffer y Best Boy se tratarán como administradores del proyecto en el MVP.
- Se podrán añadir permisos granulares después, especialmente para MySet.

## ADR-005 — Colaboración mediante bloqueo optimista

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

La colaboración simultánea del MVP se resolverá con bloqueo optimista.

### Motivo

Evita pérdida silenciosa de cambios sin introducir realtime desde el inicio.

### Consecuencias

- Las entidades editables críticas deberán tener `version`, `lock_version` o validación equivalente con `updated_at`.
- Si un usuario intenta guardar una versión obsoleta, el backend devolverá conflicto.
- El frontend mostrará un mensaje claro y permitirá refrescar/reaplicar cambios.
- Realtime/presencia queda para una fase posterior.

## ADR-006 — MySet entra en el MVP inicial

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

MySet debe formar parte del MVP inicial.

### Motivo

El espacio documental es una pieza importante del producto y debe diseñarse desde el inicio junto con permisos, storage y proyectos cerrados.

### Consecuencias

- Storage S3-compatible/local compatible debe configurarse pronto.
- El modelo inicial debe incluir carpetas, archivos y permisos MySet.
- Las policies de MySet son parte del alcance MVP.
- Puede empezar con funcionalidad mínima: carpetas, subida, descarga, preview básica y permisos esenciales.

## ADR-007 — Sin compatibilidad/migración legacy obligatoria

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

No hace falta mantener compatibilidad ni migrar datos de la app anterior/localStorage.

### Motivo

El proyecto empieza de cero y se prioriza una arquitectura limpia sobre compatibilidad heredada.

### Consecuencias

- Se elimina la migración legacy del MVP.
- Los modelos nuevos no tienen que adaptarse al shape exacto de localStorage.
- Las fórmulas y reglas sí pueden aprovecharse como referencia funcional, pero no como contrato de datos.
- Se pueden usar fixtures manuales nuevos para validar cálculos.

## ADR-008 — Borrado de proyectos solo por owner

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

Solo el `owner` del proyecto puede borrar el proyecto.

### Motivo

Aunque Gaffer y Best Boy sean administradores operativos, el borrado es una acción destructiva de propiedad. Limitarlo al owner reduce riesgos.

### Consecuencias

- La policy `delete` de proyecto debe comprobar `owner_user_id`.
- Otros admins podrán editar, cerrar/reabrir y operar el proyecto, pero no borrarlo.
- El borrado debe ser soft delete o requerir confirmación fuerte; pendiente de definir detalle.

## ADR-009 — Miembro invitado ve calendario completo sin información económica

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

El miembro invitado puede ver el calendario completo del proyecto, pero sin información económica.

### Motivo

El calendario completo aporta contexto operativo al equipo, mientras que los importes y datos económicos deben permanecer restringidos.

### Consecuencias

- Las respuestas backend para miembros invitados deben filtrar cualquier dato económico.
- El frontend puede mostrar planificación global, días, horarios y asignaciones según el alcance permitido.
- Los tests de permisos deben cubrir que no se filtren importes en calendario ni derivados.

## ADR-010 — Miembro invitado ve precio de su rol y textos generales de condiciones

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

El miembro invitado puede ver el precio correspondiente a su rol y los textos generales de condiciones.

### Motivo

El usuario debe entender sus condiciones y contexto legal/operativo sin acceder a precios de otros roles.

### Consecuencias

- Las consultas de condiciones para miembros deben devolver solo la fila de precio aplicable.
- Los textos generales deben poder mostrarse sin incluir datos sensibles de otros roles.
- Tests específicos deben asegurar que no se exponen precios ajenos.

## ADR-011 — Miembro invitado puede descargar timesheet y nómina propia

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

El miembro invitado podrá ver y descargar su timesheet y su nómina/resumen económico propio.

### Motivo

Es una parte importante del valor para trabajadores invitados y reduce trabajo manual del Gaffer/Best Boy.

### Consecuencias

- Los endpoints/queries de payroll y timesheet deben filtrar estrictamente por persona vinculada al usuario.
- Se deben añadir tests de fuga de datos para nómina/reportes/timesheet.
- La exportación propia no debe incluir datos de otros miembros.

## ADR-012 — Permisos MySet MVP por carpeta con herencia a archivos

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

En el MVP, MySet tendrá permisos por carpeta. Los archivos heredarán permisos de la carpeta que los contiene.

### Motivo

Es más simple y suficiente para el MVP, evitando complejidad de permisos archivo a archivo.

### Consecuencias

- `myset_permissions` debe apuntar inicialmente a carpetas.
- Los archivos no necesitan permisos individuales en MVP.
- Mover un archivo a otra carpeta cambia sus permisos efectivos.
- Los permisos por archivo pueden añadirse después si hace falta.

## ADR-013 — Solo admins pueden subir archivos a MySet en MVP

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

En el MVP, solo los admins de proyecto pueden subir archivos a MySet.

### Motivo

Reduce riesgos de seguridad, abuso de storage y moderación de contenido en la primera versión.

### Consecuencias

- Los miembros invitados pueden ver/descargar según permisos de carpeta, pero no subir.
- Un permiso `upload` para miembros queda como mejora futura.
- Las validaciones de archivo siguen siendo obligatorias para admins.

## ADR-014 — PDFs generados solo se descargan, no se guardan en MySet

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

Los PDFs generados por SetLux serán solo para descargar en el MVP. No se guardarán automáticamente en MySet.

### Motivo

Mantiene clara la separación entre exportación y espacio documental, evitando automatismos que llenen MySet sin intención del usuario.

### Consecuencias

- No se creará carpeta automática `Exports` en MySet para PDFs generados.
- La tabla/registro de exportaciones puede existir para jobs/descarga temporal, pero no como documento MySet.
- Guardar manualmente o adjuntar PDFs a MySet puede considerarse después.

## ADR-015 — Importación PDF con IA/structured output forma parte del MVP

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

La importación de PDF de plan de rodaje forma parte del MVP y debe planearse como una funcionalidad de alto valor. La idea principal es usar un modelo capaz de entender el PDF en lenguaje natural y devolver una salida estructurada que permita rellenar la app.

### Motivo

Es una de las funcionalidades que más valor diferencial aporta: reduce entrada manual y puede poblar calendario/necesidades/equipo/datos de producción desde documentos reales.

### Consecuencias

- El MVP debe reservar arquitectura para importación PDF desde el inicio.
- La importación se implementará como flujo asíncrono: upload → extracción → modelo → structured output → validación → preview → aplicación controlada.
- La app nunca debe aplicar automáticamente cambios sin preview/confirmación del usuario.
- Se necesita un schema versionado para el resultado estructurado.
- Los formatos, prompts, validadores y casos edge se definirán profundamente más adelante.

## ADR-016 — Timesheet solo semanal/mensual de momento

**Fecha:** 2026-04-25  
**Estado:** aceptada.

### Decisión

El timesheet se implementará solo para proyectos semanal/mensual de momento. Diario/publicidad queda fuera del alcance inicial de timesheet.

### Motivo

Reduce complejidad y sigue el alcance funcional prioritario.

### Consecuencias

- La UI debe ocultar o explicar timesheet en modo diario/publicidad.
- La arquitectura no debe impedir añadir timesheet diario/publicidad después.
