# SetLux – All in One

**SetLux** es una plataforma integral para la gestión del departamento de iluminación en producciones audiovisuales. Centraliza planificación, equipo, condiciones, reportes y nóminas en un flujo único, evitando hojas de cálculo dispersas y cálculos manuales.

Está diseñada **para gaffers y best boys** que necesitan control operativo y claridad económica del trabajo del equipo. SetLux funciona como una herramienta **local‑first**: los datos se guardan en el navegador (localStorage), con soporte multi‑proyecto e interfaces en **español, inglés y catalán**.

---

## Qué es y qué resuelve

SetLux digitaliza el ciclo completo del departamento de iluminación:

- Estructura equipos por roles, base/prelight/pickup y refuerzos.
- Planifica el calendario de rodaje por semanas con validaciones y festivos.
- Define condiciones laborales y precios por tipo de producción.
- Registra reportes semanales con extras, dietas y conceptos automáticos.
- Calcula nóminas con desglose por persona y exportaciones profesionales.

**Problemas que resuelve para gaffers y best boys**

- Información dispersa entre Excel, notas y mensajes.
- Malentendidos sobre condiciones laborales.
- Falta de claridad en el resultado económico del equipo.
- Tiempo excesivo dedicado a tareas organizativas.

**Valor generado**

- Centralización de condiciones y datos del equipo.
- Reducción de malentendidos y errores operativos.
- Visión clara del resultado económico del trabajo.
- Ahorro de horas de gestión fuera del rodaje.
- Mayor control y tranquilidad para el jefe de iluminación.

---

## Cómo funciona (flujo recomendado)

1. **Crear un proyecto** y configurar sus datos generales.
2. **Definir el equipo** por roles y grupos (base, prelight, pickup, refuerzos).
3. **Configurar condiciones** (semanal, mensual o publicidad) con precios y parámetros.
4. **Planificar calendario/needs** por semanas, con importación opcional desde PDF.
5. **Registrar reportes** semanales con horas extra, dietas, nocturnidad y turn around.
6. **Generar nómina** con cálculo automático y exportaciones en PDF.

---

## Módulos principales

- **Proyectos**: vista general, estados, búsqueda y filtros.
- **Equipo**: roles, miembros, grupos y sincronización con planificación y nómina.
- **Calendario / Necesidades**: planificación por semanas, jornadas, horarios, festivos y exportación; incluye importación de planificación desde PDF.
- **Condiciones**: gestión de precios y parámetros para producciones semanales, mensuales y de publicidad; exportación a PDF multi‑idioma.
- **Reportes**: registro de conceptos por semana, validaciones y cálculos automáticos.
- **Nómina**: cálculo detallado por persona (días, extras, dietas, conceptos específicos) con salida profesional.
- **Perfil y ajustes**: idioma, tema claro/oscuro y preferencias.

---

## Funcionalidades destacadas

- **Local‑first**: datos persistidos en `localStorage` sin backend.
- **Multi‑idioma**: ES/EN/CA con cambio en tiempo real.
- **Exportación PDF**: documentos profesionales para planificación, condiciones, reportes y nóminas.
- **Automatización**: cálculo de horas extra, nocturnidad, turn around y dietas.
- **Validaciones**: evita registros inconsistentes con la planificación.
- **Onboarding**: tutorial guiado en la interfaz.
- **Tema claro/oscuro** y diseño responsive.

---

## Tecnologías

- **Frontend**: React 19 + TypeScript
- **Build**: Vite
- **Estilos**: Tailwind CSS
- **Routing**: React Router
- **i18n**: i18next + react‑i18next
- **PDF**: html2pdf.js, html2canvas, jsPDF, pdfjs‑dist
- **Markdown**: marked
- **Testing**: Vitest + Testing Library
- **Analytics**: Vercel Analytics (opcional en runtime)

---

## Scripts útiles

- `npm run dev` – entorno de desarrollo
- `npm run build` – build de producción
- `npm run test` – pruebas
- `npm run lint` – lint JS/TS
- `npm run lint:css` – lint CSS
- `npm run format` – formateo

---

## Estructura del proyecto

```
src/
  app/            # layouts, providers y router
  features/       # módulos funcionales por dominio
  shared/         # componentes, hooks, servicios y utils
  locales/        # traducciones ES/EN/CA
  i18n/           # configuración de internacionalización
```

---

## Público objetivo y evolución

- **Gaffers y Best Boys**: cliente y usuario coinciden hoy.
- **Técnicos de iluminación**: usuarios actuales que se convierten en clientes en el futuro.
- **Escuelas audiovisuales**: cliente institucional futuro para uso formativo con estudiantes.

Mercado: nicho altamente especializado del departamento de iluminación.

--- 

## Propuesta de valor ampliada

**Para gaffers y best boys**  
SetLux organiza y centraliza la información clave del departamento de iluminación, permitiendo controlar condiciones, trabajo y resultado económico desde un único lugar.

**Para técnicos (usuarios hoy, clientes mañana)**  
Aporta una estructura común y clara para entender condiciones, trabajo y resultado económico, reduciendo fricción y malentendidos.

**Para escuelas (cliente futuro)**  
Funciona como herramienta formativa aplicada, enseñando la organización real del departamento y su impacto operativo y económico.

--- 

## Canales y relación con clientes

- **Canales prioritarios**: boca a boca profesional, uso real en rodajes, recomendación dentro de equipos de iluminación.
- **Canales de visibilidad**: Instagram propio y especializado, podcasts y medios del sector, eventos y networking audiovisual.
- **Relación**: onboarding rápido con tutorial, soporte especializado, feedback directo y continuidad entre proyectos.

--- 

## Modelo de ingresos

- Suscripción mensual y anual (profesional).
- Plan Student.
- Licencias educativas.
- Freemium en fase inicial.

---

**SetLux – All in One**
La solución completa para la gestión del departamento de iluminación.
