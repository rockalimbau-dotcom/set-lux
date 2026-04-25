# SetLux product definition for Claude Design

Use this document as product context when asking Claude Design to create a new product design for SetLux.

The goal is **not** to redesign the current pages one by one. The goal is to help Claude understand what SetLux is, what it covers, what information must connect across the product, and what kind of interface the product needs. Claude should be free to propose a better information architecture, navigation model, screen structure, and user flow.

---

## Copy/paste prompt for Claude Design

You are designing **SetLux**, a specialized operations and payroll planning product for the lighting department in audiovisual productions.

Do **not** assume the current app’s pages, tabs, or user flow are correct. Use the product definition below to propose the best possible UX and visual design from first principles. You may reorganize, combine, split, rename, or re-sequence areas as long as every capability and dependency described below is supported.

SetLux is not a generic project manager, a generic HR tool, or a generic payroll app. It is a niche, production-specific tool used by **gaffers**, **best boys / best girls**, and lighting technicians to manage the full operational and economic lifecycle of a lighting department on a shoot: project setup, working conditions, crew, weekly calendar/needs, daily reports, payroll calculations, and worker timesheets.

Design for a professional user who works under time pressure, often around prep/shooting days, and needs dense but reliable information. The product should feel clear, operational, trustworthy, fast, and specialized for film/TV/commercial lighting work.

Important: SetLux must support high-density tables, weekly planning, day-by-day crew assignments, cost-impacting report entries, PDF exports, multilingual content, light/dark themes, and read-only closed projects. But do not make it feel like typical enterprise software. Avoid generic SaaS dashboards, admin panels, and spreadsheet-first desktop layouts that look powerful but feel heavy, cold, or corporate.

Design stance:

- **Simplicity first**: reduce visible complexity and reveal advanced details only when needed.
- **Cinema-oriented**: the product should feel connected to set work, lighting, shooting days, production binders, call sheets, and film craft — not generic HR, payroll, or enterprise planning software.
- **iPad-first**: design primarily for an iPad/tablet in landscape and portrait, with touch-friendly controls and workflows that work away from a desk. Desktop can provide more room, but must not be the primary mental model.
- **Light mode first**: default to a clean, bright, elegant light interface with neat, controlled color usage. Dark mode can exist as a secondary option, but the main design direction should be light, calm, and production-ready.
- **Elegant density**: support complex data without exposing all complexity at once. Use cards, progressive disclosure, focused editing, compact tables, and document-like layouts instead of enterprise dashboards.

---

## Product one-liner

**SetLux is an all-in-one local-first web app for managing the lighting department of audiovisual productions, connecting project data, working conditions, crew, calendar needs, daily reports, payroll, and timesheets in one coherent workflow.**

---

## Product category

SetLux sits between:

- production operations software
- crew scheduling and call/needs planning
- payroll estimation and wage breakdown tools
- departmental documentation/PDF generation
- field reporting for audiovisual shoots

It is intentionally specialized for the **lighting department** rather than for all production departments.

---

## Primary users

### Main users

- **Gaffer**: responsible for the lighting department, planning, communication with production/DoP, and reviewing economic impact.
- **Best boy / best girl electric**: operational manager of crew, logistics, preparation, equipment, reporting, and coordination.

### Secondary users

- Lighting technicians who need clarity on schedules, work records, and pay.
- Production teams receiving PDFs, calendars, reports, payroll summaries, and timesheets.
- Schools or training environments that may use the app to teach production planning.

---

## Core job to be done

“When I manage the lighting department of a production, I need one place to define conditions, organize my crew, plan each week, track what actually happened, understand payroll impact, and produce documents for production and workers, so I do not depend on disconnected spreadsheets, notes, messages, and manual calculations.”

---

## Design north star

SetLux should feel like:

- **A clean iPad production binder for the lighting department**
- **A cinema-oriented field tool**
- **A calculation-aware planning tool**
- **A PDF/document generator**
- **A trustworthy operational record**

The UX should prioritize:

1. Reducing visible complexity and manual repetition.
2. Keeping data connected across modules.
3. Making dense data understandable without making the app feel like enterprise software.
4. Preventing costly payroll/reporting mistakes.
5. Making exports easy and credible.
6. Supporting fast touch-first field edits without losing structure.
7. Feeling like a tool made for cinema production, not an office dashboard.

---

## Product scope: what SetLux covers

### 1. Project portfolio

Users manage multiple audiovisual projects.

Each project can include:

- Project name
- DoP
- Gaffer
- Best boy / best girl
- Warehouse
- Production company
- Production manager
- Transport contact/manager
- Locations contact/manager
- Production coordinator
- Status: active or closed
- Working condition type:
  - weekly
  - monthly
  - daily / advertising-style work
- Country and region, used for holiday logic
- Project language: Spanish, Catalan, or English

Portfolio needs include:

- Create, edit, delete projects
- Search and filter projects
- Distinguish active vs closed projects
- Export a global project calendar view
- Enter a project and continue its operational workflow

Design note: Claude should not assume a simple card grid is enough. A project portfolio may need calendar awareness, status, production dates, missing setup warnings, and quick access to documents.

---

### 2. Project status and read-only behavior

Projects can be **active** or **closed**.

- Active projects are editable.
- Closed projects should become effectively read-only.
- Closed projects still need to be reviewable and exportable.
- Reopening/reactivating should be possible but deliberate.

Design implication: The UI needs a clear state model for “active work” vs “archived record”.

---

### 3. Working conditions / economic rules

SetLux lets users define the economic and labor rules for the project. These conditions feed downstream calculations in reports and payroll.

Supported condition modes:

#### Weekly conditions

Used when rates and rules are based on weekly work.

#### Monthly conditions

Used when rates and rules are based on monthly work.

#### Daily / advertising conditions

Used for commercial or daily-rate style projects.

Conditions include:

- Calculation parameters
- Role-based price tables
- Base team prices
- Optional prelight team prices
- Optional pickup/recogida team prices
- Reinforcement/refuerzo prices where applicable
- Extra day / holiday multipliers
- Extra hour multipliers
- Turnaround rules
- Night shift rules
- Courtesy minutes
- Travel day rules
- Diets/per diems
- Meals: breakfast, lunch, dinner
- Accommodation/pernocta
- Pocket expenses
- Transport and mileage
- Loading/unloading
- Technical location / localización técnica
- Preparation, assembly, disassembly concepts
- Pre-production rights/expectations
- Legal/convention text
- Holidays text based on project country/region/year
- Custom text sections
- Selective PDF export of condition sections

Important product dependency:

**Conditions are not just static notes. They feed report calculations and payroll calculations.**

Design implication:

- Conditions need to be editable but trustworthy.
- Users need confidence about which values are driving payroll.
- Defaults can exist, but users must be able to review and override.
- The UI should make “this affects calculations” very clear.

---

### 4. Crew / team management

SetLux manages the lighting crew for the project.

Team groups include:

- Base team
- Reinforcements / extra crew
- Prelight team
- Pickup / recogida team

Daily / advertising projects may use a simplified team structure where reinforcements/timesheet behavior differs.

Each crew member can include:

- Role
- Custom role label
- Role ID / catalog identity
- Name and surname
- Gendered role label support where relevant
- Stable person identity across groups
- Source group: base, reinforcement, prelight, pickup

Role examples include:

- Gaffer
- Best Boy Electric / Best Girl Electric
- Rigging Gaffer
- Rigging Best Boy / Best Girl
- Rigging electrician
- Electrician
- Desk/console technician
- Finger boy / finger girl
- Auxiliary electrician
- Trainee / meritorio
- Generator operator / grupista
- Driver electrician
- Power electrician
- Practical lights technician
- Custom project-specific roles

Important product dependency:

**The crew list feeds the calendar, reports, payroll, and timesheets.**

Design implication:

- Crew editing should be simple, but identity and role consistency matter.
- Custom role labels should not break downstream planning/payroll.
- The UI must support duplicate names, same person in multiple groups, and role variants.
- Crew exports to PDF are part of the product.

---

### 5. Calendar / needs planning

This is one of the densest and most important areas.

SetLux plans the project week by week. It separates:

- Preproduction weeks
- Production/shooting weeks

Each week has seven day columns, Monday through Sunday.

For each day, the user can define:

- Date
- Location and sequences
- Shooting day number
- Day type / jornada type, such as:
  - shooting / rodaje
  - holiday shooting / rodaje festivo
  - rest / descanso
  - end / fin
  - office
  - camera tests
  - loading
  - unloading
  - location scout / localizar
  - travel day
  - half day
- Base crew assigned that day
- Start/end schedule for base crew
- Reinforcements / extra crew, possibly with different schedules
- Prelight crew and schedules
- Pickup crew and schedules
- Transport needs
- Extra transport
- Groups
- Cranes
- Base lighting material needs
- Extra material and extra material time
- Precall
- Notes/observations
- Custom rows
- Attachments are planned/beta for images/files such as lighting diagrams or technical location references

Calendar capabilities include:

- Add, duplicate, delete weeks
- Change week start date
- Collapse/expand weeks and sections
- Select rows/days for export
- Swap day columns between weeks/days
- Hide empty rows for cleaner export
- Import a shooting plan PDF and preview detected weeks before confirming
- Handle import conflicts by importing, overwriting, or omitting weeks
- Export:
  - individual week PDFs
  - all weeks PDFs
  - preproduction-only PDFs
  - production-only PDFs
  - calendar-style PDF views

Important product dependency:

**Calendar/needs data feeds reports, payroll, and timesheets.**

Design implication:

- This area needs excellent table design.
- Horizontal and vertical scrolling must be handled intentionally.
- Sticky headers/columns may be necessary.
- Empty states should guide users toward adding weeks and team.
- Calendar import should feel safe because it can overwrite data.
- The user may need both “planning overview” and “detailed editable grid”.

---

### 6. Reports

Reports capture what actually happened and the cost-impacting concepts for each person and day.

Reports are generated from:

- Calendar weeks
- Assigned crew
- Project conditions

Reports can be grouped by month for weekly/monthly projects, and shown week-by-week for daily/advertising projects.

Report controls include:

- Date range from/to
- Extra-hour calculation method:
  - normal extra hours
  - minutage from camera cut
  - minutage plus courtesy
- Month PDF export
- Week PDF export

Per person/day reporting concepts include:

- Extra hours
- Turnaround
- Night shift
- Penalty lunch
- Own material
- Diets/per diems
- Mileage
- Gasoline
- Transport
- Ticket/receipt attachment planned/beta

Reports also display or derive:

- Planned schedule for each crew block
- Base team schedule
- Prelight schedule
- Pickup schedule
- Extra crew / different schedule blocks
- Rest/off days
- Collapsible person rows
- Auto-calculated values where possible

Important product dependency:

**Reports feed payroll calculations.**

Design implication:

- Reports need to feel like a controlled daily record, not just a spreadsheet.
- Users must understand which entries are manual vs automatically derived.
- The relationship between planned schedule, actual report, and payroll impact should be visible.

---

### 7. Payroll / nómina

SetLux calculates and visualizes what each crew member should earn based on:

- Project mode: weekly, monthly, or daily/advertising
- Conditions/rates
- Calendar assignment
- Reports
- Extra hours
- Diets
- Transport
- Mileage
- Gasoline
- Own material
- Holidays
- Travel days
- Half days
- Loading/unloading
- Technical location days

Payroll views include:

- Person rows
- Worked days
- Total days
- Worked shifts/jornadas
- Half days
- Holiday days
- Travel days
- Extra hours
- Diets
- Own material
- Transport
- Mileage
- Gasoline
- Gross total
- Optional tax/net columns:
  - IRPF percentage
  - state percentage
  - net total
- Mark payroll as received
- Notes/incidents
- Export monthly payroll PDF
- “Understand payroll” guide/legend explaining categories

Important product dependency:

**Payroll is the economic result of conditions + calendar + reports.**

Design implication:

- Payroll should be auditable: users need to see why a number exists.
- Missing data should be visible and actionable.
- Calculation confidence is more important than visual decoration.

---

### 8. Timesheets

SetLux generates individual weekly timesheets for workers.

Timesheets are based on:

- Calendar weeks
- Assigned worker
- Project/company data
- Report data for diets/catering logic

Timesheet content includes:

- Week selector
- Worker selector
- Worker DNI
- Worker social security number
- Company name
- Company address
- Company CIF/tax ID
- Company social security account
- Daily rows:
  - day
  - date
  - from
  - to
  - total hours
  - catering yes/no
  - city/location
  - notes
- Weekly total hours
- Production manager signature area
- Production coordinator signature area
- Employee signature area
- Legal notice
- PDF export

Current product behavior: Timesheets are primarily present for weekly/monthly-style project flows. Daily/advertising projects may require a different treatment or may not need the same timesheet phase. Claude should not blindly copy this; it should design the best model and flag any assumption.

---

### 9. Exports and documents

PDF export is a core part of the product, not a secondary feature.

SetLux exports:

- Conditions PDFs
- Crew/team PDFs
- Calendar/needs PDFs
- Global project calendar PDFs
- Reports PDFs
- Payroll PDFs
- Timesheet PDFs

Exports are used to communicate with production, keep records, and share official-looking documents.

Design implication:

- Export actions should be easy to find but not clutter the editing UI.
- Users may need export previews, export scope selection, and export status feedback.
- PDF outputs should feel professional and production-ready.

---

### 10. Account, settings, and preferences

The product includes:

- Login/register concepts
- User profile
- Settings
- Theme preference: light/dark
- Language preference: Spanish, Catalan, English
- Gender preference for role wording
- Tutorial/onboarding access
- Suggestion/feedback floating action

Design implication:

- Account/settings should support the product but not dominate it.
- Language and role label behavior are important because the product is used in multilingual production environments.

---

## Data relationships Claude must preserve

These relationships are the backbone of the product:

1. **Project metadata** appears in headers, exports, calendars, payroll, and timesheets.
2. **Project country/region** determines holiday logic.
3. **Project language** determines labels and exported document language.
4. **Conditions** define calculation rules and prices.
5. **Crew/team** provides people and roles for planning.
6. **Calendar/needs** assigns people to days and defines schedules/logistics.
7. **Reports** record actual cost-impacting events from the planned work.
8. **Payroll** calculates money from conditions + calendar + reports.
9. **Timesheets** derive weekly worker records from calendar/report data.
10. **Closed projects** remain reviewable/exportable but should not be casually editable.

If Claude proposes a new flow, it must explain how these dependencies remain clear.

---

## Key UX problems to solve

### Dense data without chaos

The product has many spreadsheet-like grids. The design must handle density without becoming unreadable.

Consider:

- Sticky headers
- Frozen first columns
- Section collapse
- Focus modes
- Search/filter within long tables
- Smart empty states
- Bulk actions
- “Only show relevant rows”
- Visual day-type coloring
- Compact vs comfortable density modes

Important: dense does **not** mean enterprise-looking. Claude should explore simpler interaction patterns such as week cards, day sheets, inspector panels, expandable sections, focused edit modes, and document-like previews. Tables are allowed where they are genuinely useful, but the product should not default to a desktop spreadsheet/dashboard aesthetic.

### iPad-first simplicity

The primary design target should be an **iPad/tablet** used in production contexts, not a large desktop monitor.

Design implications:

- Touch targets must be comfortable.
- Primary actions should be reachable without precision mouse interaction.
- Landscape tablet should be excellent for weekly planning.
- Portrait tablet should still allow review, editing, and exports.
- Desktop layouts can expand horizontally, but should not become a cluttered dashboard.
- Mobile phones can be supported for quick review or lightweight edits, but the main experience is iPad-first.
- Navigation should feel lightweight and spatial, more like a production binder or field app than an admin console.

### Progressive setup

A new project may have no conditions, no team, and no weeks. The product should guide users to prepare the minimum viable setup.

Possible setup dependencies:

1. Project info
2. Conditions
3. Team
4. Calendar
5. Reports
6. Payroll/timesheets

But Claude should decide whether this should be a wizard, checklist, dashboard, guided cards, or another model.

### Trust in calculations

Users need to trust payroll outputs.

The design should help answer:

- Which condition/rate was used?
- Which report entry caused this amount?
- Which day/week contributed to this total?
- What is missing before payroll is reliable?

### Export-first workflows

Many workflows end in PDFs. Design should make exports feel intentional:

- Export scope
- Selection of rows/days/sections
- Preview or confirmation
- Generated document naming
- Clear distinction between internal editing and external document output

### Active production pressure

Users may edit data quickly during prep or after a shooting day. The UI should reduce mistakes:

- Clear save/persistence feedback
- Low-friction editing
- Undo/confirmation for destructive actions
- Conflict warnings for imports
- Strong empty/missing-data states

---

## Visual and brand context

Existing brand signals:

- Name: **SetLux**
- Tagline: **All in One**
- Domain feel: lighting, set work, technical craft, production coordination
- Typography currently uses Poppins/Inter/system fonts
- Current brand colors include:
  - Blue: `#0476D9`
  - Orange: `#F27405` / `#F59E0B`
  - Dark navy background: `#1A2B40`
  - Dark panel: `#2A4058`
  - Light warm background: `#FFF7ED`
- Product supports both light and dark themes.
- Existing logo assets are in `public/`, including light/dark SetLux logos and module icons.

Claude can evolve the visual design, but it should preserve the general idea of a professional lighting-production tool with blue/orange SetLux identity.

Preferred visual direction:

- **Light mode as the primary design**.
- Clean, neat, warm, cinema-friendly colors.
- Controlled accents rather than large saturated dashboard panels.
- A sense of film production craft: call sheets, production binders, camera/lighting prep, technical notes, set logistics.
- Calm surfaces, clear hierarchy, and strong readability under real working conditions.
- Touch-friendly cards, sheets, segmented controls, bottom/side inspectors, and document previews.
- Use color meaningfully for day types, statuses, warnings, and calculation confidence.
- Dark mode can be a polished secondary theme for low-light environments, but should not define the core design.

Avoid:

- Typical enterprise software UI
- Dense desktop admin dashboards
- Generic spreadsheet-first layouts
- Generic finance SaaS visuals
- Generic HR dashboard visuals
- Overly playful startup UI
- Marketing-site-first design that ignores dense production workflows

---

## Recommended design deliverables from Claude

Ask Claude Design to produce:

1. A proposed information architecture.
2. The main navigation model.
3. A project dashboard concept showing setup/completion status.
4. A redesigned project workflow that covers all product areas.
5. Key screens/states for:
   - project portfolio
   - project overview/setup
   - conditions
   - crew
   - calendar/needs
   - reports
   - payroll
   - timesheets
   - exports/documents
   - settings/profile
6. Empty states and missing-data states.
7. Read-only closed-project states.
8. iPad-first tablet behavior for dense planning/reporting work, plus how the layout adapts to desktop and phone.
9. A visual system:
   - colors
   - typography
   - spacing
   - cards
   - tables
   - forms
   - status badges
   - export controls
   - warning/confirmation modals
10. Explanation of how data dependencies are represented visually.

---

## Glossary

- **Gaffer**: Head of the lighting department.
- **Best boy / best girl electric**: Lighting department operations lead/assistant to gaffer.
- **Prelight**: Lighting work before the shoot day.
- **Pickup / recogida**: Pickup/wrap/collection work.
- **Refuerzo**: Reinforcement/extra crew.
- **Jornada**: Workday or type of day.
- **Rodaje**: Shooting day.
- **Rodaje festivo**: Shooting on a holiday.
- **Turnaround**: Required rest time between workdays.
- **Dieta**: Per diem/meal allowance.
- **Pernocta**: Overnight stay/accommodation.
- **Nómina**: Payroll/wage calculation.
- **Timesheet**: Worker time record for a week.
- **Plan de rodaje**: Shooting plan.

---

## Final instruction to Claude

Design SetLux as a serious, specialized operational tool for lighting departments. You are allowed to rethink the product structure completely, but your design must support every capability above and make the data connections obvious. Prioritize usability for dense real-world production data over decorative dashboards.
