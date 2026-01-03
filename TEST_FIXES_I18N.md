# Fixes para Tests después de implementar i18n

## Problema
Los tests están fallando porque buscan textos hardcodeados en español, pero ahora la aplicación usa traducciones.

## Solución
Actualizar los tests para que busquen:
1. Las claves de traducción (ej: `common.newProject`)
2. Los textos traducidos en español (ya que los tests se ejecutan con el idioma por defecto)
3. Usar `getByText` con regex o funciones de matcher más flexibles

## Tests que necesitan actualización

### 1. ProjectsScreen.test.jsx
- `'Nuevo proyecto'` → `t('common.newProject')` o buscar el texto traducido
- `'Semanal'` → `t('common.weekly')` o buscar el texto traducido
- `'Mensual'` → `t('common.monthly')` o buscar el texto traducido
- `'Editar'` → `t('common.edit')` o buscar el texto traducido
- `'Cancelar'` → `t('common.cancel')` o buscar el texto traducido

### 2. Chip.test.jsx
- `'Quitar'` → `t('needs.remove')` o buscar el texto traducido

### 3. ReportesTab.test.jsx
- `'Configura el proyecto'` → `t('reports.configureProject')` o buscar el texto traducido
- `'Semana 1'` → `t('planning.weekFormat', { number: 1 })` o buscar el texto traducido

### 4. NecesidadesTab.test.jsx
- `'No hay semanas en Planificación'` → `t('needs.noWeeksInPlanning')` o buscar el texto traducido

### 5. export.test.jsx (necesidades)
- `'Necesidades - Producción'` → `t('needs.shootingNeeds') + ' - ' + t('needs.production')` o buscar el texto traducido

## Opciones de implementación

### Opción 1: Buscar textos traducidos (más simple)
```javascript
// En lugar de:
screen.getByText('Nuevo proyecto')

// Usar:
screen.getByText(/Nuevo proyecto/i) // regex flexible
// o
screen.getByText((content, element) => {
  return content.includes('Nuevo proyecto') || 
         element?.textContent?.includes('Nuevo proyecto');
})
```

### Opción 2: Usar claves de traducción directamente
```javascript
// Importar i18n en el test
import i18n from '@i18n/config';

// Usar:
screen.getByText(i18n.t('common.newProject'))
```

### Opción 3: Mock de i18n en setup.ts
```typescript
// En src/test/setup.ts
import { vi } from 'vitest';

// Mock i18n para que siempre devuelva las claves
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Devuelve la clave directamente
    i18n: {
      language: 'es',
      changeLanguage: vi.fn(),
    },
  }),
}));
```

## Recomendación
Usar la **Opción 3** (mock en setup.ts) porque:
- Es la más simple de implementar
- No requiere cambiar cada test individual
- Los tests seguirán funcionando con las claves de traducción
- Es más mantenible

