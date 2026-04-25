# Decisiones pendientes y preguntas para deliberar

Fecha: 2026-04-25  
Estado: vivo.

Las decisiones D-001 a D-014 ya están cerradas y registradas en [`08-registro-de-decisiones.md`](08-registro-de-decisiones.md).

## Bloqueantes para empezar código

### D-001 — Arquitectura frontend/backend

**Decidido:** Laravel 13 + Inertia React en monolito. Ver ADR-001.

### D-002 — TypeScript

**Decidido:** TypeScript desde el inicio. Ver ADR-002.

### D-003 — Organización/cuenta de facturación

**Decidido:** los proyectos pertenecen siempre a un usuario concreto, normalmente Best Boy o Gaffer. Ver ADR-003.

### D-004 — Roles de acceso MVP

**Decidido:** Admin de proyecto + Miembro invitado. Gaffer/Best Boy/owner son admins en MVP. Ver ADR-004.

### D-005 — Estrategia de colaboración simultánea

**Decidido:** bloqueo optimista en MVP. Realtime queda para después. Ver ADR-005.

## Producto y permisos

### D-006 — Visibilidad del calendario para miembros

**Decidido:** el miembro invitado ve calendario completo, sin información económica. Ver ADR-009.

### D-007 — Visibilidad de condiciones para miembros

**Decidido:** el miembro invitado ve precio de su rol + textos generales. Ver ADR-010.

### D-008 — Descarga de nómina/timesheet por miembros

**Decidido:** el miembro invitado puede descargar timesheet y nómina propia. Ver ADR-011.

### D-009 — Permisos MySet

**Decidido:** permisos por carpeta con herencia a archivos; solo admins suben archivos en MVP. Ver ADR-012 y ADR-013.

Pendiente: definir detalle de revocación, cascada y comportamiento al mover carpetas/archivos.

### D-010 — PDFs generados y MySet

**Decidido:** los PDFs generados son solo para descargar; no se guardan en MySet en MVP. Ver ADR-014.

## Funcionalidad MVP

### D-011 — ¿MySet entra en MVP inicial?

**Decidido:** sí, MySet entra en el MVP inicial. Ver ADR-006.

### D-012 — ¿Importación PDF entra en MVP inicial?

**Decidido:** sí entra en MVP y debe planearse con IA/structured output. Ver ADR-015 y [`10-importacion-pdf-ia.md`](10-importacion-pdf-ia.md).

Pendiente: definición profunda de schema, proveedor/modelo, validadores, formatos objetivo y UX de preview.

### D-013 — ¿Migración desde localStorage es obligatoria para la primera beta?

**Decidido:** no hace falta mantener compatibilidad ni migrar datos legacy. Ver ADR-007.

### D-014 — Timesheet en modo diario/publicidad

**Decidido:** por ahora timesheet solo semanal/mensual. Diario/publicidad queda fuera del alcance inicial. Ver ADR-016.

## Datos, seguridad y legal

### D-015 — Datos personales sensibles

Preguntas:

- ¿Se guardará DNI/NIF/SS?
- ¿Se guardarán teléfonos/direcciones?
- ¿Qué debe cifrarse?

Recomendación: no guardar datos altamente sensibles hasta tener necesidad clara.

### D-016 — Festivos y BOE

Pregunta: ¿fuente oficial y alcance? España por comunidades, internacional, proveedor externo, tabla manual.

Pendiente.

### D-017 — Traducción DeepL

Pregunta: ¿será funcionalidad oficial o texto pendiente heredado?

Pendiente.

## Negocio

### D-018 — Free vs Freemium

Pregunta: ¿deben coexistir o simplificamos?

Recomendación: posponer monetización hasta tener flujo principal validado, pero no cerrar puertas en modelo de datos.

### D-019 — Límites por plan

Pendiente:

- proyectos,
- usuarios invitados,
- almacenamiento MySet,
- exportaciones,
- importación PDF,
- colaboración.

## Diseño/UX

### D-020 — Rediseño desde cero vs replicar app actual

Recomendación: rediseñar arquitectura de información desde cero usando el documento de producto, pero preservar reglas y flujos validados.

### D-021 — iPad-first

Pregunta: ¿priorizamos iPad como interfaz principal incluso si complica tablas densas?

Recomendación: sí, según documento de producto.
