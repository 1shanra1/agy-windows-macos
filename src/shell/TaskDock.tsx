import React, { useEffect, useRef, useState } from 'react';
import { AppIcon, FileTypeIcon, HalcyonMark, UIGlyph } from '../art';
import { useOS } from '../core/osStore';
import type { AppId } from '../core/types';
import { StartMenuPopover } from './StartMenuPopover';
import { APP_META, FONT_START, FONT_UI } from './shellTheme';

const PINNED_DOCK_APPS: AppId[] = [
  'navigator',
  'browser',
  'wordleaf',
  'media-player',
  'paint',
  'sticky-notes',
  'control-panel',
];

function formatTrayTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const TaskDock: React.FC<{ onOpenPowerModal: () => void }> = ({
  onOpenPowerModal,
}) => {
  const {
    settings,
    updateSettings,
    windows,
    openApp,
    focusWindow,
    restoreWindow,
    minimizeWindow,
    focusedWindowId,
    vfs,
    playSound,
  } = useOS();

  const [startOpen, setStartOpen] = useState(false);
  const [pointerX, setPointerX] = useState<number | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [trayTime, setTrayTime] = useState(() => formatTrayTime(new Date()));

  const dockContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const id = window.setInterval(() => setTrayTime(formatTrayTime(new Date())), 10000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dockContainerRef.current &&
        !dockContainerRef.current.contains(e.target as Node)
      ) {
        setStartOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStartOpen(false);
    };
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  const trashEmpty = vfs.getChildren('trash').length === 0;

  const getScale = (key: string): number => {
    if (!settings.dockMagnification || pointerX === null) return 1;
    const el = itemRefs.current[key];
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const distance = Math.abs(pointerX - centerX);
    const radius = 110;
    if (distance >= radius) return 1;
    return 1 + 0.3 * Math.cos((distance / radius) * (Math.PI / 2));
  };

  const handlePinnedClick = (appId: AppId) => {
    const matching = windows.filter((w) => w.appId === appId);
    if (matching.length === 0) {
      openApp(appId);
      return;
    }
    const focusedMatch = matching.find((w) => w.id === focusedWindowId && !w.isMinimized);
    if (focusedMatch && matching.length === 1) {
      minimizeWindow(focusedMatch.id);
      return;
    }
    const topMost = matching.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
    if (topMost.isMinimized) {
      playSound('open');
      restoreWindow(topMost.id);
    } else {
      playSound('click');
      focusWindow(topMost.id);
    }
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '2px 8px',
    borderRadius: 4,
    background: 'var(--vibrancy-menu, rgba(240, 240, 242, 0.92))',
    color: 'var(--text, #1D1D1F)',
    fontSize: 12,
    lineHeight: '16px',
    fontWeight: 400,
    whiteSpace: 'nowrap',
    boxShadow: 'var(--shadow-menu, 0 0 0 0.5px rgba(0,0,0,.25), 0 10px 30px rgba(0,0,0,.22))',
    pointerEvents: 'none',
  };

  return (
    <div
      ref={dockContainerRef}
      style={{
        position: 'fixed',
        bottom: 6,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        fontFamily: FONT_UI,
        userSelect: 'none',
        width: 'max-content',
        maxWidth: 'calc(100vw - 16px)',
      }}
    >
      {/* Anchored Two-Column Start Menu Popover */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          left: 0,
          zIndex: 1100,
        }}
      >
        <StartMenuPopover
          isOpen={startOpen}
          onClose={() => setStartOpen(false)}
          onOpenPowerModal={onOpenPowerModal}
        />
      </div>

      {/* Horizon Shelf Container */}
      <div
        onMouseMove={(e) => setPointerX(e.clientX)}
        onMouseLeave={() => {
          setPointerX(null);
          setHoveredKey(null);
        }}
        style={{
          position: 'relative',
          height: 50,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        {/* Leopard Perspective Glass Plinth */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 3,
            height: 40,
            transform: 'perspective(600px) rotateX(38deg)',
            transformOrigin: 'bottom center',
            borderRadius: 6,
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(236, 240, 247, 0.58))',
            backdropFilter: 'blur(16px) saturate(110%)',
            WebkitBackdropFilter: 'blur(16px) saturate(110%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
            pointerEvents: 'none',
          }}
        />
        {/* 1px Front Lip + 3px Front Face */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 2,
            right: 2,
            bottom: 3,
            height: 1,
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,.9) 20%, rgba(255,255,255,.9) 80%, transparent)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 1,
            right: 1,
            bottom: 0,
            height: 3,
            borderRadius: '0 0 4px 4px',
            background: 'rgba(140, 155, 180, 0.55)',
            pointerEvents: 'none',
          }}
        />

        {/* XP Asymmetric Emerald "start" Emblem Sitting on Left End of Plinth */}
        <button
          type="button"
          aria-label="Start"
          aria-expanded={startOpen}
          onClick={() => {
            playSound('click');
            setStartOpen((prev) => !prev);
          }}
          style={{
            position: 'relative',
            zIndex: 2,
            width: 96,
            height: 34,
            marginBottom: 8,
            padding: '0 10px',
            borderRadius: '6px 17px 17px 6px',
            border: '1px solid #1E5E1A',
            background:
              'linear-gradient(180deg, #8AD96E 0%, #4FB23F 12%, #3C9A35 50%, #2F8A2B 51%, #3A9C33 88%, #24721F 100%)',
            boxShadow: startOpen
              ? 'inset 0 2px 4px rgba(0,0,0,.32), 0 1px 1px rgba(0,0,0,.25)'
              : 'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -2px 3px rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.35)',
            filter: startOpen ? 'brightness(0.94)' : 'none',
            transform: startOpen ? 'translateY(1px)' : 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'default',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              display: 'flex',
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.45))',
            }}
          >
            <HalcyonMark size={18} variant="color" />
          </span>
          <span
            style={{
              fontFamily: FONT_START,
              fontSize: 17,
              lineHeight: '20px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#FFFFFF',
              textShadow: '1px 1px 1px rgba(0, 0, 0, 0.45)',
            }}
          >
            start
          </span>
        </button>

        {/* Shelf App Icons (44px, bottom 8px into shelf) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 6,
            height: 50,
            paddingBottom: 2,
          }}
        >
          {PINNED_DOCK_APPS.map((appId) => {
            const scale = getScale(appId);
            const openCount = windows.filter((w) => w.appId === appId).length;
            const lift = (scale - 1) * 18;

            return (
              <div
                key={appId}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: 50,
                  margin: `0 ${Math.round((scale - 1) * 8)}px`,
                  transition: pointerX === null ? 'margin 140ms ease' : 'none',
                }}
              >
                {hoveredKey === appId && (
                  <div style={{ ...tooltipStyle, bottom: 58 + lift }}>
                    {APP_META[appId].name}
                  </div>
                )}

                <button
                  ref={(el) => {
                    itemRefs.current[appId] = el;
                  }}
                  type="button"
                  aria-label={APP_META[appId].name}
                  onMouseEnter={() => setHoveredKey(appId)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() => handlePinnedClick(appId)}
                  style={{
                    width: 44,
                    height: 44,
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translateY(-${lift}px) scale(${scale})`,
                    transformOrigin: 'bottom center',
                    transition:
                      pointerX === null
                        ? 'transform 140ms ease'
                        : 'transform 50ms linear',
                    WebkitBoxReflect:
                      'below 2px linear-gradient(transparent 70%, rgba(255,255,255,.22))',
                  }}
                >
                  <AppIcon appId={appId} size={44} />
                </button>

                {/* 4x4 Running Indicator Dot with 1px White Ring — No Glow */}
                <span
                  aria-hidden="true"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    marginTop: 3,
                    background: '#2D6FE8',
                    boxShadow: '0 0 0 1px #FFFFFF',
                    opacity: openCount > 0 ? 1 : 0,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 1x34 Vertical Etched Separator */}
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            zIndex: 2,
            width: 2,
            height: 34,
            marginBottom: 8,
            display: 'flex',
          }}
        >
          <span style={{ width: 1, height: '100%', background: 'rgba(0,0,0,.18)' }} />
          <span style={{ width: 1, height: '100%', background: 'rgba(255,255,255,.6)' }} />
        </div>

        {/* Recycle Bin Icon */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: 50,
            paddingBottom: 2,
            margin: `0 ${Math.round((getScale('trash') - 1) * 8)}px`,
          }}
        >
          {hoveredKey === 'trash' && (
            <div
              style={{
                ...tooltipStyle,
                bottom: 58 + (getScale('trash') - 1) * 18,
              }}
            >
              Recycle Bin
            </div>
          )}
          <button
            ref={(el) => {
              itemRefs.current.trash = el;
            }}
            type="button"
            aria-label="Recycle Bin"
            onMouseEnter={() => setHoveredKey('trash')}
            onMouseLeave={() => setHoveredKey(null)}
            onClick={() => openApp('navigator', { section: 'trash' })}
            style={{
              width: 44,
              height: 44,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateY(-${(getScale('trash') - 1) * 18}px) scale(${getScale(
                'trash'
              )})`,
              transformOrigin: 'bottom center',
              transition:
                pointerX === null
                  ? 'transform 140ms ease'
                  : 'transform 50ms linear',
              WebkitBoxReflect:
                'below 2px linear-gradient(transparent 70%, rgba(255,255,255,.22))',
            }}
          >
            <FileTypeIcon folderId="trash" isTrashEmpty={trashEmpty} size={44} />
          </button>
          <span style={{ height: 4, marginTop: 3 }} />
        </div>

        {/* Neutral Etched Tray Well (Right End) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            height: 34,
            marginBottom: 8,
            padding: '0 10px',
            borderRadius: 5,
            background: 'rgba(0, 0, 0, 0.08)',
            boxShadow:
              'var(--well, inset 0 1px 2px rgba(0,0,0,.22), inset 0 0 0 1px rgba(0,0,0,.18))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#1D1D1F',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            title="Halcyon Security"
            aria-label="Halcyon Security"
            onClick={() => openApp('browser', { url: 'halcyon://safenet' })}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              cursor: 'default',
            }}
          >
            <UIGlyph name="shield" size={14} tone="dark" />
          </button>
          <button
            type="button"
            title={settings.soundEnabled ? 'Mute' : 'Unmute'}
            aria-label="Toggle Volume"
            onClick={() => {
              const next = !settings.soundEnabled;
              updateSettings({ soundEnabled: next });
              if (next) playSound('click');
            }}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              cursor: 'default',
            }}
          >
            <UIGlyph
              name={settings.soundEnabled ? 'speaker' : 'speaker-mute'}
              size={14}
              tone="dark"
            />
          </button>
          <span
            style={{
              fontSize: 12,
              lineHeight: '16px',
              fontWeight: 400,
              color: '#1D1D1F',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {trayTime}
          </span>
        </div>
      </div>
    </div>
  );
};
