# SetLux Beta – Proyecto (React + Vite + TypeScript)

## Estructura del proyecto

```
src/
  app/               # Layouts, routing, providers
  features/          # Módulos por dominio (Feature-Sliced)
    planificacion/
    reportes/
    nomina/
    necesidades/
    equipo/
    condiciones/
  shared/            # Reutilizables: componentes, hooks, servicios, utils
  types/             # Tipos globales
```

Convenciones clave por módulos:
- Cada feature contiene `pages`, `components`, `utils`, `hooks` y `tests` relacionados.
- `shared/` expone utilidades puras y componentes reutilizables.

## TypeScript y estándares
- Todo el código migrado a TS/TSX.
- Sin `any` implícitos en APIs públicas y componentes exportados.
- Reglas de estilo: nombres descriptivos, funciones con early-returns, evitar nesting profundo.

## Tests (Vitest)
- Cobertura completa de unidades e integración con Vitest + Testing Library.
- Ubicación: junto al archivo (`*.test.*`).
- Comandos:
  - `npm test` ejecuta la suite.

## Capa de servicios (Data access)
- `src/shared/services/localStorage.service.ts` centraliza acceso a `localStorage`:
  - `getString`, `setString`, `remove`, `getJSON<T>`, `setJSON`.
- Todos los usos de almacenamiento pasan por este servicio.

## Rendimiento (listas pesadas)
- Uso de `React.memo`, `useMemo`, `useCallback` en componentes clave:
  - `ReportPersonRows`, `PlanScopeSection`, `WeekCard`, `ProjectsScreen`, `MonthSection`, `NecesidadesTab`, etc.

## Accesibilidad (A11y)
- Landmarks y navegación:
  - Skip link en `App.tsx` y landmark `<main id="main-content" role="main">`.
- Formularios y controles:
  - Labels asociadas (visibles u ocultas `sr-only`), `aria-label` donde aplica.
- Contenido colapsable:
  - Botones con `aria-expanded`/`aria-controls`; paneles con `role="region"` + `id` y gestión de foco al abrir.
- Tablas:
  - `scope="col"` en cabeceras y `scope="row"` en celdas de fila.

## Tokens de tema (Tailwind)
- Definidos en `tailwind.config.js`:
  - `brand`: paleta principal
  - `accent`: `#F59E0B`
  - `neutral`: `{ bg, panel, border, text, surface }` (incluye `surface: #141414`)
- Utilidades de ejemplo:
  - Borde destacado: `hover:border-accent`
  - Texto destacado: `text-accent`
  - Superficie neutra: `bg-neutral-surface`

## Configuración de APIs

### DeepL API (Traducción automática)
Para habilitar la traducción automática de textos en los textareas de condiciones:

1. Obtén tu API key gratuita en: https://www.deepl.com/pro-api
2. Plan gratuito: 500,000 caracteres/mes
3. Crea un archivo `.env` en la raíz del proyecto:
   ```
   VITE_DEEPL_API_KEY=tu_api_key_aqui
   ```
4. Reinicia el servidor de desarrollo

**Nota:** Si no se configura la API key, la funcionalidad de traducción estará deshabilitada y el botón de traducir no aparecerá.

## Scripts
- `npm run dev` – servidor de desarrollo (Vite)
- `npm run build` – build producción
- `npm test` – tests (Vitest)

## Contribución
- Mantener consistencia de tipos y accesibilidad en nuevos componentes.
- Preferir utilidades de tema en lugar de colores hardcodeados.
- Asegurar pruebas y linting sin errores antes de subir cambios.
