# Modelo de datos — borrador inicial

Fecha: 2026-04-25  
Estado: borrador, no migración definitiva.

## Principios

- Separar **usuarios de la app** de **personas del equipo del proyecto**.
- Una persona de equipo puede existir sin cuenta de usuario.
- Una persona de equipo puede vincularse a un usuario si acepta invitación.
- Los permisos de acceso viven en membresías del proyecto, no en el rol profesional global.
- Las reglas económicas deben ser versionables y testables.
- Cada proyecto pertenece obligatoriamente a un usuario concreto mediante `owner_user_id`.
- No hay compatibilidad obligatoria con el modelo localStorage anterior.

## Entidades principales

### users

Usuario autenticable.

Campos orientativos:

- id / ulid
- name
- email
- password
- email_verified_at
- locale
- theme
- professional_role
- gender
- created_at / updated_at

### user_profiles

Opcional si queremos separar perfil extendido.

Campos orientativos:

- user_id
- phone
- country
- region
- avatar_path
- preferences json

### projects

Proyecto de producción.

Campos orientativos:

- id / ulid
- owner_user_id
- name
- production_company
- dop
- director
- warehouse
- type: weekly/monthly/daily
- language
- country
- region
- status: active/closed
- starts_on / ends_on
- closed_at
- version / lock_version
- created_at / updated_at

### project_memberships

Acceso de usuarios a proyectos.

Campos orientativos:

- id / ulid
- project_id
- user_id
- access_role: owner/gaffer/best_boy/member/viewer/etc.
- status: active/pending/disabled
- permissions json, si hay overrides
- invited_by_user_id
- accepted_at
- created_at / updated_at

### project_invitations

Invitaciones antes de que exista o acepte un usuario.

Campos orientativos:

- id / ulid
- project_id
- email
- intended_access_role
- intended_project_person_id nullable
- token_hash
- expires_at
- accepted_at
- revoked_at
- invited_by_user_id

### project_roles

Catálogo de roles por proyecto, incluidos personalizados.

Campos orientativos:

- id / ulid
- project_id
- base_role_key nullable
- name
- sort_order
- active

### project_people

Personas/trabajadores del equipo dentro de un proyecto.

Campos orientativos:

- id / ulid
- project_id
- linked_user_id nullable
- project_role_id
- name
- email nullable
- phone nullable
- group: base/refuerzo/prelight/pickup/etc.
- notes
- active

Nota: el nombre `project_people` evita confundirlo con `project_memberships`.

### conditions

Configuración económica principal del proyecto.

Campos orientativos:

- id / ulid
- project_id
- mode: weekly/monthly/daily
- schema_version
- parameters json
- editable_texts json
- created_by_user_id
- updated_by_user_id
- version

### condition_price_rows

Precios por rol.

Campos orientativos:

- id / ulid
- condition_id
- project_role_id
- base_amount
- overtime_amounts json
- allowances json
- sort_order

### weeks

Semana operativa del proyecto.

Campos orientativos:

- id / ulid
- project_id
- number
- label
- starts_on
- ends_on
- phase: prep/shoot/wrap/custom
- sort_order
- version

### days

Día concreto dentro de semana/proyecto.

Campos orientativos:

- id / ulid
- project_id
- week_id
- date
- day_type
- is_holiday
- holiday_name
- call_time
- wrap_time
- break_minutes
- location
- notes
- version

### day_assignments

Asignaciones de personas a días.

Campos orientativos:

- id / ulid
- day_id
- project_person_id
- assignment_type
- planned_start
- planned_end
- notes

### extra_blocks

Bloques extra planificados o reportados.

Campos orientativos:

- id / ulid
- day_id
- project_person_id nullable
- type
- starts_at
- ends_at
- minutes
- source: planned/reported/manual
- notes

### reports

Cabecera de reporte por proyecto/semana/día según convenga.

Campos orientativos:

- id / ulid
- project_id
- week_id
- day_id nullable
- status: draft/confirmed
- version
- created_by_user_id

### report_rows

Reporte por persona y día.

Campos orientativos:

- id / ulid
- report_id
- day_id
- project_person_id
- actual_start
- actual_end
- break_minutes
- overtime_minutes
- turnaround_minutes
- night_minutes
- manual_adjustments json
- auto_calculated json
- notes

### report_concepts

Conceptos adicionales imputables.

Campos orientativos:

- id / ulid
- report_row_id
- concept_type
- quantity
- unit_amount
- total_amount
- notes

### payroll_periods

Agrupación de nómina.

Campos orientativos:

- id / ulid
- project_id
- mode
- period_start
- period_end
- status
- generated_from_report_version nullable

### payroll_rows

Resultado por persona/rol/periodo.

Campos orientativos:

- id / ulid
- payroll_period_id
- project_person_id
- project_role_id
- gross_amount
- breakdown json
- visible_to_user_id nullable

### timesheets

Documento o estado de timesheet por persona/semana.

Campos orientativos:

- id / ulid
- project_id
- week_id
- project_person_id
- status
- data json
- export_id nullable

### myset_folders

Árbol documental.

Campos orientativos:

- id / ulid
- project_id
- parent_id nullable
- name
- sort_order
- created_by_user_id
- deleted_at nullable

### myset_files

Metadatos de archivos.

Campos orientativos:

- id / ulid
- project_id
- folder_id nullable
- disk
- storage_path
- original_name
- display_name
- mime_type
- size_bytes
- checksum
- uploaded_by_user_id
- deleted_at nullable

### myset_permissions

Permisos documentales granulares.

Campos orientativos:

- id / ulid
- project_id
- subject_type: user/membership/role
- subject_id
- resource_type: folder/file
- resource_id
- permission: view/download/manage
- granted_by_user_id

### exports

Registro de exportaciones.

Campos orientativos:

- id / ulid
- project_id
- user_id
- export_type
- status: queued/running/done/failed
- disk
- storage_path
- error_message
- metadata json

### import_jobs

Registro de importaciones, especialmente importación PDF con IA/structured output.

Campos orientativos:

- id / ulid
- project_id
- user_id
- import_type
- status: uploaded/extracting/analyzing/needs_review/applied/failed/cancelled
- schema_version
- source_file_id nullable
- source_file_path nullable
- raw_extracted_text_path nullable
- structured_output json
- validated_preview json
- warnings json
- applied_at
- error_message

### feedback

Sugerencias/soporte.

Campos orientativos:

- id / ulid
- user_id nullable
- project_id nullable
- message
- context json
- status

### audit_logs

Auditoría de acciones sensibles.

Campos orientativos:

- id / ulid
- actor_user_id nullable
- project_id nullable
- action
- subject_type
- subject_id
- before json nullable
- after json nullable
- ip_address
- user_agent
- created_at

## Relaciones críticas

```text
users 1─N project_memberships N─1 projects
projects 1─N project_people
project_people N─1 project_roles
project_people N─0/1 users
projects 1─N conditions 1─N condition_price_rows
projects 1─N weeks 1─N days 1─N day_assignments
projects 1─N reports 1─N report_rows 1─N report_concepts
projects 1─N payroll_periods 1─N payroll_rows
projects 1─N myset_folders / myset_files / myset_permissions
```

## Dudas del modelo

- ¿Necesitamos organizaciones/workspaces para facturación Education/Pro o basta owner directo en MVP?
- ¿Un usuario puede tener múltiples roles de acceso en el mismo proyecto?
- ¿Best Boy y Gaffer son roles de acceso, roles de equipo, o ambos?
- ¿La persona del equipo debe poder tener email duplicado entre proyectos?
- ¿Qué datos personales sensibles se guardarán realmente?
- ¿Timesheet es entidad persistida o exportación generada bajo demanda?
- ¿El PDF original de una importación se conserva, se borra tras aplicar o se mueve a storage temporal con retención?
