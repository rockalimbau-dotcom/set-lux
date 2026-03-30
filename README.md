# SetLux

**SetLux** es una aplicación web para gestionar de forma unificada el departamento de iluminación en proyectos audiovisuales. Centraliza en un solo flujo el proyecto, las condiciones, el equipo, el calendario conectado con necesidades, los reportes, la nómina y los timesheets por persona.

Está pensada principalmente para **gaffers** y **best boys** que necesitan control operativo y económico del equipo sin depender de hojas de cálculo dispersas, notas sueltas o cadenas de mensajes. Su objetivo es dar continuidad a todo el trabajo del proyecto dentro de una sola herramienta, desde la organización inicial hasta el seguimiento económico y la preparación de timesheets.

Actualmente tiene un enfoque **local-first**: guarda la información en el navegador mediante `localStorage`, funciona por proyectos y permite trabajar en **español, inglés y catalán**.

## Qué resuelve

SetLux convierte un flujo que normalmente vive repartido entre Excel, documentos, notas y mensajes en una metodología común y conectada. Ayuda a:

- centralizar condiciones, equipo y planificación
- reducir malentendidos y errores operativos
- dar claridad sobre el resultado económico del trabajo
- ahorrar tiempo de gestión fuera del rodaje
- mantener continuidad entre calendario, necesidades, reportes, nómina y timesheets

## Flujo principal

1. Crear un proyecto y definir su tipo de trabajo.
2. Completar los datos clave del proyecto.
3. Configurar condiciones laborales y económicas.
4. Definir el equipo por roles y grupos de trabajo.
5. Preparar el calendario de necesidades por semanas.
6. Registrar reportes a partir del plan y del equipo.
7. Revisar nóminas y generar timesheets por persona dentro del mismo flujo.

## Módulos

- **Proyectos**: creación, edición, filtrado y gestión del estado de cada proyecto.
- **Condiciones**: configuración económica por proyecto para modelos `semanal`, `mensual` y `diario` (publicidad).
- **Equipo**: gestión de roles, grupos base, prelight, pickup y refuerzos.
- **Calendario / Necesidades**: planificación semanal con jornadas, horarios, localizaciones, secuencias, festivos y asignación de personal.
- **Reportes**: seguimiento operativo del trabajo realizado, con continuidad respecto al plan y al equipo.
- **Nómina**: cálculo económico por persona según el tipo de proyecto.
- **Timesheet**: generación de partes de trabajo por persona, conectados con la información del proyecto y preparados dentro del mismo flujo operativo.
- **Perfil y ajustes**: idioma, tema visual y preferencias generales.

## Funcionalidades destacadas

- Gestión multi-proyecto.
- Flujo unificado entre proyecto, condiciones, equipo, calendario/necesidades, reportes, nómina y timesheets.
- Persistencia local con `localStorage`.
- Interfaz multidioma: `es`, `en`, `ca`.
- Tema claro/oscuro.
- Cálculos automáticos de conceptos laborales frecuentes.
- Validaciones para mantener coherencia entre equipo, planificación y reportes.
- Tutorial y ayudas de onboarding en la interfaz.

## Público principal

- **Gaffers y best boys**, que hoy son el usuario y cliente principal.
- **Técnicos de iluminación**, como usuarios actuales y clientes potenciales en el futuro.
- **Escuelas y entornos formativos**, como posible uso educativo e institucional.

SetLux se posiciona como una herramienta de nicho especializada en la organización del departamento de iluminación dentro de producciones audiovisuales.

## Stack técnico

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- i18next + react-i18next
- html2pdf.js
- html2canvas
- jsPDF
- pdfjs-dist
- Vitest + Testing Library

## Scripts

- `npm run dev` inicia el entorno de desarrollo.
- `npm run build` genera la build de producción.
- `npm run preview` sirve la build en local.
- `npm run test` ejecuta Vitest en modo interactivo.
- `npm run test:run` ejecuta los tests una vez.
- `npm run lint` ejecuta ESLint.
- `npm run lint:css` ejecuta Stylelint.
- `npm run format` aplica Prettier.
- `npm run quality` lanza lint, format check y tests.

## Estructura del proyecto

```text
src/
  app/          # app shell, rutas, layouts y providers
  features/     # módulos funcionales por dominio
  shared/       # componentes, hooks, servicios, constantes y utilidades
  locales/      # traducciones
  i18n/         # configuración de internacionalización
```
