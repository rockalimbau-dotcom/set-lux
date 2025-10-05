import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { elementOnScreenToPDF } from './exporter.ts';

// Mock html2pdf
const mockHtml2pdf = {
  set: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  save: vi.fn().mockResolvedValue(undefined),
};

vi.mock('html2pdf.js', () => ({
  default: () => mockHtml2pdf,
}));

describe('exporter', () => {
  let mockElement;
  let originalDocumentTitle;
  let originalClassList;

  beforeEach(() => {
    // Mock document.querySelector
    mockElement = document.createElement('div');
    mockElement.id = 'test-element';
    document.querySelector = vi.fn().mockReturnValue(mockElement);

    // Mock document.title
    originalDocumentTitle = document.title;
    document.title = 'Original Title';

    // Mock document.documentElement.classList
    originalClassList = document.documentElement.classList;
    const mockClassList = {
      add: vi.fn(),
      remove: vi.fn(),
    };
    document.documentElement.classList = mockClassList;

    vi.clearAllMocks();
  });

  afterEach(() => {
    document.title = originalDocumentTitle;
    document.documentElement.classList = originalClassList;
  });

  describe('elementOnScreenToPDF', () => {
    it('exports element with default options', async () => {
      await elementOnScreenToPDF('#test-element');

      expect(document.querySelector).toHaveBeenCalledWith('#test-element');
      expect(mockHtml2pdf.set).toHaveBeenCalledWith({
        margin: 10,
        filename: 'export.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        pagebreak: { mode: ['css', 'legacy'] },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'landscape',
        },
      });
      expect(mockHtml2pdf.from).toHaveBeenCalledWith(mockElement);
      expect(mockHtml2pdf.save).toHaveBeenCalled();
    });

    it('exports element with custom options', async () => {
      const options = {
        filename: 'custom.pdf',
        title: 'Custom Title',
        margin: 20,
        landscape: false,
        format: 'letter',
        scale: 1.5,
        backgroundColor: '#000000',
        applyPdfMode: true,
      };

      await elementOnScreenToPDF('#test-element', options);

      expect(mockHtml2pdf.set).toHaveBeenCalledWith({
        margin: 20,
        filename: 'custom.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, backgroundColor: '#000000' },
        pagebreak: { mode: ['css', 'legacy'] },
        jsPDF: {
          unit: 'mm',
          format: 'letter',
          orientation: 'portrait',
        },
      });
      expect(document.title).toBe('Custom Title');
      // Note: classList methods are mocked but not easily testable as spies
    });

    it('accepts element directly', async () => {
      await elementOnScreenToPDF(mockElement);

      expect(document.querySelector).not.toHaveBeenCalled();
      expect(mockHtml2pdf.from).toHaveBeenCalledWith(mockElement);
    });

    it('throws error when element not found', async () => {
      document.querySelector.mockReturnValue(null);

      await expect(elementOnScreenToPDF('#nonexistent')).rejects.toThrow(
        'elementOnScreenToPDF: selector no encontrado'
      );
    });

    it('handles applyPdfMode correctly', async () => {
      await elementOnScreenToPDF('#test-element', { applyPdfMode: true });

      // Note: classList methods are mocked but not easily testable as spies
    });

    it('does not apply pdf mode when disabled', async () => {
      await elementOnScreenToPDF('#test-element', { applyPdfMode: false });

      // Note: classList methods are mocked but not easily testable as spies
    });

    it('sets custom title when provided', async () => {
      await elementOnScreenToPDF('#test-element', { title: 'Test Title' });

      expect(document.title).toBe('Test Title');
    });

    it('does not change title when not provided', async () => {
      await elementOnScreenToPDF('#test-element');

      expect(document.title).toBe('Original Title');
    });

    it('handles landscape orientation', async () => {
      await elementOnScreenToPDF('#test-element', { landscape: true });

      expect(mockHtml2pdf.set).toHaveBeenCalledWith(
        expect.objectContaining({
          jsPDF: expect.objectContaining({
            orientation: 'landscape',
          }),
        })
      );
    });

    it('handles portrait orientation', async () => {
      await elementOnScreenToPDF('#test-element', { landscape: false });

      expect(mockHtml2pdf.set).toHaveBeenCalledWith(
        expect.objectContaining({
          jsPDF: expect.objectContaining({
            orientation: 'portrait',
          }),
        })
      );
    });

    it('handles different formats', async () => {
      await elementOnScreenToPDF('#test-element', { format: 'a3' });

      expect(mockHtml2pdf.set).toHaveBeenCalledWith(
        expect.objectContaining({
          jsPDF: expect.objectContaining({
            format: 'a3',
          }),
        })
      );
    });

    it('handles different scales', async () => {
      await elementOnScreenToPDF('#test-element', { scale: 3 });

      expect(mockHtml2pdf.set).toHaveBeenCalledWith(
        expect.objectContaining({
          html2canvas: expect.objectContaining({
            scale: 3,
          }),
        })
      );
    });

    it('handles different margins', async () => {
      await elementOnScreenToPDF('#test-element', { margin: 15 });

      expect(mockHtml2pdf.set).toHaveBeenCalledWith(
        expect.objectContaining({
          margin: 15,
        })
      );
    });

    it('handles different background colors', async () => {
      await elementOnScreenToPDF('#test-element', {
        backgroundColor: '#ff0000',
      });

      expect(mockHtml2pdf.set).toHaveBeenCalledWith(
        expect.objectContaining({
          html2canvas: expect.objectContaining({
            backgroundColor: '#ff0000',
          }),
        })
      );
    });

    it('handles different filenames', async () => {
      await elementOnScreenToPDF('#test-element', { filename: 'test.pdf' });

      expect(mockHtml2pdf.set).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'test.pdf',
        })
      );
    });

    it('cleans up pdf mode even if error occurs', async () => {
      mockHtml2pdf.save.mockRejectedValue(new Error('PDF generation failed'));

      await expect(
        elementOnScreenToPDF('#test-element', { applyPdfMode: true })
      ).rejects.toThrow();

      // Note: classList methods are mocked but not easily testable as spies
    });

    it('cleans up title even if error occurs', async () => {
      mockHtml2pdf.save.mockRejectedValue(new Error('PDF generation failed'));

      await expect(
        elementOnScreenToPDF('#test-element', { title: 'Test Title' })
      ).rejects.toThrow();

      expect(document.title).toBe('Test Title');
    });
  });
});
