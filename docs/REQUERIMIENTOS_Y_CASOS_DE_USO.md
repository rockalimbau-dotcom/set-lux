# SetLux - Especificacion funcional y tecnica unificada

Documento creado el 25/04/2026 a partir del estado actual de la aplicacion. Su objetivo es servir como contexto completo para reiniciar SetLux desde cero con IA, sin perder decisiones funcionales, flujos, calculos, datos, integraciones ni dependencias entre modulos.

Esta version unifica la documentacion anterior y el analisis tecnico en una sola estructura. Las secciones avanzan de lo general a lo especifico: primero producto y arquitectura, despues datos/rutas/modulos/pantallas, y finalmente reglas, requisitos, riesgos y plan de reconstruccion.

## Indice

1. Resumen ejecutivo del producto
2. Arquitectura tecnica actual
3. Usuarios, autenticacion, permisos y seguridad
4. Idiomas, tema y preferencias
5. Modelo de datos y persistencia
6. Rutas, endpoints y navegacion
7. Mapa funcional por modulos
8. Pantallas y funcionalidades detalladas
9. Condiciones, calculos y logica critica
10. Comandos, jobs y procesos automaticos
11. Integraciones externas
12. Entradas, salidas y exportaciones
13. Reglas de negocio consolidadas
14. Flujos funcionales y casos de uso
15. Requisitos funcionales para rehacer
16. Requisitos tecnicos para rehacer
17. Ideas futuras de monetizacion y planes
18. Riesgos, dudas y zonas ambiguas
19. Plan para reconstruirlo desde cero con IA

## 1. Resumen ejecutivo del producto

SetLux es una aplicacion web para planificar y gestionar proyectos audiovisuales del departamento de iluminacion. Centraliza:

- Datos generales de proyectos.
- Condiciones economicas y laborales.
- Equipo tecnico por grupos.
- Calendario semanal de preproduccion y produccion.
- Espacio documental del proyecto mediante MySet.
- Timesheets individuales.
- Reportes reales de rodaje.
- Calculo de nominas.
- Exportaciones PDF.

El producto actual funciona como una app React/Vite con persistencia local en `localStorage`. No hay backend de negocio propio salvo envio de sugerencias a Formspree y traduccion potencial via DeepL indicada en textos de condiciones.

### Resumen ampliado para reconstruccion

SetLux es una aplicacion web especializada para gestionar el departamento de iluminacion en proyectos audiovisuales. Resuelve la dispersion de datos entre hojas de calculo, documentos, mensajes y notas, conectando en un solo flujo las condiciones economicas, equipo, calendario, reportes, nomina y timesheets.

Problema que resuelve:

- Centralizar datos de proyectos y responsables.
- Definir condiciones economicas por tipo de proyecto.
- Mantener un roster por roles, grupos y generos.
- Planificar semanas de preproduccion y produccion.
- Convertir calendario en reportes reales.
- Calcular nominas por persona y periodo.
- Generar PDFs operativos.

Actores detectados:

- Usuario demo/autenticado.
- Gaffer.
- Best Boy.
- Tecnico de iluminacion.
- Usuario administrador demo.
- Productora/responsables externos reflejados en datos, pero no autenticados.

Modulos principales:

- App shell, rutas y autenticacion local.
- Proyectos.
- Condiciones.
- Equipo.
- Calendario/Necesidades.
- MySet.
- Timesheet.
- Reportes.
- Nomina.
- Perfil y configuracion.
- Tutorial/onboarding.
- Feedback.
- Exportaciones PDF.
- Importacion de plan de rodaje PDF.
- i18n y tema.

## 2. Arquitectura tecnica actual

Stack detectado:

- React `19.1.1`.
- React DOM `19.1.1`.
- TypeScript `5.9.2`.
- Vite `7.1.3`.
- React Router DOM `6.30.1`.
- i18next `25.7.3`.
- react-i18next `16.5.1`.
- Tailwind CSS `3.4.10`.
- Vitest `3.2.4`.
- Testing Library.
- jsPDF `3.0.3`.
- html2canvas `1.4.1`.
- html2pdf.js `0.10.1`.
- pdfjs-dist `5.4.530`.
- Vercel Analytics.

Estructura:

```text
src/
  app/          App shell, provider de auth, rutas, layout y login/register.
  features/     Modulos funcionales: projects, condiciones, equipo, necesidades,
                reportes, nomina, timesheet, planificacion.
  shared/       Componentes comunes, hooks, servicios, constantes, PDF y utilidades.
  i18n/         Configuracion i18next.
  locales/      Traducciones es/ca/en.
  test/         Setup de Vitest.
public/         Logos e imagenes.
docs/           Documentacion funcional.
```

Patron arquitectonico:

- Feature-based frontend.
- SPA con routing client-side.
- Estado local en React y persistencia en `localStorage`.
- Logica de negocio repartida entre hooks, utils, componentes de modulo y helpers de exportacion.
- No hay capa de API, controladores backend ni base de datos.

Puntos de entrada:

- `src/main.tsx`: inicializa tema, favicon, i18n, error boundary, Vercel Analytics en produccion y renderiza `App`.
- `src/App.tsx`: monta `AuthProvider`, `BrowserRouter` y `AppInner`.
- `src/app/App/AppInner.tsx`: controla modo login/register/projects/project, proyectos, tutorial y layout general.
- `src/app/routes/AppRouter.tsx`: decide ruta/pantalla.

Scripts npm:

- `npm run dev`: Vite dev server.
- `npm run build`: build Vite.
- `npm run preview`: preview de build.
- `npm run test`, `test:run`, `test:ci`, `coverage`: Vitest.
- `npm run lint`, `lint:fix`: ESLint JS/JSX.
- `npm run lint:css`: Stylelint.
- `npm run format`, `format:check`: Prettier.
- `npm run quality`: lint, CSS lint, format check y tests.

Despliegue:

- `vercel.json` define framework Vite, build `npm run build`, output `dist`.
- Rewrite `/(.*)` a `/index.html` para soportar SPA routing.

Servicios externos:

- Formspree para feedback.
- Calendarific opcional para festivos via `VITE_CALENDARIFIC_KEY`.
- BOE como enlace externo.
- DeepL mencionado por traducciones/textos como posible API via `VITE_DEEPL_API_KEY`, pero no se detecta llamada activa en el codigo revisado.
- Vercel Analytics en produccion.

## 3. Usuarios, autenticacion, permisos y seguridad

### Usuario demo

El login actual valida contra una lista cerrada de usuarios demo con contrasena `1234`. El usuario `admin` tambien existe. Si el usuario no esta en la lista, se muestra error de credenciales.

### Registro

Existe formulario de registro, aunque el enlace desde login esta comentado. El registro guarda `profile_v1` con nombre, apellido, email, rol, idioma y genero neutral, pero no crea credenciales reales para login.

Vision futura:

- El usuario debe registrarse en la app con sus datos reales.
- El registro debe pedir como minimo nombre, apellidos, email, contrasena, rol profesional, idioma y genero de tratamiento.
- El rol elegido en el registro debe servir como rol profesional inicial, no necesariamente como permiso global de administracion.
- El alta debe crear una cuenta persistente en backend, con email unico y sesion segura.
- El usuario podra ser invitado a proyectos por Gaffer o Best Boy y aceptar la invitacion para vincular su cuenta al proyecto.

### Perfil y rol

El perfil guarda:

- Nombre.
- Apellido.
- Email.
- Rol.

El rol se elige desde el catalogo `ROLES`. En `Equipo`, el permiso de edicion por rol contempla Gaffer (`G`) y Best Boy (`BB`), aunque en el detalle de proyecto se fuerza `allowEditOverride` cuando el proyecto esta activo.

Modelo futuro de roles:

- Rol profesional: cargo del usuario dentro del proyecto, por ejemplo Gaffer, Best Boy, Electrico, Auxiliar, Tecnico de mesa, etc.
- Rol de permiso dentro de proyecto: define lo que puede hacer ese usuario en ese proyecto.
- Gaffer y Best Boy deben tener permisos completos sobre el proyecto: crear, editar, borrar, invitar, gestionar condiciones, equipo, calendario, reportes, nomina, timesheet y MySet.
- El resto del equipo debe tener acceso restringido y centrado en su propia informacion.
- Un mismo usuario puede tener permisos distintos en proyectos diferentes.

Permisos futuros por tipo de usuario:

| Modulo | Gaffer / Best Boy | Resto del equipo |
| --- | --- | --- |
| Proyecto | ver y editar datos generales | ver datos basicos del proyecto |
| Condiciones | ver y editar todas las condiciones | ver solo la fila de precios correspondiente a su rol |
| Equipo | ver y editar todo el equipo | ver el equipo completo |
| Calendario | ver y editar calendario | ver calendario, salvo que se decida restringir detalles |
| Reportes | ver y editar todos los reportes | ver solo sus propios reportes |
| Nomina | ver y editar toda la nomina | ver solo su propia nomina |
| Timesheet | ver y editar/generar timesheets | ver solo su propio timesheet |
| MySet | gestionar carpetas, archivos y permisos | acceder solo a carpetas/archivos autorizados |
| Invitaciones | invitar y revocar miembros | sin permiso por defecto |

Colaboracion futura:

- Gaffer y Best Boy deben poder trabajar de forma simultanea sobre el mismo proyecto.
- Los cambios deben sincronizarse entre sesiones para evitar que una persona sobrescriba el trabajo de la otra.
- La app debe registrar quien crea o modifica datos relevantes.
- Cuando haya edicion concurrente, el sistema debe resolver conflictos o bloquear campos concretos mientras otro usuario los edita.

### Estados de proyecto

Cada proyecto tiene estado `Activo` o `Cerrado`.

- Activo: permite editar modulos.
- Cerrado: muestra el contenido en modo solo lectura; botones de edicion se deshabilitan o no ejecutan cambios.
- El estado se cambia desde el detalle del proyecto con modal de confirmacion.

### Seguridad y autorizacion tecnica

Autenticacion actual:

- Local/demo.
- Usuarios hardcodeados en `useAuthHandlers.ts`.
- Contrasena comun `1234` en usuarios demo.
- `app_user` en localStorage.
- No hay tokens, sesiones backend, refresh tokens ni expiracion.

Autorizacion:

- Proyecto activo/cerrado controla edicion.
- `EquipoTab` contempla rol G/BB, pero desde `ProjectDetailContent` se permite editar si el proyecto esta activo.
- No hay ACL real por modulo.
- En la reconstruccion se requiere ACL real por proyecto, modulo, entidad y propietario de dato.
- Las reglas de visibilidad para usuarios no Gaffer/Best Boy deben aplicarse en backend, no solo ocultarse en frontend.
- Reportes, nomina, timesheet y condiciones deben filtrar datos por `userId`, `personId` y rol profesional cuando el usuario sea miembro restringido.
- MySet necesita permisos por proyecto y, preferiblemente, por carpeta/archivo.

CSRF/CORS:

- No aplica a API propia porque no hay backend.
- Formspree depende de su configuracion externa.

Subida de archivos:

- Importacion de plan PDF lee archivo local en navegador con pdfjs.
- Adjuntos de imagen/ticket estan en beta y no suben nada.

Sanitizacion:

- React escapa por defecto.
- Hay usos de `dangerouslySetInnerHTML` para textos traducidos/plantillas.
- Exportaciones construyen HTML; varias utilidades escapan valores, pero debe auditarse al rehacer.

Datos sensibles:

- Perfil: nombre, email, rol, genero.
- Timesheet: DNI, Numero SS trabajador, CIF y CC Seguridad Social empresa.
- Todo se guarda en localStorage sin cifrado.

Riesgos:

- Credenciales demo visibles en cliente.
- Datos laborales sensibles en localStorage.
- Sin control de acceso real.
- Posible XSS si plantillas editables no se escapan correctamente antes de exportar/renderizar.
- API keys `VITE_*` son publicas en frontend.

## 4. Idiomas, tema y preferencias

Idiomas soportados: espanol, catalan e ingles.

- La configuracion global se guarda en `settings_v1` y `profile_v1`.
- El idioma del proyecto puede ser distinto del idioma global.
- Al abrir un proyecto, la app cambia temporalmente al idioma del proyecto.
- Al salir del proyecto, vuelve al idioma del perfil.

Tema soportado: claro y oscuro.

- Se guarda en `localStorage.theme` y `settings_v1.theme`.
- Se aplica mediante `data-theme` en el `documentElement`.

Genero soportado: hombre, mujer, neutro.

- Afecta a etiquetas de roles con variaciones de genero.

## 5. Modelo de datos y persistencia

### Proyecto

Campos de proyecto:

- `id`
- `nombre`
- `dop`
- `almacen`
- `productora`
- `gaffer`
- `bestBoy`
- `jefeProduccion`
- `transportes`
- `localizaciones`
- `coordinadoraProduccion`
- `estado`: `Activo` o `Cerrado`
- `conditions.tipo`: `semanal`, `mensual` o `diario`
- `country`
- `region`
- `language`: `es`, `ca` o `en`
- `roleCatalog`: roles personalizados por proyecto
- `team`: equipo por grupos
- `conditions.semanal`, `conditions.mensual`, `conditions.diario`: condiciones guardadas por modo

Lista de proyectos: `projects_v1`.

### Equipo

Grupos:

- `base`
- `reinforcements`
- `prelight`
- `pickup`

Miembro:

- `id`
- `personId`
- `role`
- `roleId`
- `roleLabel`
- `name`
- `gender`
- `source`
- `seq`

### Calendario

Clave por proyecto: `needs_${projectId}`.

Estructura:

- `pre`: semanas de preproduccion.
- `pro`: semanas de produccion.

Semana:

- `id`
- `label`
- `startDate`
- `days`
- `customRows`
- `rowLabels`
- `open`

Dia:

- Localizacion y secuencias: `loc`, `seq`.
- Jornada equipo base: `crewTipo`, `crewStart`, `crewEnd`, `crewList`.
- Refuerzos y horarios diferenciales: `refList`, `refBlocks`, `refStart`, `refEnd`, `refTipo`.
- Logistica: `needTransport`, `transportExtra`, `needGroups`, `needCranes`, `extraMat`.
- Precall: `precall`.
- Prelight: `preList`, `prelightTipo`, `preStart`, `preEnd`.
- Recogida: `pickList`, `pickupTipo`, `pickStart`, `pickEnd`.
- Material base diario: `needLight`.
- Observaciones: `obs`.
- Campos personalizados.

### MySet

Nueva funcionalidad requerida. Clave recomendada por proyecto: `myset_${projectId}` si se mantiene una fase local-first, o tablas `myset_files` y `myset_folders` si se reconstruye con backend.

Proposito:

- Crear un espacio de trabajo documental dentro de cada proyecto.
- Funcionar como una carpeta tipo Google Drive limitada al proyecto.
- Guardar documentacion, imagenes, referencias, permisos, archivos de produccion y material compartido del equipo.

Estructura recomendada:

- `folders`: arbol de carpetas.
- `files`: documentos e imagenes subidos.
- `currentFolderId`: carpeta seleccionada por el usuario.
- `viewMode`: `grid` o `list`.
- `sortBy`: nombre, fecha, tipo o tamano.
- `search`: texto de busqueda actual.

Carpeta:

- `id`
- `projectId`
- `parentId`: `null` para raiz.
- `name`
- `color`, opcional.
- `createdAt`
- `updatedAt`
- `createdBy`
- `path`: ruta materializada opcional para busquedas y migrares.

Archivo:

- `id`
- `projectId`
- `folderId`
- `name`
- `mimeType`
- `extension`
- `sizeBytes`
- `storageKey` o `localObjectUrl`
- `thumbnailKey`, opcional para imagenes.
- `description`, opcional.
- `tags`, opcional.
- `createdAt`
- `updatedAt`
- `createdBy`

Reglas de datos:

- Una carpeta no puede depender de si misma ni de una carpeta hija.
- No debe permitirse borrar una carpeta con contenido sin confirmacion.
- En backend real, los archivos deben almacenarse fuera de la base de datos, por ejemplo S3-compatible, y la base de datos solo debe guardar metadatos.
- En fase local, las imagenes/documentos pequenos podrian guardarse como `Blob`/IndexedDB; no se recomienda `localStorage` para archivos reales por limite de tamano.

### Usuarios, miembros y permisos futuros

La reconstruccion debe introducir un modelo multiusuario real.

Entidad `User`:

- `id`
- `firstName`
- `lastName`
- `email`
- `passwordHash`
- `professionalRoleId`
- `language`
- `gender`
- `createdAt`
- `updatedAt`

Entidad `ProjectMembership`:

- `id`
- `projectId`
- `userId`
- `personId`: enlace opcional con el miembro de Equipo.
- `professionalRoleId`
- `permissionRole`: `owner`, `gaffer`, `best_boy`, `crew`.
- `status`: `invited`, `active`, `revoked`.
- `invitedBy`
- `joinedAt`
- `createdAt`
- `updatedAt`

Entidad `ProjectInvitation`:

- `id`
- `projectId`
- `email`
- `professionalRoleId`
- `permissionRole`
- `tokenHash`
- `expiresAt`
- `acceptedAt`
- `createdBy`

Reglas de permisos:

- Gaffer y Best Boy son administradores funcionales del proyecto.
- Gaffer y Best Boy pueden editar de forma simultanea el mismo proyecto.
- Los usuarios de equipo invitados solo pueden consultar su propia informacion sensible.
- La visibilidad personal debe resolverse enlazando `User` con `TeamMember` mediante `personId`.
- Un trabajador invitado puede ver el equipo completo, pero no puede editarlo salvo permiso explicito.
- En Condiciones, un trabajador invitado solo ve la fila de precio que corresponde a su rol profesional dentro del proyecto.
- En Reportes y Nomina, un trabajador invitado solo ve sus propias filas.
- En Timesheet, un trabajador invitado solo ve su propio parte horario.
- En MySet, un trabajador invitado solo accede a carpetas y archivos con permiso otorgado por Gaffer o Best Boy.

Permisos MySet recomendados:

- `none`: sin acceso.
- `viewer`: ver y descargar.
- `commenter`: ver, descargar y comentar si se implementan comentarios.
- `editor`: subir, renombrar, mover y borrar dentro de la carpeta autorizada.
- `manager`: gestionar permisos de carpeta/archivo.

### Modelo tecnico deducido del codigo

No hay base de datos ni migraciones. El modelo se deduce de tipos, claves localStorage y usos.

Claves principales de almacenamiento:

| Clave | Tipo | Proposito |
| --- | --- | --- |
| `app_user` | string | nombre de usuario actual |
| `profile_v1` | object | perfil, idioma y genero |
| `settings_v1` | object | tema y preferencias |
| `theme` | string | compatibilidad tema claro/oscuro |
| `projects_v1` | Project[] | lista de proyectos |
| `project_${id}` | Project | detalle persistido por proyecto |
| `team_${id}` | ProjectTeam | equipo por proyecto |
| `needs_${id}` | NeedsState | calendario/necesidades |
| `needs_plan_file_${id}` | string | nombre de plan importado |
| `needs_open_pre_*`, `needs_open_pro_*` | boolean | acordeones calendario |
| `cond_${id}_semanal` | object | condiciones semanales |
| `cond_${id}_mensual` | object | condiciones mensuales |
| `cond_${id}_diario` | object | condiciones diario |
| `reportes_*` | object | datos de reportes |
| `reportes_horasExtra_*` | string | modo de horas extra |
| `timesheet_*` | object/string | seleccion, perfiles, empresa, notas, catering |
| `nomina_*` | object/boolean/number | estados, IRPF, columnas, rangos |
| `myset_${id}` | object | espacio documental del proyecto, nueva funcionalidad propuesta |
| `tutorial_*` | mixed | tutorial |
| `holidays_*` | object | cache de festivos |

Entidad `Project`:

- `id`, `nombre`, `dop`, `almacen`, `productora`, `gaffer`, `bestBoy`.
- `jefeProduccion`, `transportes`, `localizaciones`, `coordinadoraProduccion`.
- `estado`: `Activo` o `Cerrado`.
- `conditions.tipo`: `semanal`, `mensual`, `diario`.
- `country`, `region`, `language`.
- `team`, `roleCatalog`, `conditions`.

Entidad `ProjectTeam`:

- `base`.
- `reinforcements`.
- `prelight`.
- `pickup`.

Entidad `TeamMember`:

- `id`, `personId`, `role`, `roleId`, `roleLabel`, `name`, `gender`, `source`, `seq`.

Entidad `NeedsState`:

- `pre`: semanas de preproduccion.
- `pro`: semanas de produccion.

Entidad `NeedsWeek`:

- `id`, `label`, `startDate`, `days`, `customRows`, `rowLabels`, `open`.

Entidad `Day`:

- `loc`, `seq`.
- `crewTipo`, `crewStart`, `crewEnd`, `crewList`.
- `refList`, `refBlocks`, `refStart`, `refEnd`, `refTipo`.
- `needTransport`, `transportExtra`, `needGroups`, `needCranes`, `extraMat`.
- `precall`, `preList`, `prelightTipo`, `preStart`, `preEnd`.
- `pickList`, `pickupTipo`, `pickStart`, `pickEnd`.
- `needLight`, `obs`.
- Campos personalizados.

Relaciones logicas:

- Project 1-N Weeks.
- Project 1-1 Team.
- Project 1-N ConditionModel por modo.
- Project 1-N MySet folders.
- MySetFolder 1-N MySet folders y 1-N MySet files.
- TeamMember N-M Day mediante listas por dia.
- Week/Day 1-N ReportRows por persona.
- ReportRows N-1 Nomina agregada por mes/persona.

Indices/unique recomendados al rehacer:

- `projects.id` unico.
- `team_members.personId` unico por proyecto.
- `roles.id` unico por proyecto.
- `weeks.projectId + scope + startDate` unico.
- `reports.projectId + weekId + personId + date` unico.
- `payroll.projectId + month + personId` unico.
- `myset_folders.projectId + parentId + name` unico recomendado.
- `myset_files.projectId + folderId + name` unico recomendado o versionado si se permiten duplicados.

## 6. Rutas, endpoints y navegacion

### Rutas principales

- `/`: login o registro.
- `/projects`: listado de proyectos.
- `/profile`: perfil de usuario.
- `/settings`: configuracion.
- `/project/:id`: detalle de proyecto con parrilla de fases.
- `/project/:id/calendario`: Calendario.
- `/project/:id/equipo`: Equipo.
- `/project/:id/myset`: MySet.
- `/project/:id/reportes`: Reportes.
- `/project/:id/nomina`: Nomina.
- `/project/:id/condiciones`: Condiciones.
- `/project/:id/timesheet`: Timesheet.

### Redirecciones

- `/project/:id/planificacion` redirige a `/project/:id/calendario`.
- `/project/:id/necesidades` redirige a `/project/:id/calendario`.
- En proyectos de tipo `diario`, Timesheet no se muestra en la parrilla y si se intenta abrir se reubica a Calendario.

### Tabla tecnica de rutas

No hay endpoints HTTP backend propios. Las rutas son client-side con React Router.

| Metodo | Ruta | Componente/handler | Parametros | Middleware | Efectos |
| --- | --- | --- | --- | --- | --- |
| GET | `/` | `AppInner` login/register | ninguno | ninguno | muestra login o registro |
| GET | `/projects` | `ProjectsRoute`/`ProjectsScreen` | ninguno | auth local por modo | lista proyectos desde `projects_v1` |
| GET | `/profile` | `ProfileRoute`/`ProfilePage` | ninguno | ninguno | edita `profile_v1` |
| GET | `/settings` | `SettingsRoute`/`SettingsPage` | ninguno | ninguno | edita `settings_v1`, `profile_v1`, tema |
| GET | `/project/:id` | `ProjectDetail` | `id` | hidratacion proyecto | muestra parrilla de fases |
| GET | `/project/:id/equipo` | `EquipoTab` | `id` | proyecto activo/cerrado | lee/escribe team |
| GET | `/project/:id/calendario` | `NecesidadesTab` | `id` | proyecto activo/cerrado | lee/escribe needs |
| GET | `/project/:id/myset` | `MySetTab` futuro | `id` | proyecto activo/cerrado | gestiona carpetas, documentos e imagenes |
| GET | `/project/:id/reportes` | `ReportesTab` | `id` | proyecto activo/cerrado | lee/escribe reportes |
| GET | `/project/:id/nomina` | `NominaTab` | `id` | proyecto activo/cerrado | calcula/guarda nomina |
| GET | `/project/:id/condiciones` | `CondicionesTab` | `id` | proyecto activo/cerrado | lee/escribe condiciones |
| GET | `/project/:id/timesheet` | `TimesheetTab` | `id` | oculto para diario | lee/escribe timesheet |
| GET | `/project/:id/planificacion` | `Navigate` | `id` | ninguno | redirige a `../calendario` |
| GET | `/project/:id/necesidades` | `Navigate` | `id` | ninguno | redirige a `../calendario` |

Respuestas esperadas:

- Al ser SPA, la respuesta HTTP real siempre es `index.html` en produccion por `vercel.json`.
- Los errores funcionales se muestran como UI, alerts o modales.

Efectos secundarios principales:

- Escritura en `localStorage`.
- Descarga de PDF.
- `fetch` a Formspree.
- `fetch` a Calendarific si hay API key.
- Apertura de BOE en nueva pestana.

## 7. Mapa funcional por modulos

#### App shell, auth y routing

Archivos:

- `src/main.tsx`
- `src/App.tsx`
- `src/app/providers/AuthProvider.tsx`
- `src/app/App/AppInner.tsx`
- `src/app/App/AppInner/useAuthHandlers.ts`
- `src/app/routes/AppRouter.tsx`
- `src/app/routes/AppRouter/*`

Proposito:

- Montar la SPA.
- Aplicar tema inicial y favicon.
- Gestionar autenticacion local demo.
- Persistir `app_user`.
- Sincronizar rutas con modo interno.

Reglas:

- Login solo acepta usuarios demo hardcodeados.
- Registro guarda perfil, pero no crea credenciales reales.
- Si se abre `/project/:id`, se hidrata el proyecto desde `projects_v1`.
- Si el proyecto no existe, se redirige a `/projects`.

Errores:

- Credenciales invalidas.
- Campos vacios.
- Proyecto inexistente.
- Error runtime capturado por error boundary.

Dependencias:

- `localStorage`.
- React Router.
- i18n.

#### Proyectos

Archivos:

- `src/features/projects/pages/ProjectsScreen.tsx`
- `src/features/projects/components/NewProjectModal.tsx`
- `src/features/projects/components/EditProjectModal/*`
- `src/features/projects/pages/ProjectDetail.tsx`
- `src/features/projects/pages/ProjectDetail/*`
- `src/features/projects/utils/exportCalendarToPDF.ts`
- `src/features/projects/types.ts`

Proposito:

- Crear, editar, borrar, listar, filtrar, ordenar y abrir proyectos.
- Cambiar estado activo/cerrado.
- Exportar calendario global.

Entidades:

- `Project`
- `ProjectForm`
- `ProjectConditions`
- `ProjectTeamMember`

Reglas:

- `nombre` identifica visualmente y funciona como fallback de clave si falta `id`.
- `conditions.tipo` condiciona fases y calculos.
- Proyecto cerrado bloquea edicion.
- Idioma de proyecto cambia idioma activo mientras se trabaja dentro del proyecto.

Dependencias:

- Condiciones, equipo, calendario, reportes, nomina, timesheet.
- MySet como espacio documental asociado al proyecto.

#### Condiciones

Archivos:

- `src/features/condiciones/pages/CondicionesTab.tsx`
- `src/features/condiciones/condiciones/semanal.tsx`
- `src/features/condiciones/condiciones/mensual.tsx`
- `src/features/condiciones/condiciones/publicidad.tsx`
- `src/features/condiciones/condiciones/*`
- `src/features/condiciones/utils/exportPDF/*`

Proposito:

- Configurar parametros, precios y textos contractuales.
- Sembrar modelos por modo.
- Exportar condiciones a PDF.

Entidades:

- Modelo de condiciones.
- Parametros.
- Prices map.
- Role catalog.
- Custom sections.

Reglas:

- Semanal deriva desde `Precio semanal`.
- Mensual deriva desde `Precio mensual`.
- Diario deriva parcialmente desde `Precio jornada`.
- Prelight/Pickup pueden tener tablas propias.
- `Material propio` tiene tipo `semanal`, `diario` o `unico`.

Dependencias:

- Reportes para parametros.
- Nomina para precios/dietas/km/transporte.
- Equipo para roles personalizados.

#### Equipo

Archivos:

- `src/features/equipo/pages/EquipoTab.tsx`
- `src/features/equipo/pages/EquipoTab/*`
- `src/features/equipo/utils/exportPDF/*`
- `src/shared/utils/projectRoles.ts`
- `src/shared/constants/roles.ts`

Proposito:

- Gestionar roster por grupos.
- Gestionar roles y etiquetas personalizadas.
- Exportar equipo.

Entidades:

- Team groups: base, reinforcements, prelight, pickup.
- Member.
- ProjectRoleCatalog.

Reglas:

- Proyectos diario no muestran grupo independiente de refuerzos.
- Roles pueden variar por genero.
- Renombrar un rol base crea/usa rol custom de proyecto.
- Equipo base alimenta calendario por defecto.

#### Calendario / Necesidades

Archivos:

- `src/features/necesidades/pages/NecesidadesTab.tsx`
- `src/features/necesidades/pages/NecesidadesTab/*`
- `src/features/necesidades/components/*`
- `src/features/necesidades/importPlan/*`
- `src/features/necesidades/utils/*`

Proposito:

- Planificar semanas, dias, horarios, localizaciones, equipos, logistica y notas.
- Importar plan PDF.
- Exportar necesidades y calendario.

Entidades:

- NeedsState.
- NeedsWeek.
- Day.
- CustomRows.
- ExtraBlocks.

Reglas:

- Descanso/Fin limpian listas de equipo.
- Rodaje/Rodaje Festivo numeran dias de rodaje.
- Festivos dependen de pais/region.
- Seleccion de filas/dias afecta exportacion PDF.
- Intercambio de dias requiere confirmacion.

#### MySet

Archivos propuestos:

- `src/features/myset/pages/MySetTab.tsx`
- `src/features/myset/components/MySetToolbar.tsx`
- `src/features/myset/components/MySetBreadcrumbs.tsx`
- `src/features/myset/components/MySetFolderCard.tsx`
- `src/features/myset/components/MySetFileCard.tsx`
- `src/features/myset/components/MySetUploadDialog.tsx`
- `src/features/myset/hooks/useMySetStorage.ts`
- `src/features/myset/types.ts`

Proposito:

- Ofrecer una carpeta de proyecto estilo Google Drive dentro de SetLux.
- Permitir crear carpetas y subcarpetas.
- Permitir anadir documentos e imagenes.
- Permitir organizar referencias, permisos, documentacion de produccion, fotos, tickets, PDFs y archivos internos.
- Convertirse en el espacio de trabajo documental del proyecto.

Entidades:

- MySetFolder.
- MySetFile.
- MySetUpload.
- MySetSelection.

Flujos principales:

- Crear carpeta en la raiz o dentro de otra carpeta.
- Subir uno o varios archivos.
- Ver archivos en modo cuadricula o lista.
- Buscar por nombre, tipo, etiqueta o descripcion.
- Ordenar por nombre, fecha, tipo o tamano.
- Previsualizar imagenes y documentos soportados.
- Renombrar carpetas y archivos.
- Mover elementos entre carpetas.
- Descargar archivos.
- Borrar elementos con confirmacion.

Reglas:

- MySet existe dentro de cada proyecto y no debe mezclar archivos entre proyectos.
- Proyecto cerrado debe dejar MySet en modo solo lectura.
- Borrar una carpeta con contenido exige confirmacion explicita.
- Si se sube un archivo con nombre repetido, el producto debe decidir entre versionar, renombrar automaticamente o pedir confirmacion para reemplazar.
- Los tipos de archivo permitidos deben definirse antes de implementar almacenamiento real.

Dependencias:

- Proyecto para `projectId`, estado activo/cerrado e idioma.
- Autenticacion/usuario para auditoria `createdBy`.
- Storage local o remoto para guardar binarios.
- Exportaciones futuras si se quiere adjuntar PDFs generados por otros modulos a MySet.

#### Reportes

Archivos:

- `src/features/reportes/pages/ReportesTab/*`
- `src/features/reportes/pages/ReportesSemana.tsx`
- `src/features/reportes/components/*`
- `src/features/reportes/hooks/*`
- `src/features/reportes/utils/*`

Proposito:

- Registrar la realidad de rodaje por persona y dia.
- Calcular conceptos automáticos.
- Exportar reportes.

Entidades:

- Report week.
- Person row.
- Concepts.
- Date range.
- Extra-hour mode.

Reglas:

- Reportes se generan desde Calendario y Equipo.
- Semanal/mensual agrupa por meses.
- Diario muestra semanas directas.
- Calcula horas extra, nocturnidad, turn around y material propio.
- Datos manuales pueden preservarse frente a recalculos automaticos.

#### Nomina

Archivos:

- `src/features/nomina/pages/NominaTab.tsx`
- `src/features/nomina/nominas/*`
- `src/features/nomina/components/*`
- `src/features/nomina/utils/*`
- `src/shared/utils/calcWorkedBreakdown.ts`

Proposito:

- Agregar reportes y calendario para calcular importes por persona/mes.
- Exportar nomina mensual.

Entidades:

- MonthSection.
- EnrichedRows.
- RolePrices.
- WorkedBreakdown.
- Received state.
- IRPF por persona.

Reglas:

- Usa calculadoras distintas para semanal, mensual y diario.
- Rango Desde/Hasta se sincroniza con Reportes.
- Proyecto mensual tiene logica especial de dias de mes y corte por `Fin`.
- Nomina recibida permite estado/notas/IRPF.

#### Timesheet

Archivos:

- `src/features/timesheet/pages/TimesheetTab.tsx`

Proposito:

- Generar parte horario individual semanal.

Reglas:

- No se muestra para diario.
- Requiere semanas, equipo y trabajadores asignados.
- Horarios salen de calendario/reportes.
- Calcula duracion cruzando medianoche.
- Exporta PDF A4 landscape con datos legales.

#### Perfil, configuracion, tutorial y feedback

Archivos:

- `src/features/projects/pages/ProfilePage.tsx`
- `src/features/projects/pages/SettingsPage.tsx`
- `src/shared/components/TutorialOverlay.tsx`
- `src/shared/components/SuggestionFab.tsx`

Proposito:

- Gestionar datos de usuario, tema, idioma, genero, tutorial y sugerencias.

Reglas:

- Configuracion sincroniza `settings_v1`, `profile_v1` y `localStorage.theme`.
- Tutorial se guarda por claves `tutorial_*`.
- Feedback se envia a Formspree.

## 8. Pantallas y funcionalidades detalladas

### Pantalla: Login y registro

#### Login

Campos:

- Usuario o email.
- Contrasena.

Acciones:

- Iniciar sesion.
- Validar campos obligatorios.
- Validar usuario demo.
- Entrar a `/projects`.

Errores:

- Campos vacios.
- Credenciales no registradas.

#### Registro

Campos:

- Nombre.
- Apellido.
- Rol.
- Idioma.
- Email.
- Contrasena.
- Repetir contrasena.

Acciones:

- Validar campos obligatorios.
- Validar coincidencia de contrasenas.
- Guardar perfil local.
- Volver a login con el email precargado.

Pregunta abierta:

- Definir si el registro debe seguir oculto en la beta o convertirse en registro real con backend.

### Pantalla: Proyectos

#### Objetivo

Gestionar el portfolio de proyectos del usuario y abrir el espacio de trabajo de cada proyecto.

#### Header

Incluye:

- Logo SetLux.
- Saludo al usuario.
- Boton Nuevo proyecto.
- Menu de usuario con Perfil, Configuracion y Salir.
- Acceso al tutorial desde Configuracion.

#### Busqueda y filtros

Busqueda por:

- Nombre.
- DoP.
- Almacen.
- Productora.

Filtros:

- Estado: todos, activo, cerrado.
- Tipo: todos, semanal, mensual, diario.

Orden:

- Nombre.
- Estado.
- Tipo.
- Ascendente o descendente.

#### Tarjeta de proyecto

Muestra:

- Nombre con color/avatar derivado.
- DoP.
- Almacen.
- Productora.
- Tag de tipo de condiciones.
- Tag de estado.

Acciones:

- Abrir proyecto.
- Editar proyecto.
- Borrar proyecto con confirmacion.

#### Nuevo/editar proyecto

Campos:

- Proyecto.
- Productora.
- Almacen.
- Gaffer.
- Best Boy.
- DoP.
- Jefe de produccion.
- Jefe transportes.
- Jefe localizaciones.
- Coordinadora de produccion.
- Estado.
- Tipo de condiciones: mensual, semanal, diario.
- Idioma del proyecto.
- Pais.
- Region si el pais tiene regiones.

#### Exportacion global de calendario

Desde Proyectos se puede exportar un calendario global:

- Rango: mes actual, 3 meses, 6 meses, 12 meses.
- Alcance: solo activos o todos los proyectos.
- Si no hay proyectos con planificacion en el rango, se muestra aviso.

### Pantalla: Detalle de proyecto

#### Header

Muestra:

- Navegacion de vuelta.
- Nombre del proyecto.
- Fase activa si existe.
- Estado activo/cerrado con color.
- Accion para cambiar estado con confirmacion.

#### Parrilla de fases

Fases:

- Condiciones.
- Equipo.
- Calendario.
- MySet.
- Timesheet, solo si el proyecto no es `diario`.
- Reportes.
- Nomina.

Cada fase tiene tarjeta con icono, titulo, descripcion y navegacion.

#### Regla de solo lectura

Si el proyecto esta cerrado, `ProjectDetailContent` pasa `readOnly=true` a todas las fases.

### Fase: MySet

#### Objetivo

Crear un espacio de trabajo documental dentro del proyecto, con experiencia similar a una carpeta de Google Drive. El usuario debe poder guardar, ordenar y consultar archivos relacionados con el proyecto sin salir de SetLux.

#### Ubicacion en el proyecto

MySet debe aparecer como una tarjeta propia en el menu/parrilla del proyecto creado, junto a Condiciones, Equipo, Calendario, Reportes, Nomina y Timesheet.

Comportamiento esperado:

- Disponible para proyectos `semanal`, `mensual` y `diario`.
- Visible aunque no haya equipo, calendario ni condiciones configuradas.
- En proyecto `Activo`, permite crear, editar, subir, mover y borrar.
- En proyecto `Cerrado`, queda en modo solo lectura: permite navegar, previsualizar y descargar, pero no modificar.
- Para usuarios de equipo que no sean Gaffer ni Best Boy, la visibilidad depende de los permisos concedidos por Gaffer o Best Boy.
- Si el usuario no tiene permiso sobre MySet, la tarjeta puede mostrarse bloqueada o no mostrarse, segun decision de producto.

#### Vista principal

Elementos de interfaz:

- Cabecera con titulo `MySet`.
- Breadcrumb de navegacion: raiz > carpeta > subcarpeta.
- Boton crear carpeta.
- Boton subir archivo.
- Buscador.
- Ordenacion por nombre, fecha, tipo y tamano.
- Selector de vista: cuadricula/lista.
- Zona de contenido con carpetas y archivos.
- Estado vacio cuando no hay elementos.

Estado vacio recomendado:

- Mostrar una llamada a la accion para crear la primera carpeta.
- Mostrar una accion secundaria para subir documentos o imagenes.

#### Carpetas

Acciones:

- Crear carpeta.
- Abrir carpeta.
- Renombrar carpeta.
- Mover carpeta a otra carpeta.
- Eliminar carpeta con confirmacion.

Validaciones:

- Nombre obligatorio.
- No permitir nombres vacios o solo espacios.
- Evitar duplicados dentro de la misma carpeta, salvo que se defina versionado.
- No permitir mover una carpeta dentro de si misma o dentro de una hija.
- Solo Gaffer, Best Boy o usuarios con permiso `editor`/`manager` pueden crear, mover, renombrar o borrar.

#### Documentos e imagenes

Acciones:

- Subir uno o varios archivos.
- Previsualizar imagenes.
- Previsualizar PDFs si el navegador lo soporta.
- Descargar archivo.
- Renombrar archivo.
- Mover archivo a otra carpeta.
- Eliminar archivo con confirmacion.

Metadatos visibles:

- Nombre.
- Tipo/extension.
- Tamano.
- Fecha de subida.
- Usuario que lo subio, cuando exista autenticacion real.

Tipos recomendados:

- Imagenes: `jpg`, `jpeg`, `png`, `webp`.
- Documentos: `pdf`, `doc`, `docx`, `xls`, `xlsx`, `csv`, `txt`.
- Otros tipos deben bloquearse o requerir confirmacion, segun politica de seguridad final.

#### Permisos de acceso

Gaffer y Best Boy deben poder gestionar permisos de MySet para el resto del equipo.

Alcance de permisos:

- Permiso global sobre todo MySet del proyecto.
- Permiso por carpeta.
- Permiso por archivo individual, si se necesita granularidad adicional.

Acciones de Gaffer/Best Boy:

- Dar acceso a una carpeta a un miembro concreto.
- Quitar acceso a una carpeta o archivo.
- Cambiar permiso entre `viewer`, `editor` y `manager`.
- Ver una lista de personas con acceso a cada carpeta.

Reglas:

- Un usuario sin permiso no debe ver el nombre ni metadatos de carpetas/archivos restringidos.
- Si una carpeta tiene permiso heredado, los archivos interiores heredan ese permiso salvo excepcion explicita.
- El borrado de archivos compartidos debe registrar quien borra y cuando.
- La descarga debe respetar permisos en backend, no solo en frontend.

#### Busqueda y organizacion

La busqueda debe permitir encontrar:

- Carpetas por nombre.
- Archivos por nombre.
- Archivos por extension/tipo.
- Etiquetas o descripcion si se implementan metadatos avanzados.

Reglas de ordenacion:

- Nombre ascendente/descendente.
- Fecha de subida ascendente/descendente.
- Tipo de archivo.
- Tamano.

#### Persistencia y almacenamiento

Implementacion local-first provisional:

- Metadatos en IndexedDB o `myset_${projectId}`.
- Binarios en IndexedDB como `Blob`.
- Evitar `localStorage` para binarios porque el limite de tamano es bajo y puede romper la app.

Implementacion recomendada con backend:

- Metadatos en PostgreSQL.
- Binarios en almacenamiento S3-compatible.
- URLs firmadas para subida/descarga.
- Miniaturas generadas para imagenes.
- Escaneo antivirus si se aceptan archivos de usuarios externos.

#### Relacion con otros modulos

- Calendario: permitir guardar plan de rodaje importado o documentos asociados a una semana en MySet en una fase futura.
- Reportes/Nomina/Timesheet: permitir guardar PDFs generados dentro de MySet como copia documental.
- Feedback/adjuntos: la infraestructura de subida de archivos debe poder reutilizarse.

### Fase: Equipo

#### Objetivo

Gestionar los miembros del equipo y alimentar Calendario, Reportes, Timesheet y Nomina.

#### Grupos

- Equipo base.
- Equipo extra/refuerzos, no visible en proyectos `diario`.
- Equipo Prelight, opcional.
- Equipo Recogida, opcional.

#### Acciones

- Anadir miembro.
- Quitar miembro con confirmacion.
- Anadir grupo Prelight.
- Anadir grupo Recogida.
- Quitar grupos opcionales con confirmacion.
- Exportar PDF del equipo.

#### Fila de miembro

Campos y acciones:

- Badge de rol.
- Selector de cargo.
- Edicion del nombre visible del rol.
- Creacion de rol personalizado por proyecto si se renombra un rol base.
- Selector de genero: hombre, mujer, neutro, oculto para roles sin variacion.
- Nombre y apellidos.
- Boton eliminar.

Reglas:

- El Equipo base se anade por defecto al crear semana o marcar Rodaje en Calendario.
- Los roles disponibles se filtran por modo de proyecto y grupo.
- Los roles personalizados se guardan en `roleCatalog`.

### Fase: Calendario

#### Objetivo

Planificar semana a semana el proyecto, separando preproduccion y produccion.

#### Cabecera

Acciones:

- Importar plan de rodaje PDF, beta.
- Exportar calendario del proyecto con alcance: todo, preproduccion o produccion.
- Exportar PDF entero de necesidades.

Importacion de PDF:

- Lee el archivo.
- Detecta semanas.
- Muestra vista previa.
- Detecta conflictos por fecha y scope.
- Permite importar, omitir o sobrescribir semanas.
- No guarda nada hasta confirmar.

#### Secciones

- Preproduccion.
- Produccion.

Cada seccion:

- Es acordeon.
- Permite anadir semana.
- Permite exportar PDF de esa seccion.
- Muestra estado vacio si no hay semanas.

#### Semana

Acciones por semana:

- Abrir/cerrar.
- Seleccionar filas/columnas para exportacion.
- Activar intercambio de dias.
- Exportar PDF de semana.
- Duplicar semana.
- Eliminar semana con confirmacion.
- Cambiar lunes de la semana.

#### Tabla semanal

Columnas:

- Campo / Dia.
- Lunes a domingo.

Filas principales:

- Fecha.
- Localizacion y secuencias.
- Dia de rodaje.
- Seccion Equipo.
- Equipo base con jornada, inicio, fin y miembros.
- Equipo extra / horarios diferentes con bloques extra.
- Seccion Logistica.
- Transporte.
- Transporte extra.
- Grupos.
- Gruas.
- Material extra.
- Seccion Equipo Prelight/Recogida.
- Precall.
- Prelight con jornada, inicio, fin y miembros.
- Recogida con jornada, inicio, fin y miembros.
- Material base diario.
- Observaciones.
- Filas personalizadas.

Tipos de jornada:

- Rodaje.
- Oficina.
- Pruebas de camara.
- Carga.
- Descarga.
- Localizar.
- Travel Day.
- 1/2 jornada.
- Rodaje Festivo.
- Fin.
- Descanso.

Reglas automaticas:

- Si el tipo es Descanso, se limpia equipo y listas del dia y se pone localizacion Descanso.
- Si el tipo es Fin, se pone localizacion Fin.
- Los dias de rodaje se numeran correlativamente contando Rodaje y Rodaje Festivo.
- Las listas de equipo se sincronizan con el equipo del proyecto sin machacar campos ya informados salvo que haya cambios de identidad.
- Se aplican festivos segun pais y region.

Seleccion para PDF:

- Permite seleccionar filas.
- Permite seleccionar dias.
- Permite exportar solo contenido seleccionado.
- Puede ocultar filas vacias.

Adjuntos:

- Existen botones de adjuntar imagen/archivo, pero muestran modal de funcion beta.

### Fase: Timesheet

#### Objetivo

Generar y editar un registro horario semanal individual por trabajador.

No aparece para proyectos `diario`.

#### Estados vacios

Muestra llamadas a la accion si:

- No hay semanas ni equipo.
- No hay semanas.
- No hay equipo.
- Hay semanas, pero no tienen trabajadores asignados.

#### Cabecera

Campos:

- Semana.
- Trabajador.
- DNI.
- Numero de Seguridad Social del trabajador.
- Productora.
- Direccion productora.
- CIF productora.
- Cuenta de cotizacion / Seguridad Social empresa.

Accion:

- Exportar PDF individual.

#### Tabla

Columnas:

- Dia.
- Fecha.
- Desde.
- Hasta.
- Total horas.
- Comida catering: si/no.
- Ciudad.
- Notas.

Reglas:

- Horarios salen de Calendario segun bloque del trabajador.
- Total se calcula por diferencia entre inicio y fin, soportando jornadas que cruzan medianoche.
- Catering y notas son editables y persistentes por trabajador/semana.
- DNI, SS y datos de empresa se guardan en localStorage por proyecto.
- El PDF incluye firmas de empleado, jefe de produccion y coordinadora.
- El aviso legal indica conservacion de registros durante cuatro anos.

### Fase: Reportes

#### Objetivo

Registrar lo ocurrido realmente en rodaje y alimentar nomina.

#### Estados vacios

Muestra mensajes si faltan semanas, equipo o trabajadores asignados.

#### Vista por modo

Modo semanal/mensual:

- Agrupa semanas por mes.
- Cada mes permite definir rango Desde/Hasta.
- Permite exportar mes en PDF.
- Comparte rango con Nomina.

Modo diario:

- Lista semanas directamente.
- Usa una configuracion general de tipo de horas extra.

#### Semana de reporte

Cada semana:

- Es acordeon.
- Tiene PDF.
- Muestra tabla horizontal con dias y total.
- Agrupa personas por bloque: base, extras, prelight y recogida.

Conceptos por persona:

- Horas extra.
- Turn Around.
- Nocturnidad.
- Penalty lunch.
- Material propio.
- Dietas.
- Kilometraje.
- Gasolina.
- Transporte.

Opciones de dietas:

- Vacio.
- Comida.
- Cena.
- Dieta sin pernoctar.
- Dieta con pernocta.
- Gastos de bolsillo.
- Ticket.
- Otros.

Opciones si/no:

- Vacio.
- SI.

Tipos de horas extra:

- Hora Extra - Normal.
- Hora Extra - Minutaje desde corte.
- Hora Extra - Minutaje + Cortesia.

Reglas automaticas:

- Calcula horas extra, turn around y nocturnidad desde condiciones y horarios.
- Respeta cortesias, multiplicadores y ventanas de nocturnidad.
- Usa material propio configurado en Condiciones.
- Permite sobrescribir horarios por persona/bloque en Reportes.
- Muestra Descanso si la persona no esta asignada ese dia.
- Adjuntar ticket esta en beta y abre modal informativo.

### Fase: Nomina

#### Objetivo

Calcular lo que cobrara cada miembro del equipo segun condiciones, calendario y reportes.

#### Variantes

- `NominaSemanal` para proyectos semanales.
- `NominaMensual` para proyectos mensuales.
- `NominaPublicidad` para proyectos diario/publicidad.

#### Estados vacios

Muestra mensajes si:

- Falta calendario y equipo.
- Falta calendario.
- Falta equipo.
- Hay semanas sin trabajadores asignados.

#### Agrupacion y exportacion

- Agrupa por meses.
- Genera filas agregadas desde reportes.
- Permite exportar mes en PDF.
- En semanal/mensual usa semanas con personas.
- En diario calcula desglose especifico de dias trabajados.

#### Datos esperados

La nomina depende de:

- Condiciones del modo activo.
- Precios por rol y grupo.
- Calendario y trabajadores asignados por dia.
- Reportes: horas extra, turn around, nocturnidad, penalty lunch, material propio, dietas, kilometraje, gasolina, transporte.
- Rangos Desde/Hasta definidos en Reportes/Nomina.

### Perfil

#### Objetivo

Editar datos basicos del usuario.

Campos:

- Nombre.
- Apellido.
- Email.
- Rol.

Acciones:

- Guardar en `profile_v1`.
- Volver a proyectos pulsando logo o SetLux.

### Configuracion

#### Objetivo

Gestionar preferencias globales.

Campos:

- Idioma.
- Genero.
- Tema claro/oscuro.

Acciones:

- Cambiar idioma en vivo.
- Cambiar tema en vivo.
- Guardar preferencias.
- Volver a proyectos pulsando logo o SetLux.

Debe mantener compatibilidad con `localStorage.theme`, `settings_v1` y `profile_v1`.

### Tutorial

#### Objetivo

Guiar a usuarios nuevos en el flujo principal.

Se muestra prompt si:

- No se ha descartado.
- No hay proyectos.
- La ruta es `/projects`.

Pasos:

- Tema.
- Menu de usuario.
- Opciones de usuario.
- Nuevo proyecto.
- Formulario de proyecto.
- Equipo.
- Anadir miembro.
- Rol y nombre.
- Condiciones.
- Parametros.
- Precios.
- Calendario.
- Subir plan.
- Anadir semana.
- Semana creada.
- Timesheet, omitido en diario.
- Datos de timesheet, omitido en diario.
- Tabla de timesheet, omitido en diario.
- Reportes.
- Semana en reportes.
- Horas extra.
- Rango de fechas.
- Nomina.
- Tabla de nomina.
- Rango de nomina.
- Estado activo/cerrado.
- Ayuda.

Persistencia:

- `tutorial_dismissed_v1`
- `tutorial_open_v1`
- `tutorial_step_v1`
- `tutorial_path_v1`

### Ayuda y feedback

Boton flotante "Ayudanos a mejorar".

Campos y acciones:

- Textarea de sugerencia.
- Enviar a Formspree.
- Incluir usuario, email, rol, pagina actual y proyecto activo si existe.
- Boton adjuntar imagen muestra modal de funcion beta.
- Muestra gracias al enviar o error si falla.

## 9. Condiciones, calculos y logica critica

### Objetivo

Definir las reglas economicas, laborales y contractuales del proyecto. Esta fase es la fuente de verdad para:

- Textos de condiciones exportables a PDF.
- Parametros de calculo usados en Reportes.
- Tarifas por rol usadas en Reportes y Nomina.
- Dietas, kilometraje y transporte.
- Turn Around, nocturnidad, horas extra y festivos.

La pantalla cambia segun `conditions.tipo`:

- `semanal`: el usuario introduce el precio semanal y la app deriva el resto.
- `mensual`: el usuario introduce el precio mensual y la app deriva el resto.
- `diario`: el usuario introduce el precio jornada y la app trabaja con tarifas de publicidad/diario.

### Estructura comun

La fase se divide en:

- Parametros de calculo.
- Tabla de precios por rol y grupo.
- Textos legales/editables.
- Exportacion PDF con selector de secciones.

Secciones de precios:

- Equipo Base.
- Equipo Prelight, opcional.
- Equipo Recogida, opcional.

Acciones comunes:

- Editar parametros.
- Editar importes.
- Anadir rol.
- Eliminar rol con confirmacion.
- Anadir o quitar secciones Prelight/Recogida.
- Anadir apartados personalizados.
- Restaurar textos por defecto.
- Exportar PDF seleccionando secciones.

Roles base disponibles:

- Gaffer.
- Best boy.
- Electrico.
- Auxiliar.
- Meritorio.
- Rigging Gaffer.
- Rigging Best Boy.
- Rigging Electrico.
- Tecnico de mesa.
- Finger boy.
- Grupista electrico.
- Chofer electrico.
- Electrico de potencia.
- Tecnico de practicos.

### 9.1 Condiciones semanales

#### Parametros semanales

Valores por defecto actuales:

- `jornadaTrabajo = 9`: horas de trabajo de la jornada.
- `jornadaComida = 1`: hora de comida incluida en textos y jornada pactada.
- `diasJornada = 5`: dias laborales usados para calcular precio jornada.
- `diasDiario = 7`: dias usados para calcular precio diario desde precio semanal.
- `semanasMes = 4`: semanas usadas para calcular precio mensual.
- `horasSemana = 45`: horas base de la semana para calcular hora extra.
- `factorFestivo = 1.75`: multiplicador de dia extra/festivo.
- `factorHoraExtra = 1.5`: multiplicador de hora extra.
- `divTravel = 2`: divisor de travel day.
- `cortesiaMin = 15`: minutos de cortesia antes de computar extra.
- `taDiario = 12`: descanso minimo entre jornadas laborables.
- `taFinde = 48`: descanso minimo de fin de semana.
- `nocturnoIni = 22:00`: inicio de ventana nocturna.
- `nocturnoFin = 06:00`: fin de ventana nocturna.
- `dietaComida = 14.02`.
- `dietaCena = 16.36`.
- `dietaSinPernocta = 30.38`.
- `dietaAlojDes = 51.39`.
- `gastosBolsillo = 8.81`.
- `kilometrajeKm = 0.26`.
- `transporteDia = 12`.

#### Formula base semanal

El usuario introduce `Precio semanal`. Si el campo queda vacio o es 0, la app vacia los importes derivados.

Variables:

- `PS = Precio semanal`.
- `SM = semanasMes`.
- `DD = diasDiario`.
- `DJ = diasJornada`.
- `FF = factorFestivo`.
- `DT = divTravel`.
- `HS = horasSemana`.
- `FHE = factorHoraExtra`.

Formulas:

```text
Precio mensual = PS * SM
Precio diario = PS / DD
Precio jornada = PS / DJ
Precio 1/2 jornada = Precio jornada / 2
Precio Dia extra/Festivo = Precio jornada * FF
Travel day = Precio jornada / DT
Horas extras = (PS / HS) * FHE
```

Ejemplo con defaults y `PS = 1500`:

```text
Precio mensual = 1500 * 4 = 6000
Precio diario = 1500 / 7 = 214.29
Precio jornada = 1500 / 5 = 300
Precio 1/2 jornada = 300 / 2 = 150
Precio Dia extra/Festivo = 300 * 1.75 = 525
Travel day = 300 / 2 = 150
Horas extras = (1500 / 45) * 1.5 = 50
```

#### Columnas de la tabla semanal

- `Precio semanal`: campo principal editable para el calculo automatico.
- `Precio mensual`: calculado desde `Precio semanal`.
- `Precio diario`: calculado desde `Precio semanal`.
- `Precio jornada`: calculado desde `Precio semanal`.
- `Precio 1/2 jornada`: calculado desde `Precio jornada`.
- `Precio refuerzo`: manual; se usa para trabajadores extra/refuerzos.
- `Material propio`: manual; puede tener tipo `semanal`, `diario` o `unico`.
- `Precio Dia extra/Festivo`: calculado desde `Precio jornada`.
- `Travel day`: calculado desde `Precio jornada`.
- `Horas extras`: calculado desde `Precio semanal` y `horasSemana`.

En Equipo Prelight y Equipo Recogida no se muestra `Precio refuerzo`.

#### Uso en Reportes y Nomina semanal

Para un rol normal:

- `jornada` toma `Precio jornada`.
- `halfJornada` toma `Precio 1/2 jornada`.
- `travelDay` toma `Travel day`; si falta, usa `jornada / divTravel`.
- `horaExtra` toma `Horas extras`.
- `holidayDay` toma `Precio Dia extra/Festivo`.
- `materialPropioValue` toma `Material propio`.
- `transporte` toma `transporteDia`.
- `km` toma `kilometrajeKm`.
- `dietas` toma los importes de comida, cena, dieta sin pernocta, dieta con pernocta y gastos de bolsillo.

Para refuerzos:

- La app busca `Precio refuerzo` en la fila del rol base.
- Si no hay `Precio refuerzo`, usa `Precio jornada` del rol base.
- `Travel day` intenta usar el valor del rol base; si falta, calcula `jornada / divTravel`.
- `Horas extras` y `Precio Dia extra/Festivo` se toman preferentemente de la fila de Electrico como fallback actual.

#### Reportes semanales: horas extra, Turn Around y nocturnidad

Las condiciones semanales alimentan calculos automaticos en Reportes:

- Horas extra normales: se comparan los minutos trabajados reales con la jornada base y la cortesia.
- Minutos trabajados: diferencia entre inicio y fin, soportando jornadas que pasan de medianoche.
- Jornada base en horas: normalmente `jornadaTrabajo + jornadaComida`.
- Si se usa modo "Hora Extra - Normal", se aplica la funcion de calculo con cortesia.
- Si se usa "Minutaje desde corte", se calcula el exceso desde el corte sin aplicar la misma logica de cortesia.
- Si se usa "Minutaje + Cortesia", se calcula exceso desde minutaje aplicando `cortesiaMin`.
- Turn Around: si el descanso entre fin de una jornada e inicio de la siguiente es menor que `taDiario` o `taFinde`, la diferencia no descansada se marca como concepto computable.
- Nocturnidad: si el inicio o fin cae dentro de la ventana `nocturnoIni` a `nocturnoFin`, se marca nocturnidad.

### 9.2 Condiciones mensuales

#### Parametros mensuales

Usa practicamente los mismos parametros que semanal:

- `jornadaTrabajo = 9`.
- `jornadaComida = 1`.
- `diasJornada = 5`.
- `diasDiario = 7`.
- `semanasMes = 4`.
- `horasSemana = 45`.
- `factorFestivo = 1.75`.
- `factorHoraExtra = 1.5`.
- `divTravel = 2` en la pantalla de condiciones actual.
- `cortesiaMin = 15`.
- `taDiario = 12`.
- `taFinde = 48`.
- `nocturnoIni = 22:00`.
- `nocturnoFin = 06:00`.
- Dietas, kilometraje y transporte iguales a semanal.

Nota tecnica: en Nomina mensual existe fallback de `divTravel = 3` si no hay parametro valido, aunque la pantalla siembra `divTravel = 2`. Conviene decidir un unico valor de producto al rehacer.

#### Formula base mensual

El usuario introduce `Precio mensual`. Si el campo queda vacio o es 0, la app vacia los importes derivados.

Variables:

- `PM = Precio mensual`.
- `SM = semanasMes`.
- `DD = diasDiario`.
- `DJ = diasJornada`.
- `HS = horasSemana`.
- `FF = factorFestivo`.
- `DT = divTravel`.
- `FHE = factorHoraExtra`.

Formulas:

```text
Precio semanal = PM / SM
Precio diario = Precio semanal / DD
Precio jornada = Precio semanal / DJ
Precio 1/2 jornada = Precio jornada / 2
Precio Dia extra/Festivo = Precio jornada * FF
Travel day = Precio jornada / DT
Base hora mensual = PM / (HS * SM)
Horas extras = Base hora mensual * FHE
```

Ejemplo con defaults y `PM = 6000`:

```text
Precio semanal = 6000 / 4 = 1500
Precio diario = 1500 / 7 = 214.29
Precio jornada = 1500 / 5 = 300
Precio 1/2 jornada = 300 / 2 = 150
Precio Dia extra/Festivo = 300 * 1.75 = 525
Travel day = 300 / 2 = 150
Base hora mensual = 6000 / (45 * 4) = 33.33
Horas extras = 33.33 * 1.5 = 50
```

#### Columnas de la tabla mensual

- `Precio mensual`: campo principal editable para el calculo automatico.
- `Precio semanal`: calculado desde `Precio mensual`.
- `Precio diario`: calculado desde `Precio semanal`.
- `Precio jornada`: calculado desde `Precio semanal`.
- `Precio 1/2 jornada`: calculado desde `Precio jornada`.
- `Precio refuerzo`: manual.
- `Material propio`: manual; puede tener tipo `semanal`, `diario` o `unico`.
- `Precio Dia extra/Festivo`: calculado desde `Precio jornada`.
- `Travel day`: calculado desde `Precio jornada`.
- `Horas extras`: calculado desde `Precio mensual`, `horasSemana`, `semanasMes` y `factorHoraExtra`.

En Equipo Prelight y Equipo Recogida no se muestra `Precio refuerzo`.

#### Uso en Reportes y Nomina mensual

Para un rol normal:

- `jornada` toma `Precio jornada`.
- `halfJornada` toma `Precio 1/2 jornada`.
- `travelDay` toma `Travel day`; si falta, usa `jornada / divTravel`.
- `horaExtra` toma `Horas extras`.
- `holidayDay` toma `Precio Dia extra/Festivo`.
- `precioMensual` conserva `Precio mensual` para calculos mensuales.
- `materialPropioValue`, `transporte`, `km` y `dietas` funcionan igual que semanal.

Para refuerzos:

- Busca `Precio refuerzo` en la fila del rol base.
- Si falta, usa `Precio jornada`.
- Usa fallback de Electrico para hora extra y festivo cuando no hay valor especifico.

#### Dias de nomina mensual

Nomina mensual agrupa por mes y calcula dias trabajados desde el Calendario/Reportes. El precio mensual se conserva para poder prorratear o contrastar importes por periodo. Debe validarse con ejemplos reales si el rehacer debe:

- Pagar mes completo cuando el trabajador cubre el mes completo.
- Prorratear por dias naturales.
- Prorratear por dias de jornada.
- Prorratear por dias efectivamente trabajados en el rango Desde/Hasta.

### 9.3 Condiciones diario/publicidad

#### Parametros diario

Valores por defecto actuales:

- `jornadaTrabajo = 10`.
- `jornadaComida = 1`.
- `factorFestivo = 1.75`.
- `factorHoraExtraFestiva = 1.5`.
- `cortesiaMin = 15`.
- `taDiario = 10`.
- `taFinde = 48`.
- `nocturnidadComplemento = 50`.
- `nocturnoIni = 22:00`.
- `nocturnoFin = 06:00`.
- `dietaDesayuno = 10`.
- `dietaComida = 20`.
- `dietaCena = 30`.
- `dietaSinPernocta = 50`.
- `dietaAlojDes = 60`.
- `gastosBolsillo = 10`.
- `kilometrajeKm = 0.40`.
- `transporteDia = 15`.

Nota tecnica: el helper de calculo diario contempla `factorHoraExtra`, pero el modelo diario siembra `factorHoraExtraFestiva`. Al rehacer conviene unificar el nombre de parametro para evitar discrepancias.

#### Formula base diario

El usuario introduce `Precio jornada`.

Variables:

- `PJ = Precio jornada`.
- `FF = factorFestivo`.
- `JT = jornadaTrabajo`.
- `JC = jornadaComida`.
- `FHE = factorHoraExtra` o parametro equivalente acordado.

Formulas esperadas por el helper diario:

```text
Precio 1/2 jornada = PJ / 2
Precio Dia extra/Festivo = PJ * FF
Travel day = PJ
Horas totales de referencia = JT + JC
Horas extras = (PJ / Horas totales de referencia) * FHE
Carga/descarga = Horas extras * 3
```

Ejemplo con `PJ = 510`, `FF = 1.75`, `JT = 10`, `JC = 1`, `FHE = 1.5`:

```text
Precio 1/2 jornada = 510 / 2 = 255
Precio Dia extra/Festivo = 510 * 1.75 = 892.50
Travel day = 510
Horas totales de referencia = 10 + 1 = 11
Horas extras = (510 / 11) * 1.5 = 69.55
Carga/descarga = 69.55 * 3 = 208.65
```

Comportamiento actual de UI:

- Al editar `Precio jornada`, la app autocompleta `Precio 1/2 jornada`, `Precio Dia extra/Festivo` y `Travel day`.
- Aunque el helper tambien calcula `Horas extras` y `Carga/descarga`, el handler actual no las escribe automaticamente al cambiar `Precio jornada`.
- Los valores seed iniciales de diario ya incluyen `Horas extras`, `Carga/descarga` y algunas `Localizacion tecnica` para roles habituales.

#### Precios seed de diario

La app arranca con precios predeterminados para algunos roles:

- Gaffer: jornada 510, festivo 892.5, travel 510, horas extras 75, carga/descarga 225, localizacion tecnica 420.
- Best boy: jornada 410, festivo 717.5, travel 410, horas extras 60, carga/descarga 180, localizacion tecnica 320.
- Electrico: jornada 310, festivo 542.5, travel 310, horas extras 45, carga/descarga 135.
- Auxiliar: jornada 250, festivo 437.5, travel 250, horas extras 35, carga/descarga 105.
- Tecnico de mesa: jornada 350, festivo 612.5, travel 350, horas extras 50, carga/descarga 150.
- Finger boy: jornada 350, festivo 612.5, travel 350, horas extras 50, carga/descarga 150.

#### Columnas de la tabla diario

- `Precio jornada`: campo principal.
- `Precio 1/2 jornada`: calculado desde `Precio jornada`.
- `Material propio`: manual; por defecto tipo `diario`.
- `Precio Dia extra/Festivo`: calculado desde `Precio jornada`.
- `Localizacion tecnica`: manual o seed.
- `Carga/descarga`: manual o seed; formula esperada `Horas extras * 3`.
- `Travel day`: igual a `Precio jornada`.
- `Horas extras`: manual o seed; formula esperada desde precio jornada y horas de referencia.

#### Uso en Reportes y Nomina diario

Para un rol normal:

- `jornada` toma `Precio jornada`.
- `halfJornada` toma `Precio 1/2 jornada`.
- `travelDay` toma `Travel day`; si falta, usa `jornada / divTravel`, con fallback tecnico `divTravel = 2.5`.
- `horaExtra` toma `Horas extras`.
- `holidayDay` toma `Precio Dia extra/Festivo`.
- `cargaDescarga` toma `Carga/descarga`.
- `localizacionTecnica` toma `Localizacion tecnica`.
- `factorHoraExtraFestiva` toma el parametro de condiciones, con fallback 1.5.
- `materialPropioValue` usa tipo `diario` por defecto.
- `dietas` incluye Desayuno, Comida, Cena, Dieta sin pernoctar, Dieta con pernocta y Gastos de bolsillo.

Para refuerzos en diario:

- Busca `Precio refuerzo` si existe en el rol base.
- Si no existe, puede quedar a 0 o usar fallback segun tabla encontrada.
- `Travel day` de refuerzo se calcula como `jornada / divTravel` en el helper de Nomina diario.

#### Particularidades de diario/publicidad

- Timesheet no aparece para proyectos diario.
- Equipo extra/refuerzos no se muestra como grupo independiente en Equipo para diario.
- Reportes diario no agrupa por mes en la misma pantalla que semanal/mensual; muestra semanas directamente.
- Nomina diario usa `NominaPublicidad` y agregaciones especificas.
- Nocturnidad se puede pagar como complemento fijo (`nocturnidadComplemento`) y ademas puede afectar horas extra festivas/nocturnas mediante `factorHoraExtraFestiva`.

### 9.4 Textos editables de condiciones

Apartados:

- Leyenda de calculos.
- Festivos.
- Horarios.
- Dietas.
- Transportes.
- Alojamiento.
- Preproduccion.
- Apartados personalizados.
- Convenio.

Los textos usan plantillas con variables. Ejemplos:

- `{{SEMANAS_MES}}`
- `{{DIAS_DIARIO}}`
- `{{DIAS_JORNADA}}`
- `{{JORNADA_TRABAJO}}`
- `{{JORNADA_COMIDA}}`
- `{{HORAS_SEMANA}}`
- `{{FACTOR_FESTIVO}}`
- `{{FACTOR_HORA_EXTRA}}`
- `{{FACTOR_HORA_EXTRA_FESTIVA}}`
- `{{DIV_TRAVEL}}`
- `{{CORTESIA_MIN}}`
- `{{TA_DIARIO}}`
- `{{TA_FINDE}}`
- `{{NOCTURNO_INI}}`
- `{{NOCTURNO_FIN}}`
- `{{DIETA_DESAYUNO}}`
- `{{DIETA_COMIDA}}`
- `{{DIETA_CENA}}`
- `{{DIETA_SIN_PERNOCTA}}`
- `{{DIETA_ALOJ_DES}}`
- `{{GASTOS_BOLSILLO}}`
- `{{KM_EURO}}`
- `{{TRANSPORTE_DIA}}`

Acciones:

- Editar texto.
- Restaurar texto por defecto.
- Traducir texto al idioma actual, condicionado a API key de DeepL.
- Abrir BOE del convenio.
- Anadir apartado personalizado.
- Eliminar apartado personalizado.

### 9.5 Exportacion PDF de condiciones

Menu de seleccion de secciones:

- Leyenda.
- Festivos.
- Horarios.
- Dietas.
- Transportes.
- Alojamiento.
- Preproduccion.
- Apartados personalizados.
- Convenio.

Reglas:

- Solo se exportan las secciones marcadas.
- Siempre se incluye la tabla de precios cuando se ejecuta exportacion desde Condiciones.
- Debe impedir exportar si no hay secciones seleccionadas.
- Los textos exportados deben estar renderizados con los parametros actuales.

### Calculos transversales detectados en codigo

#### Derivacion semanal

Archivo: `src/features/condiciones/condiciones/semanal/semanalUtils.ts`.

Entradas: `Precio semanal`, `semanasMes`, `diasDiario`, `diasJornada`, `factorFestivo`, `divTravel`, `horasSemana`, `factorHoraExtra`.

Formula:

```text
mensual = semanal * semanasMes
diario = semanal / diasDiario
jornada = semanal / diasJornada
mediaJornada = jornada / 2
festivo = jornada * factorFestivo
travel = jornada / divTravel
extra = (semanal / horasSemana) * factorHoraExtra
```

Redondeo: formato a 2 decimales y elimina ceros sobrantes.

#### Derivacion mensual

Archivo: `src/features/condiciones/condiciones/mensual/mensualUtils.ts`.

Formula:

```text
semanal = mensual / semanasMes
diario = semanal / diasDiario
jornada = semanal / diasJornada
mediaJornada = jornada / 2
festivo = jornada * factorFestivo
travel = jornada / divTravel
baseHora = mensual / (horasSemana * semanasMes)
horaExtra = baseHora * factorHoraExtra
```

Riesgo: fallback de `divTravel` distinto entre UI y Nomina mensual.

#### Derivacion diario

Archivo: `src/features/condiciones/condiciones/publicidad/publicidadUtils.ts`.

Formula:

```text
mediaJornada = jornada / 2
festivo = jornada * factorFestivo
travel = jornada
horasTotales = jornadaTrabajo + jornadaComida
horaExtra = (jornada / horasTotales) * factorHoraExtra
cargaDescarga = horaExtra * 3
```

Riesgo: el handler diario no persiste automaticamente `Horas extras` ni `Carga/descarga` al editar `Precio jornada`.

#### Horas extra normal

Archivo: `src/features/reportes/utils/runtime.ts`.

Formula:

```text
baseMin = baseHours * 60
over = workedMin - baseMin
si over <= 0 => 0
si over > cortesiaMin => extras = 1
si over > 60 => extras = max(extras, 1 + ceil((over - 60) / 60))
```

Unidad: horas enteras computables.

#### Horas extra por minutaje

Archivo: `src/features/reportes/utils/runtime.ts`.

Desde corte:

```text
extraDecimal = max(0, workedMin - baseMin) / 60
```

Con cortesia:

```text
si over <= cortesiaMin => 0
si over > cortesiaMin => over / 60
```

Formato: `1.5 (1h 30')`, `0.5 (30')`, etc.

#### Nocturnidad

Archivo: `src/features/reportes/hooks/useAutoCalculations/nocturnidadCalculations.ts`.

Algoritmo:

- Convierte inicio/fin y ventana nocturna a minutos.
- Si el turno cruza medianoche, suma 24h al fin.
- Construye intervalos nocturnos.
- Devuelve true si el turno solapa cualquier intervalo.

#### Dias trabajados

Archivo: `src/shared/utils/calcWorkedBreakdown.ts`.

Algoritmo:

- Recorre semanas y dias en orden.
- Filtra por rango ISO.
- Detiene conteo al encontrar `Fin`.
- Busca si la persona esta en equipo base, prelight, pickup o extra blocks.
- Ignora `Descanso` y `Fin`.
- Cuenta tipos: Rodaje, Pruebas de camara, Oficina, Travel Day, Carga, Descarga, Localizar, Rodaje Festivo, Prelight, Recogida, 1/2 jornada.

Diferencia por modo:

- Semanal/mensual: Carga, Descarga y Localizar suman a `workedDays`; Travel Day no.
- Diario: Rodaje, Pruebas de camara, Prelight, Recogida y Oficina suman a `workedDays`; Travel Day, Carga, Descarga, Localizar y Rodaje Festivo tienen columnas propias.

#### Dias trabajados de mes mensual

Archivo: `src/features/nomina/utils/monthCalculations.ts`.

Algoritmo:

- Solo aplica especial a `mensual`.
- Busca primer dia `Fin` global.
- Cuenta dias del mes desde primer dia trabajado hasta ultimo trabajado o dia anterior a `Fin`.
- Excluye dias sin tipo, `Descanso` y `Fin` para detectar actividad.
- Devuelve dias inclusivos entre inicio y final.

#### Duracion de timesheet

Archivo: `src/features/timesheet/pages/TimesheetTab.tsx`.

Algoritmo:

- Convierte `HH:mm` a minutos.
- Si fin >= inicio, resta normal.
- Si fin < inicio, suma resto hasta 24h mas fin.
- Formatea `h:mm`.

## 10. Comandos, jobs y procesos automaticos

Comandos npm:

| Comando | Que hace | Entradas | Salidas |
| --- | --- | --- | --- |
| `npm run dev` | inicia Vite | codigo fuente | servidor local |
| `npm run build` | compila produccion | `src`, configs | `dist` |
| `npm run preview` | sirve build | `dist` | servidor preview |
| `npm run test` | Vitest watch | tests | resultados |
| `npm run test:run` | Vitest una vez | tests | resultados |
| `npm run test:coverage` | cobertura | tests | coverage |
| `npm run lint` | ESLint JS/JSX | codigo JS/JSX | errores lint |
| `npm run lint:css` | Stylelint CSS | CSS | errores CSS |
| `npm run format` | Prettier write | repo | archivos formateados |
| `npm run quality` | calidad completa | repo | lint + tests |

Jobs, queues, listeners backend, cron y scheduler:

- No existen en el estado actual.

Procesos automaticos frontend:

- Tutorial escucha eventos `window` como `start-tutorial`, `tutorial-new-project-created`.
- `MutationObserver` actualiza favicon por tema.
- `storage` emite `setlux:storage-change`.
- Reportes y Nomina sincronizan rangos por eventos/localStorage.
- Condiciones siembran defaults si no existen claves.
- Calendario sincroniza listas con roster cuando cambia Equipo.

Riesgos:

- Procesos automaticos distribuidos en hooks pueden duplicar efectos si se reintroduce StrictMode.
- Persistencia local puede fallar por cuota, modo privado o JSON corrupto.

## 11. Integraciones externas

#### Formspree

Archivo: `src/shared/components/SuggestionFab.tsx`.

- Servicio: Formspree.
- Endpoint: `https://formspree.io/f/mojvgnrp`.
- Metodo: POST.
- Request: `FormData`.
- Campos: `message`, `source`, `userName`, `userEmail`, `userRole`, `projectId`, `projectName`, `page`.
- Response: espera `response.ok`.
- Errores: muestra `footer.sendError`.
- Reintentos: no hay.
- Timeout: no hay.

#### Calendarific

Archivo: `src/shared/services/holidays.service.ts`.

- Variable: `VITE_CALENDARIFIC_KEY`.
- Uso: obtener festivos por pais/region/ano.
- Cache: localStorage con expiracion de 1 dia.
- Si falta API key, avisa por consola y usa fallback/local.

#### BOE

Archivos:

- `src/features/condiciones/condiciones/semanal/InfoSections.tsx`
- `src/features/condiciones/condiciones/mensual/InfoSections.tsx`
- `src/features/condiciones/condiciones/publicidad/InfoSections.tsx`

URL:

- `https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-6846`

Accion: `window.open` con `noopener,noreferrer`.

#### Vercel Analytics

Archivo: `src/main.tsx`.

- Se renderiza solo si `import.meta.env.PROD`.

#### PDF local

Servicios/librerias:

- jsPDF.
- html2canvas.
- html2pdf.js.
- pdfjs-dist para lectura de plan PDF.

No es externo remoto, pero es integracion critica de navegador.

## 12. Entradas, salidas y exportaciones

### Entradas y salidas del sistema

Entradas:

- Formularios login/register.
- Formularios proyecto.
- Perfil y configuracion.
- Condiciones: parametros, precios, textos, roles.
- Equipo: miembros, roles, genero.
- Calendario: semanas, dias, horarios, listas y notas.
- Importacion PDF de plan de rodaje.
- Reportes: conceptos por persona/dia.
- Nomina: IRPF, recibido, notas, seleccion de filas, rangos.
- Timesheet: DNI, SS, empresa, catering, notas.
- MySet: carpetas, documentos, imagenes y metadatos.
- Feedback: mensaje.

Salidas:

- PDFs de Equipo.
- PDFs de Condiciones.
- PDFs de Calendario/Necesidades.
- PDFs de Reportes.
- PDFs de Nomina.
- PDFs de Timesheet.
- Archivos descargados desde MySet.
- Miniaturas/previsualizaciones de MySet.
- Calendario global de proyectos.
- LocalStorage JSON.
- Feedback a Formspree.

Formatos:

- JSON local en `localStorage`.
- PDF generado en navegador.
- FormData para feedback.
- PDF importado leido con pdfjs.
- Documentos e imagenes subidos por el usuario para MySet.

Validaciones:

- Login: campos obligatorios y credenciales demo.
- Registro: campos obligatorios y contrasenas iguales.
- Proyecto: nombre requerido por flujo/tutorial.
- Exportaciones: datos suficientes y secciones seleccionadas.
- Importacion plan: PDF legible y semanas detectadas.
- MySet: nombres obligatorios, tipos permitidos, tamano maximo, confirmacion de borrado y duplicados.
- ReadOnly: bloquea cambios si proyecto cerrado.

### Exportaciones PDF

Exportaciones existentes:

- Equipo.
- Condiciones.
- Calendario global de proyectos.
- Calendario de proyecto.
- Necesidades de semana.
- Necesidades por seccion.
- Necesidades completas.
- Reporte semanal.
- Reporte mensual.
- Nomina mensual.
- Timesheet individual.

Requisitos transversales:

- Mantener compatibilidad en movil.
- Soportar tema claro/oscuro.
- Evitar exportar elementos marcados `no-pdf`.
- Usar nombres de proyecto, productora, DoP, almacen y responsables en cabeceras cuando aplique.
- Mostrar avisos si no hay datos suficientes.

## 13. Reglas de negocio consolidadas

- El tipo de condiciones del proyecto determina precios, calculos y visibilidad de modulos.
- Equipo alimenta Calendario, Reportes, Timesheet y Nomina.
- Calendario alimenta Reportes, Timesheet y Nomina.
- Condiciones alimenta Reportes y Nomina.
- Reportes alimenta Nomina.
- MySet pertenece a un unico proyecto y actua como repositorio documental aislado de ese proyecto.
- Proyecto cerrado implica modo solo lectura.
- Gaffer y Best Boy tienen permisos completos sobre el proyecto.
- Gaffer y Best Boy pueden colaborar de forma simultanea sobre el mismo proyecto.
- Los miembros de equipo invitados tienen visibilidad limitada sobre informacion sensible propia.
- Las invitaciones vinculan usuarios registrados con miembros del equipo/proyecto.
- Los datos se guardan localmente por proyecto usando `id` o `nombre` como fallback.
- El cambio de idioma del proyecto debe afectar textos exportados y etiquetas dentro del proyecto.
- Los festivos dependen de pais y region del proyecto.

### Tabla consolidada de reglas

| Regla | Donde | Entidad | Tipo |
| --- | --- | --- | --- |
| Proyecto cerrado bloquea edicion | `ProjectDetailContent`, tabs | Project | explicita |
| Diario oculta Timesheet | `PhaseGrid`, `ProjectDetail` | Project | explicita |
| Login es demo hardcodeado | `useAuthHandlers` | User | explicita |
| Registro no crea credenciales reales | `useAuthHandlers` | User | implicita |
| Registro futuro crea usuario real con rol profesional | nueva funcionalidad propuesta | User | explicita |
| Gaffer y Best Boy tienen permisos completos | nueva funcionalidad propuesta | ProjectMembership | explicita |
| Gaffer y Best Boy pueden editar simultaneamente | nueva funcionalidad propuesta | Project | explicita |
| Equipo invitado ve solo su informacion sensible | nueva funcionalidad propuesta | ProjectMembership | explicita |
| Condiciones filtra precios por rol para equipo invitado | nueva funcionalidad propuesta | Conditions | explicita |
| Reportes/Nomina filtran por usuario para equipo invitado | nueva funcionalidad propuesta | Report/Payroll | explicita |
| Timesheet filtra al trabajador autenticado | nueva funcionalidad propuesta | Timesheet | explicita |
| Idioma de proyecto domina dentro del proyecto | `ProjectDetail` | Project | explicita |
| Equipo base alimenta calendario | `EquipoTab`, `NecesidadesTab` | Team/Needs | explicita |
| Descanso/Fin limpian listas | `NecesidadesTab`, `WeekSection` | Day | explicita |
| Rodaje/Rodaje Festivo numeran dias de rodaje | `NecesidadesTab` | Day | explicita |
| Reportes requiere semanas y equipo | `ReportesTab` | Report | explicita |
| Timesheet requiere semanas, equipo y personas asignadas | `TimesheetTab` | Timesheet | explicita |
| Nomina depende de condiciones + calendario + reportes | `Nomina*`, utils | Payroll | explicita |
| Rango de Reportes se sincroniza con Nomina | `MonthReportGroup`, `MonthSection` | Report/Payroll | explicita |
| MySet respeta el estado activo/cerrado del proyecto | nueva funcionalidad propuesta | MySet | explicita |
| MySet no mezcla archivos entre proyectos | nueva funcionalidad propuesta | MySet | explicita |
| MySet aplica permisos concedidos por Gaffer/Best Boy | nueva funcionalidad propuesta | MySetPermission | explicita |
| Borrar carpetas o archivos requiere confirmacion | nueva funcionalidad propuesta | MySet | explicita |
| Material propio puede ser semanal/diario/unico | Condiciones/Nomina | Price | explicita |
| Role custom se resuelve por `roleId` antes que label | `projectRoles`, rolePrices | Role | implicita |
| Festivos dependen de pais/region | `useHolidays`, holidays service | Project/Day | explicita |

## 14. Flujos funcionales y casos de uso

### Flujos funcionales principales

#### Login

Actor: usuario registrado o usuario demo en la beta actual.

Precondiciones:

- En beta actual, conocer usuario permitido y password.
- En version futura, tener cuenta registrada o invitacion aceptada.

Pasos:

1. Introduce usuario/password.
2. Submit.
3. Valida campos.
4. En beta actual, compara contra lista demo.
5. En version futura, valida credenciales contra backend y carga proyectos accesibles.
6. Navega a `/projects`.

Errores:

- Campos vacios.
- Usuario no permitido.
- Cuenta no verificada, invitacion caducada o usuario sin proyectos asociados.

#### Registro de usuario

Actor: nuevo usuario.

Pasos:

1. Abre registro.
2. Introduce nombre, apellidos, email, contrasena, rol profesional, idioma y genero.
3. Acepta condiciones de uso y politica de privacidad si aplica.
4. El sistema valida email unico y seguridad de contrasena.
5. Crea cuenta.
6. Si el registro viene desde una invitacion, vincula el usuario al proyecto y al miembro de equipo correspondiente.

Reglas:

- El email debe ser unico.
- El rol profesional no otorga por si solo permisos de administracion.
- Los permisos de proyecto dependen de `ProjectMembership`.

#### Invitar equipo al proyecto

Actor: Gaffer o Best Boy.

Pasos:

1. Abre Equipo o Gestion de miembros del proyecto.
2. Selecciona un miembro existente o crea uno nuevo.
3. Introduce email de invitacion.
4. Define rol profesional y permiso de proyecto.
5. Envia invitacion.
6. El invitado recibe enlace, se registra o inicia sesion y acepta.
7. El sistema vincula su usuario con el proyecto y con su `personId`.

Reglas:

- Solo Gaffer y Best Boy pueden invitar o revocar miembros por defecto.
- Una invitacion debe caducar.
- Un email ya registrado debe iniciar sesion para aceptar.
- Un email no registrado debe crear cuenta.

#### Colaboracion simultanea Gaffer/Best Boy

Actor: Gaffer y Best Boy.

Pasos:

1. Ambos entran en el mismo proyecto desde sesiones distintas.
2. El sistema carga el estado compartido del proyecto.
3. Cada cambio relevante se guarda en backend y se sincroniza con la otra sesion.
4. Si dos usuarios editan el mismo dato, el sistema debe resolver conflicto o avisar.

Reglas:

- Debe evitarse la perdida silenciosa de cambios.
- Debe registrarse `updatedBy` y `updatedAt`.
- Para datos criticos como condiciones, nomina y calendario, se recomienda bloqueo optimista con versionado.

#### Crear proyecto

Actor: usuario autenticado.

Pasos:

1. Abre modal.
2. Rellena datos.
3. Selecciona estado, tipo, idioma, pais, region.
4. Guarda en `projects_v1`.
5. Abre detalle.

Reglas:

- El tipo define fases y calculos.
- El idioma define i18n dentro del proyecto.

#### Configurar condiciones

Pasos:

1. Abre Condiciones.
2. Si no existe modelo, se siembran defaults.
3. Edita parametro/precio principal.
4. Se derivan importes.
5. Edita textos.
6. Exporta PDF.

Errores:

- Exportar sin seccion.
- Valores no numericos derivan vacio o 0 segun helper.

#### Planificar calendario

Pasos:

1. Anade semana.
2. Define lunes.
3. Marca tipo de jornada.
4. Asigna equipo.
5. Completa horarios, localizacion, logistica y notas.
6. Duplica/intercambia/exporta si aplica.

Reglas:

- Descanso/Fin limpian listas.
- Roster se sincroniza desde Equipo.

#### Importar plan PDF

Pasos:

1. Selecciona archivo.
2. pdfjs extrae texto.
3. Parser detecta semanas.
4. Vista previa muestra conflictos.
5. Usuario decide importar/omitir/sobrescribir.
6. Se aplica a `needs_${id}`.

Errores:

- PDF ilegible.
- Sin semanas detectadas.

#### Reportar y calcular

Pasos:

1. Reportes lee semanas y equipo.
2. Agrupa por mes o semana.
3. Calcula horarios/conceptos.
4. Usuario ajusta valores.
5. Exporta PDF.
6. Nomina lee reportes y agrega importes.

#### Gestionar MySet

Actor: usuario con acceso al proyecto.

Precondiciones:

- Proyecto creado.
- Usuario dentro del detalle del proyecto.

Pasos:

1. Abre la tarjeta MySet desde el menu del proyecto.
2. El sistema muestra la raiz del espacio documental.
3. El usuario crea una carpeta o subcarpeta.
4. El usuario sube documentos o imagenes.
5. El sistema guarda metadatos y archivo en el almacenamiento configurado.
6. El usuario puede buscar, ordenar, previsualizar, descargar, renombrar, mover o borrar elementos.

Reglas:

- En proyecto cerrado solo puede navegar, previsualizar y descargar.
- Carpetas y archivos pertenecen siempre al proyecto activo.
- Gaffer y Best Boy pueden gestionar todo MySet.
- El resto del equipo solo ve carpetas/archivos autorizados.
- Borrar exige confirmacion.
- Nombres vacios o duplicados dentro de la misma carpeta deben gestionarse con validacion o versionado.

Resultado:

- El proyecto dispone de un espacio de trabajo documental organizado por carpetas.

#### Cerrar proyecto

Pasos:

1. Pulsa estado.
2. Confirma modal.
3. Cambia `estado`.
4. Tabs quedan en readOnly.

### Casos de uso principales

#### CU-01 Iniciar sesion

Actor: usuario registrado o usuario demo en beta.

Flujo:

1. Introduce usuario y contrasena.
2. Pulsa Iniciar sesion.
3. El sistema valida campos y credenciales.
4. Entra en Proyectos.
5. En version futura, solo ve proyectos donde tenga membresia activa.

Alternativas:

- Campos vacios: mostrar error.
- Credenciales invalidas: mostrar error.

#### CU-01B Registrarse en la app

Actor: usuario nuevo.

Flujo:

1. Abre pantalla de registro.
2. Introduce datos personales, email, contrasena, rol profesional, idioma y genero.
3. El sistema valida email unico y contrasena segura.
4. Crea cuenta.
5. Si viene desde invitacion, acepta la invitacion y entra al proyecto.

Resultado:

- El usuario tiene cuenta real y perfil asociado.

#### CU-02 Crear proyecto

Actor: usuario autenticado.

Flujo:

1. Abre Nuevo proyecto.
2. Rellena nombre y metadatos.
3. Selecciona estado, tipo de condiciones, idioma, pais y region.
4. Guarda.
5. El proyecto aparece en listado y se abre.

Regla:

- El nombre del proyecto es obligatorio para avanzar en tutorial.

#### CU-03 Configurar condiciones

Actor: jefe de departamento o usuario con proyecto activo.

Flujo:

1. Abre fase Condiciones.
2. Revisa parametros de calculo.
3. Edita precios por rol.
4. Ajusta textos contractuales.
5. Exporta PDF seleccionando secciones.

Resultado:

- Los parametros quedan disponibles para reportes y nomina.

#### CU-04 Crear equipo

Actor: usuario con proyecto activo.

Flujo:

1. Abre Equipo.
2. Anade miembros al equipo base.
3. Selecciona rol y genero.
4. Escribe nombre y apellidos.
5. Opcionalmente anade Prelight, Recogida y refuerzos.
6. Exporta PDF.

Resultado:

- El roster queda disponible en Calendario.

#### CU-04B Invitar equipo

Actor: Gaffer o Best Boy.

Flujo:

1. Abre Equipo o Gestion de miembros.
2. Selecciona miembro del proyecto.
3. Introduce email.
4. Define permiso: Gaffer, Best Boy o miembro de equipo.
5. Envia invitacion.
6. El invitado se registra o inicia sesion.
7. El sistema vincula usuario y miembro de equipo.

Resultado:

- El invitado accede al proyecto con permisos segun su rol de membresia.

#### CU-05 Planificar semana

Actor: usuario con proyecto activo.

Flujo:

1. Abre Calendario.
2. Anade semana en preproduccion o produccion.
3. Define lunes.
4. Completa tipo de jornada, localizacion, horarios, equipo y logistica.
5. Opcionalmente duplica semana o intercambia dias.
6. Exporta PDF.

Resultado:

- Semana disponible en Reportes, Timesheet y Nomina.

#### CU-06 Importar plan de rodaje

Actor: usuario con proyecto activo.

Flujo:

1. Pulsa Plan rodaje.
2. Selecciona PDF.
3. El sistema extrae semanas y muestra vista previa.
4. El usuario decide importar, omitir o sobrescribir conflictos.
5. Confirma.

Resultado:

- Se crean o actualizan semanas en Calendario.

#### CU-07 Registrar reportes

Actor: usuario con proyecto activo.

Flujo:

1. Abre Reportes.
2. Selecciona mes o semana.
3. Revisa horarios generados desde Calendario.
4. Ajusta conceptos reales por persona.
5. Selecciona tipo de horas extra si aplica.
6. Exporta PDF.

Resultado:

- Los datos quedan listos para Nomina.

#### CU-07B Consultar informacion propia como miembro invitado

Actor: miembro de equipo invitado.

Flujo:

1. Inicia sesion.
2. Abre un proyecto al que fue invitado.
3. En Condiciones ve solo la fila de precios de su rol.
4. En Equipo ve el equipo completo.
5. En Reportes ve solo sus propios reportes.
6. En Nomina ve solo su propia nomina.
7. En Timesheet ve solo su propio timesheet.
8. En MySet ve solo carpetas y archivos autorizados.

Resultado:

- El usuario puede consultar su informacion sin acceder a datos sensibles del resto del equipo.

#### CU-08 Generar timesheet

Actor: usuario con proyecto semanal/mensual activo.

Flujo:

1. Abre Timesheet.
2. Selecciona semana.
3. Selecciona trabajador.
4. Completa DNI, SS, datos de productora, catering y notas.
5. Exporta PDF.

Resultado:

- Se obtiene registro horario individual.

#### CU-09 Revisar nomina

Actor: usuario.

Flujo:

1. Abre Nomina.
2. El sistema agrupa por mes.
3. Calcula importes desde condiciones, calendario y reportes.
4. Usuario revisa totales.
5. Exporta PDF mensual.

Resultado:

- Nomina exportada por periodo.

#### CU-10 Cerrar proyecto

Actor: usuario.

Flujo:

1. Pulsa estado activo.
2. Confirma cierre.
3. El proyecto pasa a Cerrado.

Resultado:

- Las fases quedan en solo lectura.

#### CU-11 Gestionar MySet

Actor: Gaffer, Best Boy o usuario con permiso MySet.

Flujo:

1. Entra en el detalle del proyecto.
2. Pulsa la tarjeta MySet.
3. Crea una carpeta para organizar documentacion.
4. Sube documentos o imagenes.
5. Navega por carpetas, busca archivos y previsualiza contenido.
6. Opcionalmente renombra, mueve, descarga o elimina elementos.
7. Si es Gaffer o Best Boy, gestiona permisos de acceso para otros miembros.

Alternativas:

- Proyecto cerrado: el usuario solo puede consultar y descargar.
- Usuario sin permiso MySet: no ve el contenido o ve tarjeta bloqueada.
- Nombre de carpeta vacio: mostrar error.
- Archivo no permitido o demasiado grande: mostrar error.
- Borrado de carpeta con contenido: pedir confirmacion explicita.

Resultado:

- El usuario mantiene un espacio de trabajo documental dentro del proyecto.

## 15. Requisitos funcionales para rehacer

| ID | Requisito | Prioridad | Modulo | Criterio de aceptacion | Referencia |
| --- | --- | --- | --- | --- | --- |
| RF-001 | Login demo o auth real configurable | Alta | Auth | usuario valido entra y usuario invalido falla | `useAuthHandlers.ts` |
| RF-002 | CRUD de proyectos | Alta | Proyectos | crear, editar, borrar, abrir y listar proyectos | `ProjectsScreen.tsx` |
| RF-003 | Filtros y orden de proyectos | Media | Proyectos | buscar por nombre/DoP/almacen/productora | `useProjectsFilter.ts` |
| RF-004 | Estado activo/cerrado | Alta | Proyecto | cerrado bloquea edicion | `ProjectDetail.tsx` |
| RF-005 | Idioma por proyecto | Alta | i18n | abrir proyecto cambia idioma y al salir restaura perfil | `ProjectDetail.tsx` |
| RF-006 | Condiciones semanal/mensual/diario | Alta | Condiciones | formulas documentadas producen importes esperados | `semanalUtils.ts`, `mensualUtils.ts`, `publicidadUtils.ts` |
| RF-007 | Roles personalizados | Alta | Equipo/Condiciones | renombrar rol crea rol de proyecto resoluble por `roleId` | `projectRoles.ts` |
| RF-008 | Equipo por grupos | Alta | Equipo | base/refuerzos/prelight/pickup funcionan por modo | `EquipoTab.tsx` |
| RF-009 | Calendario por semanas | Alta | Calendario | semanas pre/pro con dias editables | `NecesidadesTab.tsx` |
| RF-010 | Importacion PDF plan | Media | Calendario | detecta semanas, previsualiza y aplica conflictos | `importPlan/*` |
| RF-011 | Exportaciones PDF | Alta | Transversal | cada modulo exporta PDF con datos correctos | utils `export*` |
| RF-012 | Reportes automaticos | Alta | Reportes | horas extra/nocturnidad/TA calculados | `useAutoCalculations` |
| RF-013 | Nomina por modo | Alta | Nomina | semanal/mensual/diario agregan correctamente | `nomina/utils` |
| RF-014 | Timesheet individual | Media | Timesheet | PDF por trabajador/semana | `TimesheetTab.tsx` |
| RF-015 | Perfil/configuracion | Media | Usuario | tema, idioma, genero persisten | `ProfilePage.tsx`, `SettingsPage.tsx` |
| RF-016 | Feedback | Baja | Soporte | envia sugerencia y maneja error | `SuggestionFab.tsx` |
| RF-017 | MySet como espacio documental del proyecto | Alta | MySet | cada proyecto tiene tarjeta MySet y raiz documental propia | nueva funcionalidad |
| RF-018 | Gestion de carpetas en MySet | Alta | MySet | crear, abrir, renombrar, mover y borrar carpetas con validaciones | nueva funcionalidad |
| RF-019 | Gestion de archivos en MySet | Alta | MySet | subir, previsualizar, descargar, renombrar, mover y borrar documentos e imagenes | nueva funcionalidad |
| RF-020 | Busqueda y ordenacion en MySet | Media | MySet | buscar por nombre/tipo y ordenar por nombre, fecha, tipo o tamano | nueva funcionalidad |
| RF-021 | MySet en modo solo lectura para proyectos cerrados | Alta | MySet | proyecto cerrado permite consultar/descargar pero no modificar | nueva funcionalidad |
| RF-022 | Registro real de usuarios | Alta | Auth | usuario crea cuenta con datos, email unico, contrasena y rol profesional | nueva funcionalidad |
| RF-023 | Membresias y permisos por proyecto | Alta | Auth/Proyecto | cada usuario tiene permiso por proyecto independiente de su rol profesional | nueva funcionalidad |
| RF-024 | Permisos completos para Gaffer y Best Boy | Alta | Proyecto | Gaffer y Best Boy pueden ver, editar, invitar y gestionar todos los modulos | nueva funcionalidad |
| RF-025 | Colaboracion simultanea Gaffer/Best Boy | Alta | Proyecto | dos sesiones editan el mismo proyecto sin perdida silenciosa de cambios | nueva funcionalidad |
| RF-026 | Invitaciones al equipo | Alta | Equipo/Auth | Gaffer/Best Boy invitan por email y el invitado se registra o acepta | nueva funcionalidad |
| RF-027 | Vista restringida para miembros invitados | Alta | Permisos | miembro ve solo su informacion en condiciones, reportes, nomina y timesheet | nueva funcionalidad |
| RF-028 | Permisos de MySet por usuario/carpeta | Alta | MySet | Gaffer/Best Boy conceden o revocan acceso a carpetas/archivos | nueva funcionalidad |

## 16. Requisitos tecnicos para rehacer

Para rehacer SetLux con menos deuda, conviene separar explicitamente:

- Dominio: proyectos, equipos, calendario, condiciones, reportes, nomina y MySet.
- Persistencia: repositorios locales/remotos intercambiables.
- Calculos: funciones puras con tests de formulas.
- UI: pantallas y componentes sin logica de negocio pesada.
- PDF: capa de exportacion con modelos de datos normalizados.
- i18n: textos de interfaz separados de textos legales editables por proyecto.

El flujo minimo viable deberia implementarse en este orden:

1. Auth real, registro, perfiles, membresias y permisos por proyecto.
2. Proyectos, configuracion e idioma/tema.
3. Condiciones y precios con visibilidad por rol.
4. Equipo con roles personalizados e invitaciones.
5. Calendario con semanas, dias y miembros.
6. MySet con carpetas, permisos y subida de documentos/imagenes.
7. Reportes con calculos automaticos y visibilidad por usuario.
8. Nomina con visibilidad por usuario.
9. Timesheet individual.
10. Importacion PDF y exportaciones avanzadas.

### Especificacion tecnica recomendada

Stack recomendado:

- Frontend: React + TypeScript + Vite o Next.js si se quiere SSR/API.
- Backend recomendado: Node/NestJS, Laravel o Django si se necesita multiusuario real.
- Base de datos: PostgreSQL.
- PDF: servicio dedicado o generacion server-side para consistencia.
- Cola: para PDFs pesados, importacion PDF y emails.
- Storage: S3-compatible para adjuntos, tickets y PDFs.
- Cache: Redis para sesiones, jobs y cache de festivos.
- Auth: email/password, OAuth opcional, JWT/session segura.
- Permisos: RBAC por proyecto combinado con ownership de datos personales.
- Sincronizacion colaborativa: versionado optimista, eventos en tiempo real o refetch inteligente tras mutaciones.
- Testing: unit tests para calculos, integration tests para repositorios, e2e Playwright para flujos.
- Observabilidad: logs estructurados, errores frontend, trazas de jobs, metricas de exportacion.

Arquitectura propuesta:

- Dominio puro: Project, Conditions, Team, Calendar, MySet, Report, Payroll, Timesheet.
- Casos de uso por modulo.
- Adaptadores: DB, PDF, external APIs, file storage.
- UI desacoplada de formulas.
- Contratos tipados para entradas/salidas.

Base de datos propuesta:

- `users`
- `user_profiles`
- `project_memberships`
- `project_invitations`
- `projects`
- `project_members`
- `project_roles`
- `conditions`
- `condition_price_rows`
- `weeks`
- `days`
- `day_assignments`
- `extra_blocks`
- `reports`
- `report_concepts`
- `payroll_periods`
- `payroll_rows`
- `timesheets`
- `myset_folders`
- `myset_files`
- `myset_permissions`
- `audit_logs`
- `feedback`
- `exports`
- `import_jobs`

Seguridad:

- No guardar DNI/SS sin cifrado.
- No aceptar subida de archivos sin validacion de tipo, tamano y permisos.
- Auditoria de accesos y cambios.
- Comprobar permisos en cada endpoint de backend, especialmente nomina, reportes, condiciones y MySet.
- Nunca confiar en filtros solo de frontend para ocultar informacion sensible.
- Validacion server-side.
- Sanitizacion HTML de textos editables.
- API keys solo en backend.

Migracion de datos:

- Exportador localStorage a JSON versionado.
- Importador backend que normalice proyectos, roles, semanas, reportes, condiciones y MySet.
- Validadores por version de schema.

## 17. Ideas futuras de monetizacion y planes

Esta seccion recoge ideas iniciales de producto y negocio. No debe interpretarse como una definicion cerrada de precios, limites ni disponibilidad comercial. Su objetivo es dejar contexto para futuras decisiones de monetizacion, onboarding y segmentacion de usuarios.

### Principio general

SetLux deberia organizar sus planes alrededor del valor que recibe cada tipo de usuario:

- Usuarios que prueban la app.
- Usuarios que trabajan de forma sencilla con un proyecto.
- Universidades o escuelas que reparten acceso a estudiantes.
- Profesionales que gestionan varios proyectos.
- Usuarios profesionales que quieren la experiencia completa.

La idea principal es que el usuario pueda entrar facilmente, entender el valor de SetLux con un proyecto y, cuando necesite trabajar en serio, pasar a un plan superior.

### Freemium

Objetivo:

- Permitir probar SetLux gratis.
- Conseguir que el usuario entienda el flujo completo de la app.
- Mostrar el valor del plan Pro sin obligar a pagar desde el primer minuto.

Funcionamiento previsto:

- El usuario puede registrarse.
- Puede crear un unico proyecto.
- Puede explorar el flujo principal: Condiciones, Equipo, Calendario, Reportes, Nomina, Timesheet y MySet.
- La experiencia debe ser suficiente para enganchar, pero no tan amplia como para sustituir un uso profesional completo.

Limitaciones orientativas:

- Un solo proyecto.
- Sin colaboracion real.
- Sin compartir proyecto con equipo.
- Sin permisos avanzados.
- Sin experiencia completa de MySet.
- Sin funciones profesionales avanzadas.
- Exportaciones limitadas o con alguna restriccion pendiente de definir.

Uso dentro del producto:

- Debe mostrar de forma clara que existen funciones superiores.
- Los botones o acciones bloqueadas pueden explicar el valor de Basic o Pro.
- Ejemplos: importar plan de rodaje, invitar equipo, colaborar con Best Boy, permisos de MySet o proyectos ilimitados.

### Free

Objetivo:

- Ofrecer un uso gratuito sencillo y estable.
- Permitir trabajar con un proyecto simple, sin funciones especiales.

Funcionamiento previsto:

- Un proyecto.
- Uso individual.
- Sin compartir.
- Sin colaboracion.
- Sin permisos.
- Sin importacion de plan de rodaje.
- Sin herramientas avanzadas.

Caracter:

- Es un plan simple.
- No esta pensado para una produccion profesional compleja.
- Puede servir para usuarios pequeños, pruebas personales o proyectos muy sencillos.

Diferencia con Freemium:

- Freemium se plantea como prueba orientada a conversion.
- Free se plantea como uso basico permanente, pero muy limitado.

### Education

Objetivo:

- Crear un plan para universidades, escuelas de cine y centros formativos.
- Permitir que una institucion pague y reparta usuarios entre estudiantes y profesores.

Funcionamiento previsto:

- La universidad/escuela gestiona el acceso.
- Puede crear o asignar usuarios.
- Puede organizar estudiantes por clases, promociones o grupos.
- Los usuarios reciben un modo similar a Basic, adaptado a formacion.
- Profesores o supervisores pueden revisar proyectos si se define esa funcionalidad.

Alcance orientativo:

- Proyectos academicos.
- Uso formativo.
- Funciones principales de SetLux.
- Posible acceso a importar plan de rodaje para aprendizaje real.
- MySet para documentacion de clase o proyecto.

Limitaciones orientativas:

- Uso educativo, no comercial.
- Sin experiencia Pro completa.
- Sin colaboracion profesional avanzada.
- Sin permisos corporativos complejos.
- Sin soporte premium individual para cada alumno.

Valor estrategico:

- Introduce SetLux en escuelas y universidades.
- Permite que futuros profesionales aprendan con la herramienta.
- Puede convertir SetLux en estandar de trabajo desde la formacion.

### Basic

Objetivo:

- Primer plan profesional.
- Pensado para profesionales individuales o equipos pequeños.
- Permitir trabajar con varios proyectos sin llegar a la experiencia completa de Pro.

Funcionamiento previsto:

- Hasta 3 proyectos.
- Condiciones completas.
- Equipo completo.
- Calendario completo.
- Importacion de plan de rodaje.
- Reportes.
- Nomina.
- Timesheet.
- MySet funcional.
- Exportaciones profesionales.

Limitaciones orientativas:

- Sin proyectos ilimitados.
- Sin colaboracion simultanea completa.
- Sin multiples administradores avanzados.
- Sin permisos detallados por usuario.
- Sin compartir avanzado con todo el equipo.
- MySet sin permisos granulares o con permisos simples.

Perfil de usuario:

- Gaffer freelance.
- Best Boy freelance.
- Profesional que gestiona pocos proyectos.
- Rodajes pequeños o medianos.
- Usuario que necesita trabajar en serio, pero no necesita toda la estructura colaborativa.

### Pro

Objetivo:

- Plan principal de SetLux.
- Full experience.
- Pensado para uso profesional completo.

Funcionamiento previsto:

- Proyectos ilimitados o limite alto pendiente de definir.
- Todas las fases y funcionalidades completas.
- Colaboracion entre Gaffer y Best Boy.
- Invitacion del resto del equipo.
- Permisos por usuario.
- Visibilidad restringida para miembros invitados.
- MySet completo con permisos por carpeta o archivo.
- Importacion avanzada de plan de rodaje.
- Exportaciones completas.
- Plantillas avanzadas.
- Historial de cambios.
- Mejor almacenamiento.
- Soporte superior al resto de planes.

Modelo de permisos:

- Gaffer y Best Boy pueden editar todo.
- El resto del equipo accede como usuario invitado.
- Cada miembro ve su propia informacion sensible.
- Condiciones muestra al miembro invitado solo su fila de precio.
- Equipo se puede ver completo.
- Reportes, Nomina y Timesheet se filtran por usuario.
- MySet depende de permisos otorgados por Gaffer o Best Boy.

Valor de conversion:

- El plan Pro debe ser el destino natural cuando el usuario quiera usar SetLux en rodajes reales.
- La colaboracion, los permisos, los proyectos ilimitados y MySet completo son las principales palancas para convertir desde Freemium, Free o Basic.

### Escalera de planes propuesta

| Plan | Idea principal | Estado de definicion |
| --- | --- | --- |
| Freemium | probar gratis la app con un proyecto y descubrir el valor | idea pendiente de concretar |
| Free | un proyecto simple, sin compartir ni extras | idea pendiente de concretar |
| Education | universidades compran acceso y reparten usuarios con modo Basic educativo | idea pendiente de concretar |
| Basic | hasta 3 proyectos e importacion de plan de rodaje | idea pendiente de concretar |
| Pro | experiencia completa, colaborativa e ilimitada | idea pendiente de concretar |

### Decisiones pendientes sobre planes

1. Definir si Freemium y Free deben coexistir o si uno debe absorber al otro.
2. Definir que funciones exactas se bloquean en Freemium.
3. Definir si Free permite exportaciones sin marca de agua.
4. Definir limites de almacenamiento de MySet por plan.
5. Definir si Education se vende por universidad, por clase, por usuario o por paquete.
6. Definir si Basic permite invitar usuarios solo como visualizadores o no permite compartir.
7. Definir si Pro es realmente ilimitado o si usa limites altos de uso razonable.
8. Definir que funciones aparecen bloqueadas visualmente como incentivo de upgrade.
9. Definir estrategia de precios, periodos de prueba y facturacion anual/mensual.
10. Definir si los usuarios invitados del equipo consumen plaza o son gratuitos dentro de Pro.

## 18. Riesgos, dudas y zonas ambiguas

1. Autenticacion: confirmar si seguira siendo demo/local o si se implementara backend real con usuarios, roles y permisos.
2. Registro: confirmar si debe exponerse al usuario final o eliminarse hasta tener backend.
3. Persistencia: confirmar si se mantiene `localStorage` en beta o se migra a base de datos sincronizada.
4. Colaboracion: definir tecnologia y reglas para que Gaffer y Best Boy editen simultaneamente el mismo proyecto.
5. Roles y permisos: definir permisos reales por rol para editar Condiciones, Equipo, Calendario, Reportes, Nomina, Timesheet y MySet.
6. Adjuntos: decidir si imagenes, archivos y tickets siguen en beta o se implementan con almacenamiento real.
7. Importacion de plan PDF: definir formatos objetivo y tolerancia a errores esperada.
8. Traduccion DeepL: confirmar si sera funcionalidad oficial y donde se gestionara la API key.
9. Nomina: validar formulas finales por modo con ejemplos reales.
10. Convenio y festivos: confirmar fuente legal y actualizacion automatica por ano, pais y region.
11. Exportaciones: definir branding final, formatos y si los PDF deben ser identicos en todos los navegadores.
12. Timesheet: confirmar si debe existir tambien para proyectos `diario` o seguir oculto.
13. Calendario global: confirmar si debe exportar solo actividad con trabajadores o toda semana creada.
14. Idioma de proyecto: confirmar si cada PDF debe usar siempre idioma de proyecto aunque el usuario tenga otro idioma global.
15. MySet: confirmar tamano maximo por archivo, tipos permitidos, versionado de duplicados y si habra permisos por carpeta.
16. MySet: confirmar si los PDFs generados por SetLux deben guardarse automaticamente en carpetas de MySet.
17. Invitaciones: confirmar si las invitaciones se envian por email real, enlace copiable o ambas.
18. Miembros restringidos: confirmar si pueden ver calendario completo o solo dias donde estan asignados.
19. Condiciones restringidas: confirmar si el trabajador ve solo importes de su rol o tambien textos legales generales.
20. Nomina restringida: confirmar si el trabajador puede descargar su nomina en PDF desde la app.

### Riesgos tecnicos y ambiguedades detectadas

- Login demo no es auth real.
- Registro existe pero no se usa en login real.
- Hay modulo `planificacion` legacy junto a `necesidades/calendario`; confirmar si se elimina.
- `divTravel` mensual tiene discrepancia entre UI y fallback de nomina.
- Diario usa `factorHoraExtraFestiva`, pero helper diario espera `factorHoraExtra` para derivar hora extra.
- Exportaciones PDF dependen del navegador y pueden variar.
- Datos sensibles en localStorage.
- El modelo futuro de permisos exige backend; no puede resolverse de forma segura solo con React/localStorage.
- La colaboracion simultanea requiere control de concurrencia para evitar sobrescrituras.
- La visibilidad restringida en reportes/nomina/condiciones debe probarse especialmente para evitar fugas de datos laborales.
- Adjuntos estan en beta, sin almacenamiento.
- MySet requiere definir almacenamiento real; `localStorage` no es adecuado para binarios.
- MySet introduce riesgos de seguridad por subida de archivos: tipos peligrosos, tamano, cuotas, virus y permisos.
- DeepL esta mencionado en textos, pero no se detecta integracion activa.
- Calendarific depende de API key publica `VITE_*`.
- Muchas reglas viven en hooks/componentes, no en dominio puro.
- Uso de `dangerouslySetInnerHTML` requiere auditoria.
- Eventos custom de localStorage/tutorial pueden ser fragiles.
- Tests cubren muchas utilidades, pero no garantizan flujos completos end-to-end.

## 19. Plan para reconstruirlo desde cero con IA

#### Fase 1: descubrimiento y documentacion

- Congelar esta especificacion.
- Generar ejemplos reales de proyectos semanal, mensual y diario.
- Validar formulas con usuarios expertos.
- Definir permisos reales y modelo multiusuario.
- Definir matriz final de permisos para Gaffer, Best Boy y miembros invitados.
- Definir estrategia de colaboracion simultanea y resolucion de conflictos.

#### Fase 2: modelo de datos

- Disenar esquema PostgreSQL.
- Versionar schemas de condiciones/calendario/reportes.
- Crear migracion desde localStorage JSON.
- Definir IDs estables para roles/personas/semanas/dias.
- Disenar usuarios, membresias, invitaciones, permisos MySet y auditoria.

#### Fase 3: modulos core

- Auth real, registro, login, recuperacion de contrasena e invitaciones.
- Proyectos con membresias y permisos.
- Condiciones con calculos puros.
- Equipo y roles personalizados.
- Calendario con semanas/dias/asignaciones.
- MySet con carpetas, metadatos y almacenamiento de documentos/imagenes.
- Reportes.
- Nomina.

#### Fase 4: integraciones

- PDF server-side.
- Storage S3-compatible para MySet, adjuntos, tickets y PDFs guardados.
- Importacion PDF asincrona.
- Festivos por proveedor backend.
- Feedback/soporte.
- Adjuntos/tickets en storage.
- Sincronizacion en tiempo real o versionado optimista para colaboracion Gaffer/Best Boy.

#### Fase 5: migracion

- Exportar datos actuales del navegador.
- Importar y validar en backend.
- Comparar nominas/reportes entre version vieja y nueva.
- Herramientas de rollback.

#### Fase 6: tests y calidad

- Unit tests de formulas.
- Tests de reglas de negocio.
- Tests de importacion PDF.
- Tests de permisos y fugas de datos por rol.
- Tests de concurrencia basicos para edicion simultanea.
- Tests visuales/PDF snapshot si es viable.
- E2E de flujos: crear proyecto, condiciones, equipo, calendario, reportes, nomina y timesheet.
- Observabilidad de errores y metricas de uso.
