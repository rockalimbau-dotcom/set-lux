# MVP inicial — alcance acordado

Fecha: 2026-04-25  
Estado: borrador basado en decisiones aceptadas.

## Decisiones que definen el MVP

- Stack: Laravel 13 + Inertia + React 19 + TypeScript + Tailwind.
- Cada proyecto pertenece a un usuario concreto, normalmente Best Boy o Gaffer.
- Permisos iniciales: Admin de proyecto y Miembro invitado.
- Colaboración: bloqueo optimista, no realtime en MVP.
- MySet entra en el MVP inicial.
- Importación PDF con IA/structured output entra en el MVP y debe planearse como funcionalidad diferencial.
- No hay compatibilidad ni migración obligatoria desde localStorage.

## Objetivo del MVP

Entregar una versión usable de SetLux con backend real que cubra el ciclo operativo mínimo de un proyecto:

1. Usuario se registra/entra.
2. Crea un proyecto.
3. Invita o gestiona miembros.
4. Configura condiciones.
5. Crea equipo.
6. Planifica calendario.
7. Importa un plan PDF para rellenar calendario/equipo/datos mediante preview estructurada.
8. Usa MySet para documentos básicos.
9. Registra reportes.
10. Consulta nómina/timesheet.

## Dentro del MVP

### Plataforma

- Laravel + Inertia + React TypeScript.
- Auth real.
- PostgreSQL.
- Tailwind.
- Tests mínimos backend/frontend.
- Policies Laravel.
- Bloqueo optimista en entidades críticas.

### Proyectos y permisos

- CRUD de proyectos.
- Proyecto activo/cerrado.
- Owner/admin.
- Miembro invitado.
- Invitación básica.
- Validación de permisos en backend.

### Condiciones

- Modos semanal, mensual y diario/publicidad.
- Parámetros económicos.
- Precios por rol.
- Fórmulas críticas cubiertas con tests.
- Miembro invitado ve precio de su rol y textos generales, sin precios de otros roles.

### Equipo

- Personas de equipo no necesariamente usuarias.
- Vinculación opcional con usuario invitado.
- Roles personalizados por proyecto.
- Grupos operativos.

### Calendario

- Semanas/días.
- Asignaciones de equipo.
- Horarios/jornada/notas.
- Base suficiente para reportes.

### MySet MVP

- Carpetas por proyecto.
- Subida de archivos validada.
- Descarga autorizada.
- Preview básica si es viable.
- Permisos mínimos.
- Modo solo lectura en proyecto cerrado.

### Importación PDF con IA

- Upload de PDF.
- Extracción de contenido.
- Análisis con modelo y salida estructurada.
- Validación server-side del schema.
- Preview editable/confirmable.
- Aplicación controlada a proyecto/equipo/calendario.
- Registro de importación y warnings.

### Reportes, nómina y timesheet

- Reportes por semana/día/persona.
- Cálculos automáticos principales.
- Nómina por modo de proyecto.
- Timesheet individual solo semanal/mensual de momento.
- Miembro invitado puede descargar timesheet y nómina propia.
- Visibilidad restringida por usuario/persona vinculada.

## Fuera del MVP inicial

- Realtime/presencia.
- Migración localStorage.
- API pública externa.
- Workspaces/organizaciones.
- Facturación/planes comerciales.
- Permisos complejos por módulo, salvo MySet mínimo.
- Versionado avanzado de documentos.
- Antivirus/escaneo avanzado si no se requiere para beta privada; sí debe quedar previsto.

## Primeras iteraciones propuestas

### Iteración 0 — Foundation y contratos

- Crear skeleton Laravel/Inertia/React TS/Tailwind.
- Configurar auth base.
- Crear migraciones iniciales: users, projects, memberships.
- Definir DTOs iniciales.
- Crear layout base.
- Configurar tests.

### Iteración 1 — Proyectos + permisos + MySet base técnica

- CRUD de proyectos.
- Policies admin/invitado.
- Estado activo/cerrado.
- Storage Laravel configurado.
- Modelo MySet: folders/files.

### Iteración 2 — Condiciones + equipo

- Modelos de roles/personas.
- CRUD equipo.
- Condiciones por modo.
- Tests de cálculo.

### Iteración 3 — Calendario + MySet funcional + base de importación

- Semanas/días/asignaciones.
- MySet: carpetas, subida, descarga, permisos mínimos.
- Proyecto cerrado bloquea edición.
- Modelo `import_jobs` y flujo base de upload/preview.

### Iteración 4 — Importación PDF IA + Reportes/Nómina/Timesheet

- Pipeline de importación PDF con salida estructurada validada.
- Aplicación controlada a proyecto/equipo/calendario.
- Reportes derivados de calendario/equipo/condiciones.
- Nómina por modo.
- Timesheet individual.
- Tests de visibilidad.
