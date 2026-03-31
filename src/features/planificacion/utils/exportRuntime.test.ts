import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  installExportCSS,
  ensureExportDiv,
  waitForStylesToApply,
  waitForFonts,
} from './exportRuntime.ts';

// Mock DOM APIs
const mockDocument = {
  getElementById: vi.fn(),
  createElement: vi.fn(),
  head: { appendChild: vi.fn() },
  body: { appendChild: vi.fn() },
  fonts: { ready: Promise.resolve() },
};

const mockElement = {
  id: '',
  textContent: '',
  style: {},
  setAttribute: vi.fn(),
};

// Mock global document
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));

describe('exportRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocument.getElementById.mockReturnValue(null);
    mockDocument.createElement.mockReturnValue(mockElement);
    mockDocument.fonts = { ready: Promise.resolve() };
  });

  afterEach(() => {
    // Clean up any created elements
    if (global.document.getElementById) {
      const styleEl = global.document.getElementById('export-style');
      const divEl = global.document.getElementById('export-layer');
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
      if (divEl && divEl.parentNode) {
        divEl.parentNode.removeChild(divEl);
      }
    }
  });

  describe('installExportCSS', () => {
    it('should create and install CSS styles when no existing style tag', () => {
      mockDocument.getElementById.mockReturnValue(null);
      mockDocument.createElement.mockReturnValue(mockElement);

      installExportCSS();

      expect(mockDocument.getElementById).toHaveBeenCalledWith('export-style');
      expect(mockDocument.createElement).toHaveBeenCalledWith('style');
      expect(mockElement.id).toBe('export-style');
      expect(mockElement.textContent).toContain('.export-doc');
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockElement);
    });

    it('should update existing style tag when found', () => {
      const existingStyle = { ...mockElement, id: 'export-style' };
      mockDocument.getElementById.mockReturnValue(existingStyle);

      installExportCSS();

      expect(mockDocument.getElementById).toHaveBeenCalledWith('export-style');
      expect(mockDocument.createElement).not.toHaveBeenCalled();
      expect(existingStyle.textContent).toContain('.export-doc');
      expect(mockDocument.head.appendChild).not.toHaveBeenCalled();
    });

    it('should include correct CSS rules', () => {
      mockDocument.getElementById.mockReturnValue(null);
      mockDocument.createElement.mockReturnValue(mockElement);

      installExportCSS();

      const css = mockElement.textContent;
      expect(css).toContain('.export-doc{font:14px/1.3 system-ui');
      expect(css).toContain('.export-doc h2{margin:12px 0 8px');
      expect(css).toContain('.export-doc .wk{break-after:page');
      expect(css).toContain('.export-doc table{width:100%');
      expect(css).toContain(
        '.export-doc th,.export-doc td{border:1px solid #222'
      );
      expect(css).toContain('.export-doc thead th{background:#eee}');
    });
  });

  describe('ensureExportDiv', () => {
    it('should create export div when none exists', () => {
      mockDocument.getElementById.mockReturnValue(null);
      mockDocument.createElement.mockReturnValue(mockElement);

      const result = ensureExportDiv();

      expect(mockDocument.getElementById).toHaveBeenCalledWith('export-layer');
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockElement.id).toBe('export-layer');
      expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockElement);
      expect(result).toBe(mockElement);
    });

    it('should return existing div when found', () => {
      const existingDiv = { ...mockElement, id: 'export-layer' };
      mockDocument.getElementById.mockReturnValue(existingDiv);

      const result = ensureExportDiv();

      expect(mockDocument.getElementById).toHaveBeenCalledWith('export-layer');
      expect(mockDocument.createElement).not.toHaveBeenCalled();
      expect(mockDocument.body.appendChild).not.toHaveBeenCalled();
      expect(result).toBe(existingDiv);
    });

    it('should apply correct styles to export div', () => {
      mockDocument.getElementById.mockReturnValue(null);
      mockDocument.createElement.mockReturnValue(mockElement);

      ensureExportDiv();

      expect(mockElement.style).toEqual({
        position: 'absolute',
        left: '-9999px',
        top: '0',
        width: '1240px',
        maxWidth: '1240px',
        opacity: '1',
        pointerEvents: 'none',
        background: '#ffffff',
        padding: '16px',
        zIndex: '2147483647',
      });
    });
  });

  describe('waitForStylesToApply', () => {
    it('should resolve after two animation frames', async () => {
      const promise = waitForStylesToApply();

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);

      // Simulate first animation frame
      const firstCallback = vi.mocked(global.requestAnimationFrame).mock
        .calls[0][0];
      firstCallback();

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(2);

      // Simulate second animation frame
      const secondCallback = vi.mocked(global.requestAnimationFrame).mock
        .calls[1][0];
      secondCallback();

      await promise;
      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(2);
    });
  });

  describe('waitForFonts', () => {
    it('should resolve immediately when document.fonts is not available', async () => {
      delete global.document.fonts;

      await expect(waitForFonts()).resolves.toBeUndefined();
    });

    it('should wait for fonts when document.fonts is available', async () => {
      const mockFontsReady = Promise.resolve();
      mockDocument.fonts = { ready: mockFontsReady };

      const promise = waitForFonts();

      await expect(promise).resolves.toBeUndefined();
    });

    it('should handle fonts.ready rejection gracefully', async () => {
      const mockFontsReady = Promise.reject(new Error('Font loading failed'));
      mockDocument.fonts = { ready: mockFontsReady };

      const promise = waitForFonts();

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('integration', () => {
    it('should work together for complete export setup', async () => {
      mockDocument.getElementById.mockReturnValue(null);
      mockDocument.createElement.mockReturnValue(mockElement);
      mockDocument.fonts = { ready: Promise.resolve() };

      // Install CSS
      installExportCSS();

      // Ensure export div
      const div = ensureExportDiv();

      // Wait for styles and fonts
      await waitForStylesToApply();
      await waitForFonts();

      expect(mockElement.id).toBe('export-layer');
      expect(mockElement.textContent).toContain('.export-doc');
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });
});
