# Estrategia de paralelización

Fecha: 2026-04-25  
Estado: borrador.

## Objetivo

Dividir SetLux para que varias líneas de trabajo avancen en paralelo sin pisarse, manteniendo contratos claros entre dominio, backend y frontend.

## Workstreams propuestos

### WS-A — Plataforma y arquitectura

Responsabilidades:

- Proyecto Laravel/React/Tailwind.
- Auth base.
- Configuración dev/test/CI.
- Convenciones de carpetas.
- Base de datos y migraciones iniciales.

Bloquea a:

- Casi todos los módulos que necesitan backend real.

Puede avanzar en paralelo con:

- WS-B diseño de dominio.
- WS-C extracción de fórmulas.
- WS-D UX/design system.

### WS-B — Modelo de datos y permisos

Responsabilidades:

- ERD/tablas.
- Policies.
- Matriz de permisos.
- Membresías e invitaciones.
- Concurrencia optimista.

Puede avanzar antes de tener UI definitiva.

### WS-C — Dominio económico y cálculos

Responsabilidades:

- Portar fórmulas semanal/mensual/diario.
- Crear fixtures reales.
- Tests de regresión.
- Contratos de inputs/outputs para condiciones, reportes y nómina.

Puede avanzar casi independiente del UI.

### WS-D — UX, diseño e iPad-first

Responsabilidades:

- Nueva arquitectura de información.
- Layout base.
- Componentes/table patterns.
- Estados vacíos/error/read-only.
- Flujos principales.

Puede avanzar con mock data mientras backend prepara contratos.

### WS-E — Proyectos/equipo/calendario

Responsabilidades:

- CRUD proyectos.
- Equipo y roles.
- Calendario/necesidades.

Depende de:

- WS-A mínimo.
- WS-B parcialmente.

### WS-F — Reportes/nómina/timesheet

Responsabilidades:

- Reportes.
- Agregación de nómina.
- Timesheet individual.

Depende de:

- WS-C cálculos.
- WS-E calendario/equipo.

### WS-G — MySet/storage

Decisión: MySet entra en el MVP inicial, así que este workstream debe empezar temprano.

Responsabilidades:

- Storage.
- Archivos/carpetas.
- Permisos documentales.
- Preview/descarga.

Depende de:

- WS-A storage config.
- WS-B permisos.

Puede avanzar con un proyecto dummy cuando esas bases existan.

### WS-H — Importación PDF IA / PDFs / jobs

Responsabilidades:

- Importación plan PDF con modelo y structured output.
- Schema de salida estructurada.
- Preview y aplicación segura.
- Exportaciones PDF descargables.
- Jobs asíncronos.
- Registro de exports/imports.

Depende de:

- Modelos origen de cada módulo.
- Modelo de calendario/equipo/proyecto.
- Decisión de proveedor/modelo para importación.
- Decisión de renderer PDF.

## Contratos para evitar bloqueos

Antes de implementar módulos en paralelo, definir:

1. IDs y nombres de entidades.
2. Shape de DTOs principales.
3. Estados (`active/closed`, `draft/confirmed`, etc.).
4. Reglas de permisos por acción.
5. Eventos o invalidaciones tras mutaciones.
6. Fixtures compartidos para tests.

## Orden recomendado de paralelización

### Iteración 0

En paralelo:

- WS-A: crear skeleton.
- WS-B: cerrar permisos/modelo.
- WS-C: extraer fixtures y fórmulas.
- WS-D: proponer IA/UX nueva.

### Iteración 1

En paralelo:

- WS-A/WS-B: auth, perfiles, membresías.
- WS-D: design system base.
- WS-C: condiciones y tests.

### Iteración 2

En paralelo:

- WS-E: proyectos/equipo/calendario.
- WS-C: motor reportes/nómina.
- WS-G: diseño técnico e implementación mínima de MySet/storage.
- WS-H: schema y prototipo de importación PDF con fixtures.

### Iteración 3

En paralelo:

- WS-F: reportes/nómina/timesheet.
- WS-G: MySet.
- WS-H: importación PDF IA y PDFs base.

### Iteración 4

En paralelo:

- WS-H: importación PDF.
- QA/security/hardening transversal.

## Módulos que NO conviene empezar sin decisiones previas

- MySet avanzado/granular sin cerrar permisos exactos y storage definitivo. La base MVP sí entra desde el inicio.
- Importación PDF puede empezar con arquitectura/schema/prototipo, pero no cerrar comportamiento final sin decidir formatos objetivo y validadores.
- Monetización sin decidir Free/Freemium/Basic/Pro.
- Realtime sin validar primero bloqueo optimista.
- Nómina final sin fixtures reales aprobados.

## Regla de Definition of Done por tarea

Una tarea no se considera terminada si solo existe UI. Para cada corte vertical:

- Migración/modelo si aplica.
- Policy/permiso backend si aplica.
- Validación server-side.
- UI conectada.
- Estado loading/error/empty/read-only.
- Tests mínimos.
- Documentación de decisión si se tomó una decisión nueva.
