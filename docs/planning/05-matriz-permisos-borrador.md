# Matriz de permisos — borrador

Fecha: 2026-04-25  
Estado: pendiente de validación funcional.

## Separación importante

Hay dos conceptos distintos:

1. **Rol profesional/persona de equipo**: gaffer, best boy, eléctrico, maquinista, etc.
2. **Rol de acceso al proyecto**: quién puede ver/editar/administrar dentro de la app.

Un Best Boy puede ser a la vez una persona de equipo y un administrador del proyecto. Un técnico puede existir en el equipo sin cuenta de usuario.

## Roles de acceso MVP aceptados

1. **Admin de proyecto**: owner/Gaffer/Best Boy, con control completo del proyecto.
2. **Miembro invitado**: usuario invitado, con acceso restringido a su información y a lo que se le permita explícitamente.

Roles como Manager/Editor o Viewer quedan fuera del MVP salvo que aparezca una necesidad clara.

## Matriz inicial

| Módulo / acción | Admin proyecto | Miembro invitado |
| --- | --- | --- |
| Ver proyecto | Sí | Sí, si pertenece |
| Editar datos de proyecto | Sí | No |
| Cerrar/reabrir proyecto | Sí | No |
| Borrar proyecto | Solo owner | No |
| Ver equipo completo | Sí | Sí |
| Editar equipo | Sí | No |
| Invitar usuarios | Sí | No |
| Gestionar membresías | Sí | No |
| Ver condiciones generales | Sí | Sí, textos generales |
| Ver precios de todos los roles | Sí | No |
| Ver precio de su rol | Sí | Sí |
| Editar condiciones/precios | Sí | No |
| Ver calendario completo | Sí | Sí, sin información económica |
| Ver solo días asignados | No aplica | No: ve calendario completo filtrado |
| Editar calendario | Sí | No |
| Ver reportes completos | Sí | No |
| Ver reporte propio | Sí | Sí |
| Editar reportes | Sí | No, salvo permiso futuro |
| Ver nómina completa | Sí | No |
| Ver nómina propia | Sí | Sí, solo propia |
| Descargar nómina/timesheet propio | Sí | Sí, solo propio |
| Ver timesheet propio | Sí | Sí |
| Gestionar MySet completo | Sí | No |
| Ver carpeta/archivo MySet | Sí | Solo si tiene permiso |
| Subir a MySet | Sí | No en MVP |
| Descargar de MySet | Sí | Si tiene permiso |
| Exportar PDFs globales | Sí | No |
| Importar plan PDF | Sí | No |
| Exportar PDFs propios | Sí | Sí, solo propios |

## Regla de proyecto cerrado

Cuando un proyecto está cerrado:

- Nadie puede modificar datos operativos/económicos.
- Admin puede consultar y exportar.
- Miembros pueden consultar lo permitido.
- MySet permite consultar/descargar pero no subir, mover, renombrar ni borrar.
- Reabrir proyecto, si existe, debe auditarse.

## Reglas de seguridad

- Todo permiso debe validarse en backend con Policies/Gates.
- El frontend solo oculta o deshabilita; no protege por sí mismo.
- Las consultas de reportes/nómina/condiciones deben filtrar en servidor.
- Las URLs de archivos deben requerir autorización o ser firmadas y temporales.

## Decisiones pendientes

1. ¿Se necesitan permisos por módulo además de roles fijos?
2. ¿El borrado de proyecto será soft delete, hard delete diferido o ambos?
3. ¿Qué acciones exactas de MySet puede hacer un admin sobre carpetas compartidas: crear, renombrar, mover, borrar?
4. ¿Cómo se revoca el acceso a una carpeta ya compartida?

Ya decidido:

- Gaffer y Best Boy son admins en el MVP.
- Viewer queda fuera del MVP salvo necesidad posterior.
- Solo owner borra proyectos.
- Miembro invitado ve calendario completo sin economía.
- Miembro invitado ve precio de su rol + textos generales.
- Miembro invitado puede descargar timesheet y nómina propia.
- MySet MVP usa permisos por carpeta con herencia a archivos.
- Solo admins suben archivos a MySet.

## MySet MVP

- Permisos por carpeta.
- Los archivos heredan los permisos de la carpeta contenedora.
- Solo admins pueden subir, renombrar, mover o borrar archivos en MVP.
- Miembros invitados pueden ver/descargar según permisos de carpeta.
- Proyecto cerrado deja MySet en solo lectura/descarga.
