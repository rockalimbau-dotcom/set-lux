export function installExportCSS(): void {
  const css = `
      .export-doc{font:14px/1.3 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#111;}
      .export-doc h2{margin:12px 0 8px;font-size:18px}
      .export-doc .wk{break-after:page; page-break-after:always;}
      .export-doc .wk:last-child{break-after:auto; page-break-after:auto;}
      .export-doc table{width:100%; border-collapse:collapse}
      .export-doc th,.export-doc td{border:1px solid #222; padding:6px; vertical-align:top}
      .export-doc thead th{background:#eee}
    `;
  let tag = document.getElementById('export-style');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'export-style';
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}

export function ensureExportDiv(): HTMLDivElement {
  let el = document.getElementById('export-layer') as HTMLDivElement;
  if (!el) {
    el = document.createElement('div');
    el.id = 'export-layer';
    document.body.appendChild(el);
  }
  Object.assign(el.style, {
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
  return el;
}

export const waitForStylesToApply = (): Promise<void> =>
  new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

export const waitForFonts = (): Promise<void> =>
  document.fonts && document.fonts.ready
    ? document.fonts.ready.catch(() => {})
    : Promise.resolve();
