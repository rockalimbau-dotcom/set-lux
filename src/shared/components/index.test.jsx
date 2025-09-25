import { describe, it, expect } from 'vitest';

describe('shared/components/index', () => {
  describe('exports', () => {
    it('exports all components', async () => {
      const components = await import('./index.ts');
      
      // Check that all expected components are exported
      expect(components.Button).toBeDefined();
      expect(components.Input).toBeDefined();
      expect(components.Select).toBeDefined();
      expect(components.TextArea).toBeDefined();
      expect(components.Chip).toBeDefined();
      expect(components.LogoSetLux).toBeDefined();
      expect(components.BrandHero).toBeDefined();
      expect(components.ToggleIconButton).toBeDefined();
    });

    it('exports component variants and sizes', async () => {
      const components = await import('./index.ts');
      
      // Check Button exports
      expect(components.ButtonVariants).toBeDefined();
      expect(components.ButtonSizes).toBeDefined();
      
      // Check Input exports
      expect(components.InputVariants).toBeDefined();
      expect(components.InputSizes).toBeDefined();
      
      // Check Select exports
      expect(components.SelectSizes).toBeDefined();
      
      // Check TextArea exports
      expect(components.TextAreaVariants).toBeDefined();
      expect(components.TextAreaSizes).toBeDefined();
    });

    it('exports TableCells components and types', async () => {
      const components = await import('./index.ts');
      
      // Check TableCells exports
      expect(components.Th).toBeDefined();
      expect(components.Td).toBeDefined();
      expect(components.Row).toBeDefined();
      expect(components.TableAlign).toBeDefined();
      expect(components.TableVariant).toBeDefined();
    });

    it('exports are functions or objects', async () => {
      const components = await import('./index.ts');
      
      // Components should be functions or objects (for React.memo components)
      expect(typeof components.Button).toBe('function');
      expect(typeof components.Input).toBe('function');
      expect(typeof components.Select).toBe('function');
      expect(typeof components.TextArea).toBe('function');
      expect(typeof components.Chip).toBe('function');
      expect(typeof components.LogoSetLux).toBe('function');
      expect(typeof components.BrandHero).toBe('object'); // React.memo returns an object
      expect(typeof components.ToggleIconButton).toBe('function');
      
      // TableCells components should be functions
      expect(typeof components.Th).toBe('function');
      expect(typeof components.Td).toBe('function');
      expect(typeof components.Row).toBe('function');
      
      // Variants and sizes should be objects
      expect(typeof components.ButtonVariants).toBe('object');
      expect(typeof components.ButtonSizes).toBe('object');
      expect(typeof components.InputVariants).toBe('object');
      expect(typeof components.InputSizes).toBe('object');
      expect(typeof components.SelectSizes).toBe('object');
      expect(typeof components.TextAreaVariants).toBe('object');
      expect(typeof components.TextAreaSizes).toBe('object');
    });
  });

  describe('ButtonVariants', () => {
    it('has correct variant values', async () => {
      const { ButtonVariants } = await import('./index.ts');
      
      expect(ButtonVariants.PRIMARY).toBe('primary');
      expect(ButtonVariants.SECONDARY).toBe('secondary');
      expect(ButtonVariants.DANGER).toBe('danger');
      expect(ButtonVariants.GHOST).toBe('ghost');
      expect(ButtonVariants.EXPORT).toBe('export');
      expect(ButtonVariants.EXPORT_ORANGE).toBe('export-orange');
      expect(ButtonVariants.REMOVE).toBe('remove');
      expect(ButtonVariants.DUPLICATE).toBe('duplicate');
    });
  });

  describe('ButtonSizes', () => {
    it('has correct size values', async () => {
      const { ButtonSizes } = await import('./index.ts');
      
      expect(ButtonSizes.SM).toBe('sm');
      expect(ButtonSizes.MD).toBe('md');
      expect(ButtonSizes.LG).toBe('lg');
    });
  });

  describe('InputVariants', () => {
    it('has correct variant values', async () => {
      const { InputVariants } = await import('./index.ts');
      
      expect(InputVariants.DEFAULT).toBe('default');
      expect(InputVariants.ERROR).toBe('error');
    });
  });

  describe('InputSizes', () => {
    it('has correct size values', async () => {
      const { InputSizes } = await import('./index.ts');
      
      expect(InputSizes.SM).toBe('sm');
      expect(InputSizes.MD).toBe('md');
      expect(InputSizes.LG).toBe('lg');
    });
  });

  describe('SelectSizes', () => {
    it('has correct size values', async () => {
      const { SelectSizes } = await import('./index.ts');
      
      expect(SelectSizes.SM).toBe('sm');
      expect(SelectSizes.MD).toBe('md');
      expect(SelectSizes.LG).toBe('lg');
    });
  });

  describe('TextAreaVariants', () => {
    it('has correct variant values', async () => {
      const { TextAreaVariants } = await import('./index.ts');
      
      expect(TextAreaVariants.DEFAULT).toBe('default');
      expect(TextAreaVariants.ERROR).toBe('error');
    });
  });

  describe('TextAreaSizes', () => {
    it('has correct size values', async () => {
      const { TextAreaSizes } = await import('./index.ts');
      
      expect(TextAreaSizes.SM).toBe('sm');
      expect(TextAreaSizes.MD).toBe('md');
      expect(TextAreaSizes.LG).toBe('lg');
    });
  });

  describe('TableAlign', () => {
    it('has correct align values', async () => {
      const { TableAlign } = await import('./index.ts');
      
      expect(TableAlign.LEFT).toBe('left');
      expect(TableAlign.CENTER).toBe('center');
      expect(TableAlign.RIGHT).toBe('right');
    });
  });

  describe('TableVariant', () => {
    it('has correct variant values', async () => {
      const { TableVariant } = await import('./index.ts');
      
      expect(TableVariant.DEFAULT).toBe('default');
      expect(TableVariant.WIDE).toBe('wide');
    });
  });

  describe('import compatibility', () => {
    it('can be imported as default export', async () => {
      const components = await import('./index.ts');
      
      // Should be able to access all exports
      expect(Object.keys(components).length).toBeGreaterThan(0);
    });

    it('can be imported with named imports', async () => {
      const { Button, Input, Select, TextArea } = await import('./index.ts');
      
      expect(Button).toBeDefined();
      expect(Input).toBeDefined();
      expect(Select).toBeDefined();
      expect(TextArea).toBeDefined();
    });

    it('can be imported with mixed imports', async () => {
      const { 
        Button, 
        ButtonVariants, 
        Input, 
        InputSizes,
        Select,
        SelectSizes,
        TextArea,
        TextAreaVariants,
        Chip,
        LogoSetLux,
        BrandHero,
        ToggleIconButton,
        Th,
        Td,
        Row,
        TableAlign,
        TableVariant
      } = await import('./index.ts');
      
      // All imports should be defined
      expect(Button).toBeDefined();
      expect(ButtonVariants).toBeDefined();
      expect(Input).toBeDefined();
      expect(InputSizes).toBeDefined();
      expect(Select).toBeDefined();
      expect(SelectSizes).toBeDefined();
      expect(TextArea).toBeDefined();
      expect(TextAreaVariants).toBeDefined();
      expect(Chip).toBeDefined();
      expect(LogoSetLux).toBeDefined();
      expect(BrandHero).toBeDefined();
      expect(ToggleIconButton).toBeDefined();
      expect(Th).toBeDefined();
      expect(Td).toBeDefined();
      expect(Row).toBeDefined();
      expect(TableAlign).toBeDefined();
      expect(TableVariant).toBeDefined();
    });
  });
});
