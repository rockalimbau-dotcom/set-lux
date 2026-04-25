# Arquitectura inicial propuesta

Fecha: 2026-04-25  
Estado: borrador técnico.

## Decisiones base aceptadas

- **Laravel 13 monolítico** como backend principal.
- **React 19 + TypeScript + Tailwind** dentro del proyecto Laravel.
- **Inertia.js** para páginas React con sesiones, policies, validación y rutas Laravel.
- **API JSON interna** solo cuando una interacción compleja lo requiera; no diseñaremos una API pública desde el día 1.
- **Propiedad directa de proyectos por usuario**: cada proyecto pertenece a un usuario concreto, normalmente Best Boy o Gaffer.
- **Permisos MVP simples**: Admin de proyecto y Miembro invitado.
- **Colaboración MVP con bloqueo optimista**.
- **Importación PDF con IA/structured output dentro del MVP**.

Ver [`08-registro-de-decisiones.md`](08-registro-de-decisiones.md).

## Capas recomendadas en Laravel

```text
app/
  Domain/
    Projects/
    Conditions/
    Team/
    Calendar/
    Reports/
    Payroll/
    Timesheets/
    MySet/
  Application/
    UseCases/
    DTOs/
  Http/
    Controllers/
    Requests/
    Resources/
  Models/
  Policies/
  Jobs/
  Events/
  Listeners/
```

Principio: los cálculos y reglas críticas no deben vivir en controladores ni componentes React.

## Fronteras de dominio

### Identity/Auth

Responsable de:

- Usuarios.
- Perfil.
- Preferencias globales.
- Sesiones.
- Invitaciones aceptadas.

No debe decidir por sí solo permisos internos de cada proyecto; eso pertenece a memberships/policies.

### Projects

Responsable de:

- Datos generales de proyecto.
- Tipo de proyecto: semanal/mensual/diario-publicidad.
- Estado activo/cerrado.
- Idioma de proyecto.
- Membresías y roles de acceso.

### Conditions

Responsable de:

- Parámetros económicos.
- Textos editables legales/condiciones.
- Precios por rol.
- Fórmulas puras y versionadas.

### Team

Responsable de:

- Personas del equipo de producción.
- Grupos operativos.
- Roles personalizados.
- Vínculo opcional persona ↔ usuario.

### Calendar

Responsable de:

- Semanas.
- Días.
- Jornadas/horarios.
- Asignaciones.
- Bloques extra.

### Reports

Responsable de:

- Reportes diarios/semanales por persona.
- Conceptos manuales.
- Derivaciones desde calendario y condiciones.

### Payroll

Responsable de:

- Agregaciones económicas.
- Vistas de nómina por modo.
- Reglas de visibilidad económica.

### Timesheets

Responsable de:

- Salida individual por trabajador.
- PDF/descarga individual.

### MySet

Responsable de:

- Árbol documental.
- Archivos y metadatos.
- Permisos por usuario/carpeta/archivo.
- Integración con storage.

### Exports/Imports

Responsable de:

- PDFs descargables.
- Importación de plan PDF con extracción, modelo/LLM, structured output, validación, preview y aplicación controlada.
- Jobs asíncronos.
- Estado de export/import.

## Datos y consistencia

Recomendaciones iniciales:

- Usar `ulid` o `uuid` como identificadores públicos.
- Mantener `id` interno si facilita Laravel, pero no exponer IDs incrementales si preocupa enumeración.
- Añadir `version` o `lock_version` en entidades con edición colaborativa; es obligatorio en entidades críticas por la decisión de bloqueo optimista.
- Usar transacciones en mutaciones que afecten varias tablas.
- Guardar auditoría en cambios sensibles: permisos, condiciones, reportes, nómina, MySet.

## Colaboración simultánea

Decisión MVP:

- **Bloqueo optimista** por `version`/`updated_at`.
- Si dos usuarios editan lo mismo, el backend rechaza escritura obsoleta con conflicto claro.
- Frontend muestra: “Estos datos han cambiado; revisa y vuelve a aplicar”.

Opción avanzada posterior:

- Eventos broadcast/realtime para refresco inteligente.
- Presencia de usuarios.
- Merge fino por campo en módulos concretos.

## Storage

Recomendación:

- No guardar binarios en base de datos.
- Usar disco Laravel configurado contra S3-compatible.
- Los archivos se descargan vía rutas firmadas o streaming autorizado.
- Guardar solo metadatos en DB.
- Aplicar validación estricta de MIME/tamaño/extensión.

## Importación PDF con IA

La importación PDF entra en el MVP como pipeline asíncrono:

1. upload seguro,
2. extracción de contenido,
3. análisis con modelo y salida estructurada,
4. validación server-side del schema,
5. preview editable,
6. aplicación transaccional a proyecto/equipo/calendario.

El modelo nunca debe escribir directamente en tablas finales.

## PDFs

Para consistencia profesional:

- Preferir generación server-side/job si la fidelidad importa.
- Registrar cada exportación en tabla `exports` si se genera por job.
- Permitir reintentos y errores visibles.
- En MVP, los PDFs generados son solo descarga y no se guardan automáticamente en MySet.

## Seguridad mínima

- Policies Laravel en cada módulo.
- Form Requests para validación server-side.
- Sanitización de HTML/textos editables.
- Cifrado o minimización de datos especialmente sensibles.
- Rate limiting en auth, invitaciones, subida de archivos e importación.
- Separar permisos de seguridad de límites de plan comercial.

## Testing recomendado

- Backend:
  - Unit tests para servicios de cálculo.
  - Feature tests para endpoints/policies.
  - Tests de jobs de export/import.
- Frontend:
  - Tests de componentes críticos y hooks.
  - E2E para flujos de usuario.
- Seguridad:
  - Tests específicos de fuga de datos por usuario/rol.

## Contratos frontend/backend

Decidir una de estas opciones:

1. DTOs Laravel + recursos Inertia tipados manualmente.
2. OpenAPI para endpoints JSON.
3. Generación de tipos desde backend hacia TypeScript.

Recomendación: empezar simple con recursos/DTOs bien nombrados y añadir generación de contratos cuando el API crezca.
