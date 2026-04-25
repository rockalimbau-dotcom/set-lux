# Backlog inicial por épicas

Fecha: 2026-04-25  
Estado: borrador para convertir en issues/tareas.

Leyenda:

- **P0** imprescindible para cimientos/MVP.
- **P1** importante para beta usable.
- **P2** posterior o dependiente de decisiones.

## EP-00 — Documentación y decisiones

Prioridad: P0  
Dependencias: ninguna.

Tareas iniciales:

- EP-00.1 Congelar requisitos base y enlazarlos como fuente oficial.
- EP-00.2 Registrar decisiones de arquitectura ya cerradas: Laravel + Inertia, TypeScript, proyecto propiedad de usuario, permisos MVP, bloqueo optimista, MySet en MVP y sin migración legacy.
- EP-00.3 Cerrar detalles restantes de la matriz de permisos MVP.
- EP-00.4 Definir alcance exacto de MySet MVP.
- EP-00.5 Definir qué queda fuera del MVP.

Criterio de aceptación:

- Existe una decisión escrita para cada asunto bloqueante.

## EP-01 — Plataforma Laravel/React

Prioridad: P0  
Dependencias: EP-00 parcial.

Tareas iniciales:

- EP-01.1 Crear proyecto Laravel 13.
- EP-01.2 Integrar React 19 y Tailwind.
- EP-01.3 Decidir y configurar TypeScript.
- EP-01.4 Configurar PostgreSQL.
- EP-01.5 Configurar entorno local reproducible.
- EP-01.6 Configurar tests backend/frontend.
- EP-01.7 Configurar lint/format/CI.

Criterio de aceptación:

- `dev`, `test`, `lint` y migraciones funcionan desde cero.

## EP-02 — Auth, perfiles y preferencias

Prioridad: P0  
Dependencias: EP-01.

Tareas iniciales:

- EP-02.1 Registro de usuario real.
- EP-02.2 Login/logout/recuperación.
- EP-02.3 Perfil de usuario.
- EP-02.4 Preferencias globales: idioma y tema.
- EP-02.5 Seguridad de sesiones, CSRF y validación server-side.

Criterio de aceptación:

- Un usuario real puede entrar, editar perfil y mantener preferencias.

## EP-03 — Proyectos, membresías e invitaciones

Prioridad: P0  
Dependencias: EP-02.

Tareas iniciales:

- EP-03.1 CRUD de proyectos.
- EP-03.2 Filtros y orden de proyectos.
- EP-03.3 Estado activo/cerrado.
- EP-03.4 Membresías por proyecto.
- EP-03.5 Invitaciones por email/enlace.
- EP-03.6 Control de permisos en políticas Laravel.
- EP-03.7 Auditoría mínima de cambios críticos.

Criterio de aceptación:

- Los permisos se comprueban en backend, no solo en frontend.

## EP-04 — Condiciones y motor de cálculo

Prioridad: P0  
Dependencias: EP-03.

Tareas iniciales:

- EP-04.1 Extraer fixtures reales semanal/mensual/diario desde la app actual.
- EP-04.2 Portar fórmulas a servicios/clases puras.
- EP-04.3 Diseñar schema versionado de condiciones.
- EP-04.4 CRUD de condiciones por proyecto.
- EP-04.5 Roles/precios personalizados.
- EP-04.6 Tests unitarios de fórmulas y regresión.

Criterio de aceptación:

- Las fórmulas críticas están cubiertas por tests con ejemplos reales.

## EP-05 — Equipo y roles de producción

Prioridad: P0  
Dependencias: EP-03, EP-04 parcial.

Tareas iniciales:

- EP-05.1 Modelo de personas de equipo independiente de usuarios de app.
- EP-05.2 Vincular persona de equipo con usuario invitado cuando aplique.
- EP-05.3 Grupos: base, refuerzos, prelight, pickup.
- EP-05.4 Roles personalizados resolubles por `roleId`.
- EP-05.5 Validaciones de borrado/renombrado de roles usados.

Criterio de aceptación:

- Un proyecto puede tener equipo completo aunque algunos miembros no tengan cuenta.

## EP-06 — Calendario / necesidades

Prioridad: P0  
Dependencias: EP-05.

Tareas iniciales:

- EP-06.1 Semanas y días del proyecto.
- EP-06.2 Tipos de día: prep/shoot/prelight/pickup/off/festivo/etc. por cerrar.
- EP-06.3 Horarios, jornada, descanso, localización, notas y asignaciones.
- EP-06.4 Bloques extra.
- EP-06.5 Exportación simple de calendario.
- EP-06.6 Base para importación de plan posterior.

Criterio de aceptación:

- El calendario alimenta reportes sin duplicar datos innecesarios.

## EP-07 — Reportes

Prioridad: P0  
Dependencias: EP-04, EP-06.

Tareas iniciales:

- EP-07.1 Reportes por semana/día/persona.
- EP-07.2 Cálculos automáticos: extras, TA, nocturnidad.
- EP-07.3 Conceptos manuales: dietas, carga/descarga, otros.
- EP-07.4 Preservación de datos manuales ante recalculo.
- EP-07.5 Permisos y visibilidad por usuario.

Criterio de aceptación:

- Recalcular no borra ajustes manuales ni expone datos ajenos.

## EP-08 — Nómina

Prioridad: P0  
Dependencias: EP-07.

Tareas iniciales:

- EP-08.1 Agregación semanal.
- EP-08.2 Agregación mensual.
- EP-08.3 Agregación diario/publicidad.
- EP-08.4 Comparación con resultados legacy.
- EP-08.5 Visibilidad restringida.

Criterio de aceptación:

- La nómina coincide con fixtures validados por modo de proyecto.

## EP-09 — Timesheet

Prioridad: P1  
Dependencias: EP-07, EP-08.

Tareas iniciales:

- EP-09.1 Timesheet individual por trabajador/semana.
- EP-09.2 Alcance inicial solo semanal/mensual.
- EP-09.3 Exportación PDF.
- EP-09.4 Descarga por miembro invitado de su timesheet propio.

Criterio de aceptación:

- Un trabajador puede obtener su timesheet y nómina propia sin ver datos ajenos.

## EP-10 — MySet

Prioridad: P0  
Dependencias: EP-03, EP-05.

Decisión: MySet entra en el MVP inicial.

Tareas iniciales:

- EP-10.1 Modelo de carpetas.
- EP-10.2 Modelo de archivos/metadatos.
- EP-10.3 Storage S3-compatible.
- EP-10.4 Permisos por carpeta/archivo.
- EP-10.5 Preview/descarga.
- EP-10.6 Validaciones de tipo/tamaño/cuota.
- EP-10.7 Integración con PDFs generados si se decide.

Criterio de aceptación:

- No hay acceso directo a archivos sin autorización backend.

## EP-11 — PDFs y exportaciones

Prioridad: P1  
Dependencias: módulos origen.

Tareas iniciales:

- EP-11.1 Definir renderer PDF.
- EP-11.2 Exportar condiciones.
- EP-11.3 Exportar calendario.
- EP-11.4 Exportar reportes.
- EP-11.5 Exportar nómina.
- EP-11.6 Exportar timesheet.
- EP-11.7 Jobs y registro de exportaciones.

Criterio de aceptación:

- Los PDFs son consistentes entre entornos.

## EP-12 — Importación PDF de plan con IA

Prioridad: P0  
Dependencias: EP-06, EP-01 jobs/storage, EP-16 seguridad.

Decisión: entra en el MVP y debe planearse como funcionalidad diferencial basada en modelo + structured output.

Tareas iniciales:

- EP-12.1 Definir formatos objetivo y campos mínimos.
- EP-12.2 Diseñar schema versionado de structured output.
- EP-12.3 Implementar upload seguro y job de extracción.
- EP-12.4 Integrar modelo/LLM con salida estructurada.
- EP-12.5 Validar JSON contra schema y construir preview.
- EP-12.6 Resolver conflictos antes de aplicar.
- EP-12.7 Aplicar cambios a proyecto/equipo/calendario en transacción.
- EP-12.8 Tests con PDFs reales anonimizados y fixtures de salida estructurada.

Criterio de aceptación:

- El usuario puede revisar y corregir antes de modificar calendario/equipo/proyecto.

## EP-13 — Migración desde localStorage

Prioridad: fuera de alcance MVP.

Decisión: no hace falta mantener compatibilidad ni migrar datos de la app anterior/localStorage.

Posibles tareas futuras solo si aparece una necesidad real:

- EP-13.1 Definir JSON de importación manual.
- EP-13.2 Importador backend opcional.
- EP-13.3 Validadores de consistencia.

Criterio de aceptación futuro:

- Importar datos no condiciona el diseño limpio del nuevo modelo.

## EP-14 — Planes, límites y monetización

Prioridad: P2  
Dependencias: decisión de negocio.

Tareas iniciales:

- EP-14.1 Definir si Free y Freemium coexisten.
- EP-14.2 Definir límites por plan.
- EP-14.3 Gateo de funcionalidades.
- EP-14.4 Facturación si aplica.

Criterio de aceptación:

- El código de permisos de producto no se mezcla con permisos de seguridad del proyecto.

## EP-15 — UX/iPad-first/design system

Prioridad: P0 continuo  
Dependencias: producto.

Tareas iniciales:

- EP-15.1 Rediseñar arquitectura de información desde producto, no pantalla legacy.
- EP-15.2 Componentes base accesibles y táctiles.
- EP-15.3 Tablas densas pero usables en iPad.
- EP-15.4 Estados vacíos, loading, error, read-only.
- EP-15.5 Diseño claro/oscuro.

Criterio de aceptación:

- Los flujos principales son usables en iPad landscape/portrait.

## EP-16 — Calidad, seguridad y observabilidad

Prioridad: P0 continuo.

Tareas iniciales:

- EP-16.1 Tests unitarios de cálculo.
- EP-16.2 Tests de políticas/permisos.
- EP-16.3 Tests de integración de repositorios.
- EP-16.4 E2E de flujo principal.
- EP-16.5 Logs y errores frontend/backend/jobs.
- EP-16.6 Sanitización de HTML editable.
- EP-16.7 Cifrado o minimización de datos sensibles.

Criterio de aceptación:

- No se puede filtrar información sensible por manipulación de URL/API.
