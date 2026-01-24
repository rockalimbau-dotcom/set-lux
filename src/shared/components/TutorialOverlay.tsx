import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  selector: string;
  tooltipPlacement?: 'auto' | 'right' | 'center' | 'top' | 'bottom';
  tooltipAnchorSelector?: string;
  extraSelector?: string;
  tooltipMaxWidth?: number;
  highlightPadding?: { top?: number; right?: number; bottom?: number; left?: number };
  highlightMode?: 'union' | 'extraOnly';
  tooltipOffset?: number;
  tooltipShiftX?: number;
  tooltipShiftY?: number;
  tooltipBottomPadding?: number;
  noScroll?: boolean;
}

interface TutorialOverlayProps {
  isOpen: boolean;
  steps: TutorialStep[];
  stepIndex: number;
  onStepChange: (nextIndex: number) => void;
  onClose: () => void;
  onFinish?: () => void;
  missingHint?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function TutorialOverlay({
  isOpen,
  steps,
  stepIndex,
  onStepChange,
  onClose,
  onFinish,
  missingHint,
}: TutorialOverlayProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipReady, setTooltipReady] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const lastRectRef = useRef<DOMRect | null>(null);
  const isLight =
    typeof document !== 'undefined' &&
    (document.documentElement.getAttribute('data-theme') || 'dark') === 'light';

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;

  useEffect(() => {
    if (!isOpen || !step?.selector) {
      setTargetRect(null);
      setTooltipReady(false);
      return;
    }

    setTooltipReady(false);
    const updateTarget = () => {
      const element = document.querySelector(step.selector) as HTMLElement | null;
      if (!element) {
        setTargetRect(null);
        setTooltipReady(true);
        return;
      }

      if (!step.noScroll) {
        element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
      }
      const rect = element.getBoundingClientRect();
      const extra = step.extraSelector
        ? (document.querySelector(step.extraSelector) as HTMLElement | null)
        : null;
      if (extra && step.highlightMode === 'extraOnly') {
        const extraRect = extra.getBoundingClientRect();
        const pad = step.highlightPadding || {};
        const nextRect = {
          ...extraRect,
          left: extraRect.left - (pad.left || 0),
          top: extraRect.top - (pad.top || 0),
          right: extraRect.right + (pad.right || 0),
          bottom: extraRect.bottom + (pad.bottom || 0),
          width: extraRect.width + (pad.left || 0) + (pad.right || 0),
          height: extraRect.height + (pad.top || 0) + (pad.bottom || 0),
        } as DOMRect;
        lastRectRef.current = nextRect;
        setTargetRect(nextRect);
        setTooltipReady(true);
      } else if (extra) {
        const extraRect = extra.getBoundingClientRect();
        const union = {
          left: Math.min(rect.left, extraRect.left),
          top: Math.min(rect.top, extraRect.top),
          right: Math.max(rect.right, extraRect.right),
          bottom: Math.max(rect.bottom, extraRect.bottom),
          width: Math.max(rect.right, extraRect.right) - Math.min(rect.left, extraRect.left),
          height: Math.max(rect.bottom, extraRect.bottom) - Math.min(rect.top, extraRect.top),
        } as DOMRect;
        const pad = step.highlightPadding || {};
        const nextRect = {
          ...union,
          left: union.left - (pad.left || 0),
          top: union.top - (pad.top || 0),
          right: union.right + (pad.right || 0),
          bottom: union.bottom + (pad.bottom || 0),
          width: union.width + (pad.left || 0) + (pad.right || 0),
          height: union.height + (pad.top || 0) + (pad.bottom || 0),
        } as DOMRect;
        lastRectRef.current = nextRect;
        setTargetRect(nextRect);
        setTooltipReady(true);
      } else {
        const pad = step.highlightPadding || {};
        const nextRect = {
          ...rect,
          left: rect.left - (pad.left || 0),
          top: rect.top - (pad.top || 0),
          right: rect.right + (pad.right || 0),
          bottom: rect.bottom + (pad.bottom || 0),
          width: rect.width + (pad.left || 0) + (pad.right || 0),
          height: rect.height + (pad.top || 0) + (pad.bottom || 0),
        } as DOMRect;
        lastRectRef.current = nextRect;
        setTargetRect(nextRect);
        setTooltipReady(true);
      }
    };

    updateTarget();
    const timer = window.setTimeout(updateTarget, 80);
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);

    const element = document.querySelector(step.selector) as HTMLElement | null;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let bodyObserver: MutationObserver | null = null;
    if (element && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateTarget());
      resizeObserver.observe(element);
    }
    if (element && typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => updateTarget());
      mutationObserver.observe(element, { attributes: true, childList: true, subtree: true });
    }
    if ((!element || step?.extraSelector) && typeof MutationObserver !== 'undefined') {
      bodyObserver = new MutationObserver(() => updateTarget());
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
      if (resizeObserver) resizeObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      if (bodyObserver) bodyObserver.disconnect();
    };
  }, [isOpen, stepIndex, step?.selector, location.pathname]);

  const tooltipStyle = useMemo(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const isMobile = viewportWidth < 640;
    const maxWidth = step?.tooltipMaxWidth || (isMobile ? 200 : 360);
    const width = Math.min(maxWidth, viewportWidth - 10);
    const heightEstimate = 200;
    const anchor = step?.tooltipAnchorSelector
      ? (document.querySelector(step.tooltipAnchorSelector) as HTMLElement | null)
      : null;
    const anchorRect = anchor?.getBoundingClientRect() || null;

    if (!targetRect && !anchorRect) {
      return {
        width,
        left: Math.round((viewportWidth - width) / 2),
        top: Math.round((viewportHeight - heightEstimate) / 2),
      };
    }

    const gap = 4;
    const baseRect = anchorRect || targetRect!;
    const rightStart = baseRect.right + gap;
    const leftStart = baseRect.left - width - gap;
    const placeRight = step?.tooltipPlacement === 'right';
    const placeCenter = step?.tooltipPlacement === 'center';
    const placeTop = step?.tooltipPlacement === 'top';
    const placeBottom = step?.tooltipPlacement === 'bottom';

    const offset = step?.tooltipOffset ?? 12;
    const preferredTop = baseRect.bottom + offset;
    const fallbackTop = baseRect.top - heightEstimate - offset;
    const bottomPadding = step?.tooltipBottomPadding ?? 16;
    const maxTop = viewportHeight - heightEstimate - bottomPadding;
    const baseTop = placeBottom
      ? Math.min(preferredTop, maxTop)
      : placeTop
      ? clamp(fallbackTop, 16, maxTop)
      : preferredTop + heightEstimate < viewportHeight
      ? preferredTop
      : clamp(fallbackTop, 16, maxTop);
    const shiftY = step?.tooltipShiftY || 0;
    const shiftX = step?.tooltipShiftX || 0;
    const top = clamp(baseTop + shiftY, 16, maxTop);
    const left = placeCenter
      ? Math.round((viewportWidth - width) / 2)
      : placeRight
      ? (rightStart + width < viewportWidth - 8
          ? rightStart
          : clamp(leftStart, 16, viewportWidth - width - 16))
      : clamp(baseRect.left, 16, viewportWidth - width - 16);

    return {
      width,
      left: Math.round(clamp(left + shiftX, 16, viewportWidth - width - 16)),
      top: Math.round(top),
    };
  }, [
    targetRect,
    stepIndex,
    step?.tooltipPlacement,
    step?.tooltipAnchorSelector,
    step?.tooltipOffset,
    step?.tooltipMaxWidth,
    step?.tooltipShiftX,
    step?.tooltipShiftY,
    step?.tooltipBottomPadding,
  ]);

  const overlayColor = 'rgba(0,0,0,0.6)';
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const isMobile = viewportWidth < 640;

  if (!isOpen || !step) return null;

  return createPortal(
    <div className='fixed inset-0 z-[9999]' role='dialog' aria-modal='true' style={{ pointerEvents: 'none' }}>
      {!targetRect && (
        <div
          className='absolute inset-0'
          style={{ backgroundColor: overlayColor, pointerEvents: 'auto' }}
        />
      )}
      {targetRect && (
        <>
          <div
            className='absolute left-0 top-0 w-full'
            style={{ height: Math.max(0, targetRect.top - 6), backgroundColor: overlayColor, pointerEvents: 'auto' }}
          />
          <div
            className='absolute left-0'
            style={{
              top: Math.max(0, targetRect.top - 6),
              height: Math.max(0, targetRect.height + 12),
              width: Math.max(0, targetRect.left - 6),
              backgroundColor: overlayColor,
              pointerEvents: 'auto',
            }}
          />
          <div
            className='absolute'
            style={{
              top: Math.max(0, targetRect.top - 6),
              left: Math.max(0, targetRect.right + 6),
              height: Math.max(0, targetRect.height + 12),
              width: Math.max(0, viewportWidth - targetRect.right - 6),
              backgroundColor: overlayColor,
              pointerEvents: 'auto',
            }}
          />
          <div
            className='absolute left-0 w-full'
            style={{
              top: Math.max(0, targetRect.bottom + 6),
              height: Math.max(0, viewportHeight - targetRect.bottom - 6),
              backgroundColor: overlayColor,
              pointerEvents: 'auto',
            }}
          />
        </>
      )}

      {targetRect && (
        <div
          className='absolute rounded-lg border-2'
          style={{
            top: Math.max(8, targetRect.top - 6),
            left: Math.max(8, targetRect.left - 6),
            width: Math.max(24, targetRect.width + 12),
            height: Math.max(24, targetRect.height + 12),
            borderColor: isLight ? '#0468BF' : '#F59E0B',
            boxShadow: isLight ? '0 0 0 3px rgba(4,104,191,0.2)' : '0 0 0 3px rgba(242,116,5,0.3)',
            pointerEvents: 'none',
          }}
        />
      )}

      {tooltipReady && (
        <div
          className={`absolute rounded-xl border shadow-xl ${isMobile ? 'px-2 py-1' : 'px-4 py-3'}`}
          style={{
            width: tooltipStyle.width,
            left: tooltipStyle.left,
            top: tooltipStyle.top,
            backgroundColor: isLight ? '#ffffff' : 'var(--panel)',
            borderColor: isLight ? '#e5e7eb' : 'var(--border)',
            color: isLight ? '#111827' : 'var(--text)',
            pointerEvents: 'auto',
          }}
        >
        <div
          className={`${isMobile ? 'text-[6px]' : 'text-[10px]'} uppercase tracking-wide`}
          style={{ color: isLight ? '#111827' : '#ffffff' }}
        >
            {stepIndex + 1} / {steps.length}
          </div>
          <div
            className={`${isMobile ? 'text-[9px]' : 'text-sm'} mt-1 font-semibold`}
            style={{ color: isLight ? '#111827' : 'var(--text)' }}
          >
            {step.title}
          </div>
        <div
          className={`${isMobile ? 'text-[8px]' : 'text-xs'} mt-1`}
          style={{ color: isLight ? '#111827' : '#ffffff' }}
        >
            {step.description}
          </div>
          {!targetRect && missingHint && (
            <div className='mt-2 text-[11px]' style={{ color: isLight ? '#1d4ed8' : '#fdba74' }}>
              {missingHint}
            </div>
          )}
          <div className={`mt-1.5 flex items-center gap-1 ${isMobile ? 'flex-col' : 'justify-between'}`}>
            <button
              type='button'
              onClick={() => setShowExitConfirm(true)}
              className={`rounded-md border ${isMobile ? 'px-2 py-0.5 text-[7px] w-full' : 'px-2 py-1 text-[11px]'}`}
              style={{
                borderColor: isLight ? '#d1d5db' : 'var(--border)',
                color: isLight ? '#111827' : '#ffffff',
              }}
            >
              {t('tutorial.exit')}
            </button>
            <div className={`flex items-center gap-1 ${isMobile ? 'w-full justify-between' : ''}`}>
              <button
                type='button'
                onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
                disabled={isFirst}
                className={`rounded-md border ${isMobile ? 'px-2 py-0.5 text-[7px] w-full' : 'px-2 py-1 text-[11px]'} ${isFirst ? 'cursor-not-allowed opacity-50' : ''}`}
                style={{
                  borderColor: isLight ? '#d1d5db' : 'var(--border)',
                  color: isLight ? '#111827' : '#ffffff',
                }}
              >
                {t('tutorial.prev')}
              </button>
              <button
                type='button'
                onClick={() => {
                  if (isLast) {
                    onFinish?.();
                    onClose();
                  } else {
                    onStepChange(stepIndex + 1);
                  }
                }}
                className={`rounded-md font-semibold text-white ${isMobile ? 'px-3 py-0.5 text-[7px] w-full' : 'px-3 py-1 text-[11px]'}`}
                style={{ backgroundColor: isLight ? '#0468BF' : '#F27405' }}
              >
                {isLast ? t('tutorial.finish') : t('tutorial.next')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showExitConfirm && (
        <div className='fixed inset-0 z-[10000] grid place-items-center bg-black/50 px-4' style={{ pointerEvents: 'auto' }}>
          <div
            className='w-full max-w-[280px] rounded-lg border border-neutral-border bg-white px-4 py-3 text-center'
            style={{
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'var(--border)',
              backgroundColor: isLight ? '#ffffff' : 'var(--panel)',
              color: isLight ? '#111827' : '#ffffff',
            }}
          >
            <div className='text-sm font-semibold'>{t('tutorial.exitConfirmTitle')}</div>
            <div className='mt-1 text-xs' style={{ color: isLight ? '#374151' : '#d1d5db' }}>
              {t('tutorial.exitConfirmBody')}
            </div>
            <div className='mt-3 flex items-center justify-center gap-2'>
              <button
                type='button'
                onClick={() => setShowExitConfirm(false)}
                className='rounded-md border px-3 py-1 text-[11px]'
                style={{
                  borderColor: isLight ? '#d1d5db' : 'var(--border)',
                  color: isLight ? '#111827' : '#ffffff',
                }}
              >
                {t('tutorial.exitConfirmCancel')}
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className='rounded-md px-3 py-1 text-[11px] font-semibold text-white'
                style={{ backgroundColor: isLight ? '#0468BF' : '#F27405' }}
              >
                {t('tutorial.exitConfirmOk')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
