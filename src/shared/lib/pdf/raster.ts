export const PDF_RENDER_SCALE = 2.25;
export const PDF_IMAGE_MIME_TYPE = 'image/jpeg';
export const PDF_IMAGE_FORMAT = 'JPEG';
export const PDF_IMAGE_QUALITY = 0.88;
export const PDF_IMAGE_COMPRESSION = 'MEDIUM';

export function canvasToPdfImage(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL(PDF_IMAGE_MIME_TYPE, PDF_IMAGE_QUALITY);
}
