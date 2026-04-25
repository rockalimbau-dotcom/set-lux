# Roadmap iterativo de reconstrucción

Fecha: 2026-04-25  
Estado: borrador.

## Objetivo

Convertir la app frontend/localStorage en una aplicación multiusuario con backend, persistencia segura, permisos reales y arquitectura mantenible.

## Hito 0 — Alineación y decisiones base

**Resultado esperado:** decisiones mínimas cerradas para empezar a construir sin rehacer cimientos.

Entregables:

- Documentos de planificación inicial.
- Decisiones de arquitectura de alto impacto ya cerradas: Laravel + Inertia, TypeScript, propiedad directa por usuario, permisos MVP, bloqueo optimista, MySet en MVP y sin migración legacy obligatoria.
- Matriz inicial de permisos.
- Modelo de datos borrador.
- Lista de riesgos y preguntas abiertas restantes.

Bloquea:

- Esqueleto técnico definitivo.
- Diseño de permisos.
- Modelo de membresías e invitaciones.

## Hito 1 — Foundation técnica y vertical skeleton

**Resultado esperado:** app Laravel + React funcionando end-to-end con CI/calidad básica.

Incluye:

- Crear proyecto Laravel 13.
- Integrar React 19 + Tailwind.
- Configurar TypeScript si se confirma.
- Configurar PostgreSQL, Redis/colas si aplica.
- Configurar testing: PHPUnit/Pest, Vitest, Playwright opcional.
- Layout base, rutas protegidas, tema claro/oscuro e i18n mínimo.
- Primer endpoint/página protegida end-to-end.

Criterio de aceptación:

- Un usuario autenticado puede entrar a una pantalla privada real.
- Hay comandos claros de dev/test/lint.
- Hay migraciones iniciales ejecutables.

## Hito 2 — Identidad, perfiles, proyectos y membresías

**Resultado esperado:** núcleo multiusuario seguro.

Incluye:

- Registro/login/logout/recuperación.
- Perfil: nombre, idioma, tema, género si se mantiene.
- CRUD de proyectos.
- Estados de proyecto: activo/cerrado.
- Membresías por proyecto.
- Roles de acceso: owner/gaffer/best_boy/member/invited, por cerrar.
- Invitaciones base por email o enlace, según decisión.

Criterio de aceptación:

- Un usuario crea un proyecto y queda como administrador.
- Otro usuario puede ser invitado y acceder con permisos definidos.
- Proyecto cerrado bloquea escrituras en backend y frontend.

## Hito 3 — Dominio de condiciones y cálculo puro

**Resultado esperado:** motor económico testable antes de depender de pantallas complejas.

Incluye:

- Portar fórmulas semanal/mensual/diario a dominio backend o paquete compartido.
- Definir schemas versionados de condiciones.
- CRUD de condiciones por proyecto.
- Roles/precios por proyecto.
- Tests de fórmulas con fixtures reales.

Criterio de aceptación:

- Las fórmulas documentadas producen importes esperados.
- Cambiar condiciones recalcula datos derivados de forma consistente.
- Los miembros restringidos no ven precios ajenos.

## Hito 4 — Equipo, roles personalizados y calendario

**Resultado esperado:** planificación operativa usable.

Incluye:

- Equipo por grupos: base, refuerzos, prelight, pickup.
- Personas de equipo vinculables o no a usuarios invitados.
- Roles personalizados por proyecto.
- Semanas, días, jornadas, horarios, asignaciones y bloques extra.
- Días pre/pro, festivos y regiones si aplica.

Criterio de aceptación:

- El equipo se asigna a semanas/días.
- El calendario sirve de fuente para reportes y nómina.
- Los cambios respetan permisos y estado cerrado.

## Hito 5 — Reportes, nómina y timesheet

**Resultado esperado:** flujo económico completo desde calendario hasta salida individual.

Incluye:

- Reportes por semana/día/persona.
- Cálculos automáticos: horas extra, turn around, nocturnidad, dietas, carga/descarga, conceptos.
- Nómina semanal/mensual/diario.
- Timesheet individual por trabajador/semana.
- Visibilidad restringida por miembro invitado.

Criterio de aceptación:

- Reportes generan nómina coherente por modo de proyecto.
- Cada usuario restringido solo ve su información permitida.
- Hay tests de fugas de datos y cálculos críticos.

## Hito 6 — MySet y almacenamiento documental MVP

**Resultado esperado:** espacio documental por proyecto con permisos reales. MySet forma parte del MVP inicial, por lo que sus bases de storage/permisos deben prepararse desde los primeros hitos.

Incluye:

- Carpetas y archivos por proyecto.
- Subida, preview, descarga, renombrado, movimiento y borrado.
- Validaciones: tipo, tamaño, permisos, cuota.
- Permisos por usuario/carpeta/archivo.
- Solo lectura en proyecto cerrado.
- Decidir si PDFs generados se guardan automáticamente en MySet.

Criterio de aceptación:

- MySet no guarda binarios en base de datos ni localStorage.
- Un usuario sin permiso no puede acceder ni por UI ni por URL directa.

## Hito 7 — Importación PDF con IA, PDFs y jobs

**Resultado esperado:** importación PDF con salida estructurada como funcionalidad diferencial del MVP, más salidas profesionales consistentes y trabajos pesados aislados.

Incluye:

- Exportaciones PDF server-side o servicio interno.
- Importación de plan PDF asíncrona con modelo/LLM y structured output.
- Schema versionado de resultado estructurado.
- Preview, validación y resolución de conflictos antes de aplicar.
- Jobs con estados, errores y reintentos.
- Guardado opcional de PDFs en MySet.
- Festivos desde proveedor backend o tabla mantenida.

Criterio de aceptación:

- Un PDF sale igual independientemente del navegador.
- Importar plan muestra preview, conflictos y aplicación segura a proyecto/equipo/calendario.

## Hito 8 — Monetización y hardening

**Resultado esperado:** producto listo para uso real/beta avanzada.

Incluye:

- Auditoría y logs.
- Observabilidad de errores frontend/backend/jobs.
- Planes Free/Basic/Pro/Education si se decide monetizar en esta fase.
- Límites de storage/proyectos/exportaciones por plan.

Criterio de aceptación:

- No hay compatibilidad legacy obligatoria con localStorage.
- Hay mecanismos de rollback y validación para cambios nuevos críticos.
