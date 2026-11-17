import React, { useEffect, useRef, useState } from 'react';
import { AppIcon } from '../art';
import { useOS } from '../core/osStore';
import type { WindowInstance } from '../core/types';
import {
  FONT_TITLE,
  FONT_UI,
  MENUBAR_HEIGHT,
  METAL_SURFACE_BACKGROUND,
  SHELF_CLEARANCE,
} from './shellTheme';

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';
type SnapZone = 'left' | 'right' | 'top' | null;

function getSnapRect(zone: Exclude<SnapZone, null>) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const usableH = Math.max(300, vh - MENUBAR_HEIGHT - SHELF_CLEARANCE);

  if (zone === 'left') {
    return {
      x: 0,
      y: MENUBAR_HEIGHT,
      width: Math.max(320, Math.floor(vw / 2)),
      height: usableH,
    };
  }
  if (zone === 'right') {
    const w = Math.max(320, vw - Math.floor(vw / 2));
    return {
      x: Math.floor(vw / 2),
      y: MENUBAR_HEIGHT,
      width: w,
      height: usableH,
    };
  }
  return {
    x: 0,
    y: MENUBAR_HEIGHT,
    width: vw,
    height: usableH,
  };
}

export const WindowFrame: React.FC<{
  win: WindowInstance;
  chrome?: 'luna' | 'metal';
  children: React.ReactNode;
}> = ({ win, chrome, children }) => {
  const {
    settings,
    focusedWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximizeWindow,
    updateWindowRect,
    playSound,
  } = useOS();

  const isFocused = focusedWindowId === win.id && !win.isMinimized;
  const effectiveChrome: 'luna' | 'metal' =
    chrome ??
    (win.appId === 'media-player' || win.appId === 'about' ? 'metal' : 'luna');
  const isGraphite =
    effectiveChrome === 'luna' &&
    (settings.accentTheme === 'graphite' || settings.accentTheme === 'sequoia-silver');

  const [controlsHovered, setControlsHovered] = useState(false);
  const [pressedControl, setPressedControl] = useState<'close' | 'min' | 'max' | null>(
    null
  );
  const [isInteracting, setIsInteracting] = useState(false);
  const [snapPreview, setSnapPreview] = useState<SnapZone>(null);

  const interactionRef = useRef<
    | {
        mode: 'drag';
        startX: number;
        startY: number;
        origX: number;
        origY: number;
        origW: number;
        origH: number;
        wasMaximized: boolean;
      }
    | {
        mode: 'resize';
        dir: ResizeDir;
        startX: number;
        startY: number;
        origX: number;
        origY: number;
        origW: number;
        origH: number;
      }
    | null
  >(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const state = interactionRef.current;
      if (!state) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (state.mode === 'drag') {
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        const targetW = state.origW;
        const targetH = state.origH;

        const nextX = state.wasMaximized
          ? Math.max(-targetW + 120, Math.min(vw - 120, e.clientX - targetW / 2))
          : Math.max(-targetW + 120, Math.min(vw - 120, state.origX + dx));

        const nextY = state.wasMaximized
          ? Math.max(MENUBAR_HEIGHT, Math.min(vh - 56, e.clientY - 14))
          : Math.max(MENUBAR_HEIGHT, Math.min(vh - 56, state.origY + dy));

        let nextSnap: SnapZone = null;
        if (e.clientX <= 14) nextSnap = 'left';
        else if (e.clientX >= vw - 14) nextSnap = 'right';
        else if (e.clientY <= MENUBAR_HEIGHT + 10) nextSnap = 'top';

        setSnapPreview(nextSnap);
        updateWindowRect(win.id, {
          x: nextX,
          y: nextY,
          width: targetW,
          height: targetH,
          isMaximized: false,
          snapZone: null,
        });
      } else if (state.mode === 'resize') {
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        const { dir, origX, origY, origW, origH } = state;

        let nextX = origX;
        let nextY = origY;
        let nextW = origW;
        let nextH = origH;

        if (dir.includes('e')) {
          nextW = Math.max(win.minWidth, Math.min(vw - origX, origW + dx));
        }
        if (dir.includes('s')) {
          nextH = Math.max(win.minHeight, Math.min(vh - origY - 8, origH + dy));
        }
        if (dir.includes('w')) {
          const proposedW = origW - dx;
          if (proposedW >= win.minWidth) {
            nextW = proposedW;
            nextX = origX + dx;
          } else {
            nextW = win.minWidth;
            nextX = origX + (origW - win.minWidth);
          }
        }
        if (dir.includes('n')) {
          const maxDy = origH - win.minHeight;
          const clampedDy = Math.min(maxDy, Math.max(MENUBAR_HEIGHT - origY, dy));
          nextY = origY + clampedDy;
          nextH = origH - clampedDy;
        }

        updateWindowRect(win.id, {
          x: nextX,
          y: nextY,
          width: nextW,
          height: nextH,
          isMaximized: false,
          snapZone: null,
        });
      }
    };

    const handlePointerUp = () => {
      const state = interactionRef.current;
      if (!state) return;

      if (state.mode === 'drag' && snapPreview) {
        const rect = getSnapRect(snapPreview);
        updateWindowRect(win.id, {
          ...rect,
          isMaximized: snapPreview === 'top',
          snapZone: snapPreview,
        });
        playSound('click');
      }

      interactionRef.current = null;
      setIsInteracting(false);
      setSnapPreview(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [win.id, win.minWidth, win.minHeight, snapPreview, updateWindowRect, playSound]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-window-control="true"]')) return;
    e.preventDefault();
    focusWindow(win.id);

    const restoredW = win.isMaximized
      ? Math.min(840, Math.max(win.minWidth, win.width * 0.72))
      : win.width;
    const restoredH = win.isMaximized
      ? Math.min(580, Math.max(win.minHeight, win.height * 0.75))
      : win.height;

    interactionRef.current = {
      mode: 'drag',
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
      origW: restoredW,
      origH: restoredH,
      wasMaximized: win.isMaximized,
    };
    setIsInteracting(true);
  };

  const startResize = (dir: ResizeDir) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || win.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    focusWindow(win.id);
    interactionRef.current = {
      mode: 'resize',
      dir,
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
      origW: win.width,
      origH: win.height,
    };
    setIsInteracting(true);
  };

  const maxH = `calc(100vh - ${MENUBAR_HEIGHT + SHELF_CLEARANCE}px)`;
  const frameStyle: React.CSSProperties = win.isMaximized
    ? {
        position: 'fixed',
        left: 0,
        top: MENUBAR_HEIGHT,
        width: '100vw',
        height: maxH,
        zIndex: win.zIndex,
        borderRadius: 0,
      }
    : {
        position: 'fixed',
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
        borderRadius: '10px 10px 6px 6px',
      };

  const previewRect = snapPreview ? getSnapRect(snapPreview) : null;

  // Titlebar styling per §6.3 and §6.6
  let titlebarBg: string;
  let titlebarShadow: string;
  let titleColor: string;
  let titleShadow: string;
  let titleFont = FONT_TITLE;
  let titleWeight = 700;

  if (effectiveChrome === 'metal') {
    titlebarBg = METAL_SURFACE_BACKGROUND;
    titlebarShadow = isFocused
      ? 'inset 0 1px 0 rgba(255,255,255,.80), inset 0 -1px 0 rgba(0,0,0,.22)'
      : 'inset 0 1px 0 rgba(255,255,255,.65), inset 0 -1px 0 rgba(0,0,0,.16)';
    titleColor = isFocused ? '#2B2B2B' : '#7A7F88';
    titleShadow = '0 1px 0 rgba(255,255,255,.75)';
    titleFont = FONT_UI;
    titleWeight = 400;
  } else if (!isFocused) {
    titlebarBg = 'linear-gradient(180deg, #E8EDF6 0%, #D3DCEB 100%)';
    titlebarShadow = 'inset 0 1px 0 rgba(255,255,255,.80), inset 0 -1px 0 #B3BFD3';
    titleColor = '#6A7486';
    titleShadow = '0 1px 0 rgba(255,255,255,.75)';
  } else if (isGraphite) {
    titlebarBg =
      'linear-gradient(180deg, #DFE3EA 0%, #C6CCD7 48%, #B6BDC9 51%, #CBD1DB 100%)';
    titlebarShadow = 'inset 0 1px 0 rgba(255,255,255,.78), inset 0 -1px 0 #8E96A4';
    titleColor = '#2B2B2B';
    titleShadow = '0 1px 0 rgba(255,255,255,.75)';
    titleFont = FONT_UI;
    titleWeight = 400;
  } else {
    titlebarBg =
      'linear-gradient(180deg, #6AAAF7 0%, #3B8BF0 9%, #2A75E8 46%, #1D66DB 50%, #2470E2 88%, #1556C8 100%)';
    titlebarShadow = 'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -1px 0 #0F48AE';
    titleColor = '#FFFFFF';
    titleShadow = '1px 1px 1px rgba(6,20,62,.70)';
  }

  const showColoredTraffic = (isFocused || controlsHovered) && !isGraphite;
  const graphiteJewel =
    'radial-gradient(circle at 50% 30%, #ECEEF1 0%, #C9CBCF 55%, #A7AAB0 100%)';
  const activeGraphiteJewel =
    'radial-gradient(circle at 50% 30%, #C9CED6 0%, #8C939E 55%, #6A717B 100%)';

  const closeBg = showColoredTraffic
    ? 'radial-gradient(circle at 50% 30%, #FFB3A8 0%, #FF5F57 45%, #D8362C 100%)'
    : isGraphite && isFocused
    ? activeGraphiteJewel
    : graphiteJewel;

  const minBg = showColoredTraffic
    ? 'radial-gradient(circle at 50% 30%, #FFE6A0 0%, #FEBC2E 45%, #D69613 100%)'
    : isGraphite && isFocused
    ? activeGraphiteJewel
    : graphiteJewel;

  const maxBg = showColoredTraffic
    ? 'radial-gradient(circle at 50% 30%, #B8F0A4 0%, #28C840 45%, #149A2A 100%)'
    : isGraphite && isFocused
    ? activeGraphiteJewel
    : graphiteJewel;

  const resizeHandles: { dir: ResizeDir; style: React.CSSProperties }[] = [
    { dir: 'n', style: { top: -3, left: 10, right: 10, height: 6, cursor: 'ns-resize' } },
    { dir: 's', style: { bottom: -3, left: 10, right: 10, height: 6, cursor: 'ns-resize' } },
    { dir: 'w', style: { left: -3, top: 10, bottom: 10, width: 6, cursor: 'ew-resize' } },
    { dir: 'e', style: { right: -3, top: 10, bottom: 10, width: 6, cursor: 'ew-resize' } },
    { dir: 'nw', style: { top: -4, left: -4, width: 12, height: 12, cursor: 'nwse-resize' } },
    { dir: 'ne', style: { top: -4, right: -4, width: 12, height: 12, cursor: 'nesw-resize' } },
    { dir: 'sw', style: { bottom: -4, left: -4, width: 12, height: 12, cursor: 'nesw-resize' } },
    { dir: 'se', style: { bottom: -4, right: -4, width: 12, height: 12, cursor: 'nwse-resize' } },
  ];

  return (
    <>
      {previewRect && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: previewRect.x,
            top: previewRect.y,
            width: previewRect.width,
            height: previewRect.height,
            zIndex: 900,
            borderRadius: snapPreview === 'top' ? 0 : 6,
            background: 'rgba(56, 117, 215, 0.18)',
            border: '1px solid rgba(56, 117, 215, 0.78)',
            pointerEvents: 'none',
          }}
        />
      )}

      <section
        role="dialog"
        aria-label={win.title}
        data-window-id={win.id}
        data-chrome={effectiveChrome}
        className="halcyon-window-anim"
        onPointerDown={() => {
          if (!isFocused) focusWindow(win.id);
        }}
        style={{
          ...frameStyle,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONT_UI,
          visibility: win.isMinimized ? 'hidden' : 'visible',
          opacity: win.isMinimized ? 0 : 1,
          pointerEvents: win.isMinimized ? 'none' : 'auto',
          transform: win.isMinimized
            ? 'translateY(220px) scale(0.2)'
            : 'translateY(0) scale(1)',
          transition: isInteracting
            ? 'none'
            : win.isMinimized
            ? 'transform 260ms ease-in, opacity 200ms ease-in, visibility 260ms step-end'
            : 'left 180ms cubic-bezier(.2,.8,.2,1), top 180ms cubic-bezier(.2,.8,.2,1), width 180ms cubic-bezier(.2,.8,.2,1), height 180ms cubic-bezier(.2,.8,.2,1), opacity 160ms cubic-bezier(.2,.8,.2,1), transform 160ms cubic-bezier(.2,.8,.2,1)',
          boxShadow: win.isMaximized
            ? 'none'
            : isFocused
            ? 'var(--shadow-window, 0 0 0 1px rgba(0,0,0,.28), 0 18px 48px rgba(0,0,0,.30), 0 3px 10px rgba(0,0,0,.16))'
            : 'var(--shadow-window-i, 0 0 0 1px rgba(0,0,0,.20), 0 8px 24px rgba(0,0,0,.16))',
          background:
            effectiveChrome === 'metal' ? '#CFCFD2' : 'var(--linen, #EEECE4)',
          overflow: 'hidden',
        }}
      >
        {/* 28px Titlebar */}
        <header
          onPointerDown={startDrag}
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest('[data-window-control="true"]')) return;
            playSound('click');
            toggleMaximizeWindow(win.id);
          }}
          style={{
            position: 'relative',
            height: 28,
            minHeight: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 80px',
            background: titlebarBg,
            boxShadow: titlebarShadow,
            cursor: 'default',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          {/* Traffic Lights (left 10px, 12px diameter, gap 8px — NO recess pill) */}
          <div
            data-window-control="true"
            onMouseEnter={() => setControlsHovered(true)}
            onMouseLeave={() => {
              setControlsHovered(false);
              setPressedControl(null);
            }}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {/* Close */}
            <button
              type="button"
              aria-label="Close window"
              title="Close"
              data-window-control="true"
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressedControl('close');
              }}
              onPointerUp={() => setPressedControl(null)}
              onClick={(e) => {
                e.stopPropagation();
                playSound('close');
                closeWindow(win.id);
              }}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: closeBg,
                boxShadow:
                  '0 0 0 0.5px rgba(0,0,0,.45), inset 0 0.5px 0.5px rgba(255,255,255,.7)',
                filter: pressedControl === 'close' ? 'brightness(0.86)' : 'none',
              }}
            >
              {controlsHovered && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M2 2L6 6M6 2L2 6"
                    stroke="rgba(60,0,0,.65)"
                    strokeWidth="1.25"
                    strokeLinecap="square"
                  />
                </svg>
              )}
            </button>

            {/* Minimize */}
            <button
              type="button"
              aria-label="Minimize window"
              title="Minimize"
              data-window-control="true"
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressedControl('min');
              }}
              onPointerUp={() => setPressedControl(null)}
              onClick={(e) => {
                e.stopPropagation();
                playSound('minimize');
                minimizeWindow(win.id);
              }}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: minBg,
                boxShadow:
                  '0 0 0 0.5px rgba(0,0,0,.45), inset 0 0.5px 0.5px rgba(255,255,255,.7)',
                filter: pressedControl === 'min' ? 'brightness(0.86)' : 'none',
              }}
            >
              {controlsHovered && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M1.6 4H6.4"
                    stroke="rgba(60,0,0,.65)"
                    strokeWidth="1.25"
                    strokeLinecap="square"
                  />
                </svg>
              )}
            </button>

            {/* Zoom / Maximize */}
            <button
              type="button"
              aria-label={win.isMaximized ? 'Restore window' : 'Zoom window'}
              title={win.isMaximized ? 'Restore' : 'Zoom'}
              data-window-control="true"
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressedControl('max');
              }}
              onPointerUp={() => setPressedControl(null)}
              onClick={(e) => {
                e.stopPropagation();
                playSound('click');
                toggleMaximizeWindow(win.id);
              }}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: maxBg,
                boxShadow:
                  '0 0 0 0.5px rgba(0,0,0,.45), inset 0 0.5px 0.5px rgba(255,255,255,.7)',
                filter: pressedControl === 'max' ? 'brightness(0.86)' : 'none',
              }}
            >
              {controlsHovered && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M4 1.6V6.4M1.6 4H6.4"
                    stroke="rgba(60,0,0,.65)"
                    strokeWidth="1.25"
                    strokeLinecap="square"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Centered Proxy Icon (16px, 6px left of text) + Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <div style={{ display: 'flex', flexShrink: 0 }}>
              <AppIcon appId={win.appId} size={16} />
            </div>
            <span
              style={{
                fontFamily: titleFont,
                fontSize: 13,
                lineHeight: '16px',
                fontWeight: titleWeight,
                color: titleColor,
                textShadow: titleShadow,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {win.title}
            </span>
          </div>
        </header>

        {/* Opaque Window Content Viewport */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>

        {/* 8-Edge/Corner Resize Handles */}
        {!win.isMaximized &&
          resizeHandles.map(({ dir, style }) => (
            <div
              key={dir}
              aria-hidden="true"
              onPointerDown={startResize(dir)}
              style={{
                position: 'absolute',
                zIndex: 20,
                ...style,
              }}
            />
          ))}
      </section>
    </>
  );
};
