# SetLux — planificación de reconstrucción

Fecha: 2026-04-25  
Estado: borrador vivo para deliberar y convertir el documento de requisitos en trabajo implementable.

## Fuente principal

- [`../REQUERIMIENTOS_Y_CASOS_DE_USO.md`](../REQUERIMIENTOS_Y_CASOS_DE_USO.md): especificación funcional y técnica unificada.
- [`../product-definition-for-claude-design.md`](../product-definition-for-claude-design.md): contexto de producto y diseño UX.

## Stack objetivo declarado

- Backend: Laravel 13.
- Frontend: React 19.
- Estilos: Tailwind CSS.
- Base de datos recomendada: PostgreSQL.
- Storage recomendado: S3-compatible para documentos, adjuntos y PDFs.
- Colas recomendadas: jobs Laravel para PDFs pesados, emails, importación PDF y procesado de archivos.

## Documentos de planificación

1. [`01-roadmap-iterativo.md`](01-roadmap-iterativo.md) — fases, hitos y orden recomendado.
2. [`02-backlog-epicas.md`](02-backlog-epicas.md) — épicas iniciales, dependencias y criterios.
3. [`03-arquitectura-inicial.md`](03-arquitectura-inicial.md) — propuesta técnica inicial y decisiones de arquitectura.
4. [`04-modelo-datos-borrador.md`](04-modelo-datos-borrador.md) — entidades principales, relaciones y tablas.
5. [`05-matriz-permisos-borrador.md`](05-matriz-permisos-borrador.md) — roles, visibilidad y acciones permitidas.
6. [`06-decisiones-pendientes.md`](06-decisiones-pendientes.md) — preguntas que hay que cerrar antes/durante la implementación.
7. [`07-paralelizacion.md`](07-paralelizacion.md) — cómo dividir el trabajo en paralelo sin bloquearse.
8. [`08-registro-de-decisiones.md`](08-registro-de-decisiones.md) — decisiones ya aceptadas.
9. [`09-mvp-inicial.md`](09-mvp-inicial.md) — alcance del MVP inicial acordado.
10. [`10-importacion-pdf-ia.md`](10-importacion-pdf-ia.md) — plan específico para importación PDF con IA y salida estructurada.

## Principio de trabajo

Reconstruir SetLux por cortes verticales pequeños, no por una migración masiva. Cada corte debe entregar algo ejecutable, probado y conectado de frontend a backend.

## MVP operativo propuesto

El primer MVP útil no debería intentar incluir todo. Debe validar el ciclo esencial:

1. Usuario real entra.
2. Crea proyecto.
3. Configura condiciones.
4. Crea equipo.
5. Planifica calendario.
6. Registra reportes.
7. Revisa nómina/timesheet.

MySet entra dentro del MVP inicial; PDFs avanzados, importación PDF, realtime y monetización pueden integrarse como capas posteriores si no bloquean el flujo principal.
