# Importación PDF con IA y salida estructurada

Fecha: 2026-04-25  
Estado: borrador inicial. Se definirá profundamente más adelante.

## Decisión

La importación de PDF de plan de rodaje forma parte del MVP. Es una funcionalidad clave de valor diferencial.

La idea principal es usar un modelo capaz de entender el PDF en lenguaje natural y devolver un **structured output** validable, con el que SetLux pueda rellenar partes de la app: proyecto, calendario/necesidades, equipo, jornadas, notas y posibles datos de producción.

## Objetivo de producto

Reducir al máximo el trabajo manual de trasladar un plan de rodaje/call sheet/plan PDF a SetLux.

El usuario debería poder:

1. Subir un PDF.
2. Ver que SetLux lo analiza.
3. Revisar una previsualización estructurada.
4. Resolver dudas/conflictos.
5. Aplicar el resultado a calendario/equipo/proyecto sin perder control.

## Principios

- Nunca aplicar automáticamente cambios sin preview y confirmación.
- El modelo propone; SetLux valida.
- El structured output debe tener schema versionado.
- Toda importación debe ser trazable y reversible o al menos revisable.
- El usuario debe poder corregir antes de aplicar.
- La importación debe tolerar PDFs heterogéneos, incompletos y con formatos no estándar.
- La seguridad del archivo es obligatoria: tamaño, tipo, permisos, almacenamiento temporal y borrado/retención.

## Flujo MVP propuesto

```text
Upload PDF
  ↓
Validación archivo/permisos
  ↓
Extracción de texto + metadatos + páginas/imágenes si hace falta
  ↓
Normalización de contenido extraído
  ↓
Llamada a modelo con schema de salida estructurada
  ↓
Validación estricta del JSON contra schema
  ↓
Postprocesado y detección de conflictos
  ↓
Preview editable por el usuario
  ↓
Aplicación parcial o completa a SetLux
  ↓
Registro de importación y auditoría
```

## Qué podría rellenar

### Datos de proyecto

- Nombre de producción.
- Productora.
- Fechas aproximadas.
- Localizaciones principales.
- Director/DoP si aparecen.
- Notas generales.

### Equipo

- Nombres de personas.
- Roles detectados.
- Teléfonos/emails si aparecen y decidimos guardarlos.
- Relación con departamento de iluminación.

### Calendario / necesidades

- Semanas/días.
- Fechas.
- Tipo de día: prep, shoot, prelight, pickup, descanso, viaje, etc.
- Horarios de convocatoria/wrap si aparecen.
- Localización.
- Unidades/bloques.
- Notas relevantes.
- Necesidades por persona/rol si aparecen.

### Reportes/condiciones/nómina

En MVP no debería rellenar reportes o nómina directamente salvo que el documento realmente contenga datos de ejecución. Lo normal será que alimente calendario/equipo y sirva como base para reportes posteriores.

## Structured output — esquema conceptual

Schema inicial orientativo, no definitivo:

```json
{
  "schemaVersion": "plan-import.v1",
  "confidence": 0.0,
  "document": {
    "title": "string|null",
    "language": "es|en|ca|unknown",
    "detectedType": "shooting_plan|call_sheet|schedule|unknown",
    "dateRange": {
      "start": "YYYY-MM-DD|null",
      "end": "YYYY-MM-DD|null"
    }
  },
  "project": {
    "productionName": "string|null",
    "productionCompany": "string|null",
    "director": "string|null",
    "dop": "string|null",
    "notes": ["string"]
  },
  "people": [
    {
      "name": "string",
      "roleRaw": "string|null",
      "roleNormalized": "gaffer|best_boy|electrician|other|null",
      "department": "lighting|camera|production|unknown",
      "phone": "string|null",
      "email": "string|null",
      "confidence": 0.0
    }
  ],
  "days": [
    {
      "date": "YYYY-MM-DD|null",
      "dayLabel": "string|null",
      "dayType": "prep|shoot|prelight|pickup|travel|off|holiday|unknown",
      "location": "string|null",
      "callTime": "HH:mm|null",
      "wrapTime": "HH:mm|null",
      "notes": ["string"],
      "assignments": [
        {
          "personName": "string|null",
          "roleRaw": "string|null",
          "needed": true,
          "notes": ["string"]
        }
      ],
      "confidence": 0.0
    }
  ],
  "warnings": [
    {
      "code": "string",
      "message": "string",
      "severity": "info|warning|error",
      "page": 1
    }
  ],
  "unmappedText": ["string"]
}
```

## Validación y aplicación

El modelo no escribe directamente en tablas finales. Debe pasar por un objeto intermedio `ImportPreview`.

Validaciones mínimas:

- Fechas válidas.
- Días dentro de rango razonable.
- Duplicados detectados.
- Roles no reconocidos marcados como pendientes.
- Personas ambiguas agrupadas para revisión.
- Conflictos con calendario existente.
- Campos sensibles revisados antes de guardar.

Aplicación posible:

- Aplicar todo.
- Aplicar solo datos de proyecto.
- Aplicar solo equipo.
- Aplicar solo calendario.
- Aplicar días seleccionados.
- Ignorar campos/personas/días concretos.

## Modelo de datos de importación

Tablas relacionadas ya previstas:

- `import_jobs`
- `myset_files` o storage temporal para fuente, si se conserva.
- `audit_logs`

Campos útiles para `import_jobs`:

- `id`
- `project_id`
- `user_id`
- `source_file_path`
- `status`: uploaded/extracting/analyzing/needs_review/applied/failed/cancelled
- `schema_version`
- `raw_extracted_text_path` opcional
- `structured_output json`
- `validated_preview json`
- `warnings json`
- `applied_at`
- `error_message`

## Arquitectura técnica orientativa

### Backend Laravel

- Controller para subir PDF.
- FormRequest con validación de archivo y permisos.
- Job `ExtractPdfContentJob`.
- Job `AnalyzePlanWithModelJob`.
- Servicio `PlanImportStructuredOutputValidator`.
- Servicio `PlanImportPreviewBuilder`.
- Servicio `ApplyPlanImport` con transacciones.
- Policies para importar y aplicar cambios.

### Extracción de PDF

Puede haber dos caminos:

1. PDF con texto seleccionable: extraer texto por páginas.
2. PDF escaneado o complejo: convertir páginas a imágenes y usar modelo multimodal/OCR.

La decisión técnica exacta queda pendiente.

### LLM / modelo

Pendiente de elegir proveedor/modelo. Requisitos:

- Entender documentos largos o multipágina.
- Soportar salida estructurada validable.
- Manejar español, inglés y catalán.
- Permitir control de coste/latencia.
- Buen comportamiento con PDFs heterogéneos.

## UX de preview

Pantallas mínimas:

1. **Subida:** arrastrar/seleccionar PDF, explicar límites.
2. **Procesando:** estado por pasos.
3. **Resultado:** resumen de lo detectado.
4. **Revisión:** tabs/secciones para Proyecto, Equipo, Calendario, Advertencias.
5. **Conflictos:** comparar existente vs importado.
6. **Aplicación:** confirmar cambios.
7. **Resultado final:** qué se creó/actualizó/ignoró.

## Riesgos

- PDFs con formatos muy distintos.
- Tablas mal extraídas.
- Fechas ambiguas sin año.
- Nombres duplicados.
- Roles no estándar.
- Alucinaciones del modelo.
- Coste/latencia.
- Datos sensibles incluidos en PDFs.
- Archivo malicioso o demasiado grande.

## Mitigaciones

- Schema estricto y validación server-side.
- Preview obligatoria.
- Mostrar confianza y warnings.
- No inferir importes económicos si no están explícitos.
- Mantener texto no mapeado para revisión.
- Tests con PDFs reales anonimizados.
- Límite de tamaño/páginas en MVP.
- Auditoría de aplicación.

## Preguntas pendientes para la definición profunda

1. ¿Qué tipos exactos de PDF objetivo queremos soportar primero?
2. ¿Solo planes de rodaje o también call sheets?
3. ¿Qué campos mínimos debe extraer para considerar la importación exitosa?
4. ¿Permitimos actualizar calendario existente o solo importar sobre calendario vacío en MVP?
5. ¿Qué pasa si el modelo detecta equipo fuera del departamento de iluminación?
6. ¿Guardamos el PDF original después de importar o lo borramos?
7. ¿Qué proveedor/modelo usaremos?
8. ¿Cuáles serán límites de tamaño/páginas/coste?
9. ¿Cómo se anonimizarán PDFs reales para tests?
