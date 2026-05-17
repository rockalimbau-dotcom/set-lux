import { useEffect, useState } from 'react';
import { getNeedsDayTypePalette, type NeedsTheme } from '@features/necesidades/utils/dayTypeColors';

export type DayTypeSummaryItem = {
  canonicalType: string;
  label: string;
  count: number;
};

type DayTypeSummaryLinesProps = {
  items: DayTypeSummaryItem[];
  className?: string;
};

export function DayTypeSummaryLines({ items, className = '' }: DayTypeSummaryLinesProps) {
  const [theme, setTheme] = useState<NeedsTheme>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as NeedsTheme;
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme((root.getAttribute('data-theme') || 'light') as NeedsTheme);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const visible = items.filter(item => item.count > 0);
  if (visible.length === 0) return null;

  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      {visible.map(item => {
        const palette = getNeedsDayTypePalette(item.canonicalType, theme);
        return (
          <span
            key={`${item.canonicalType}-${item.label}`}
            className='inline-block max-w-full rounded px-1 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-medium leading-tight'
            style={
              palette
                ? {
                    backgroundColor: palette.bg,
                    color: palette.controlText,
                    border: `1px solid ${palette.border}`,
                    boxShadow: `inset 2px 0 0 ${palette.border}`,
                  }
                : undefined
            }
          >
            {item.label} x{item.count}
          </span>
        );
      })}
    </div>
  );
}
