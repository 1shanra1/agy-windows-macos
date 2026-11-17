import React, { useEffect, useState } from 'react';
import type { OSAppProps } from '../../core/types';
import { useOS } from '../../core/osStore';
import { WALLPAPER_REGISTRY } from '../../core/wallpapers';
import { HalcyonMark } from '../../art';

const WALLPAPER_CREDITS = WALLPAPER_REGISTRY.filter(
  (wp) => wp.kind === 'photo' && wp.credit
).map((wp) => ({
  name: wp.id === 'meadow' ? `${wp.label} (Default)` : wp.label,
  credit: wp.credit!,
}));

export const AboutApp: React.FC<OSAppProps> = ({
  isFocused,
  setWindowTitle,
  setAppMenus,
}) => {
  const { settings, vfs, openApp, playSound } = useOS();
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    setWindowTitle(showCredits ? 'Wallpaper Credits' : 'About Halcyon');
  }, [setWindowTitle, showCredits]);

  useEffect(() => {
    if (!isFocused) return;
    setAppMenus([
      {
        label: 'System',
        items: [
          {
            label: 'Control Panel…',
            action: () => {
              playSound('open');
              openApp('control-panel');
            },
          },
          {
            label: 'Design Museum',
            action: () => {
              playSound('open');
              openApp('browser', { url: 'halcyon://museum' });
            },
          },
          {
            label: showCredits ? 'Back to Overview' : 'Wallpaper Credits…',
            action: () => {
              playSound('click');
              setShowCredits((prev) => !prev);
            },
          },
        ],
      },
    ]);
  }, [isFocused, openApp, playSound, showCredits, setAppMenus]);

  if (showCredits) {
    return (
      <div
        className="hc-metal"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '18px 22px 16px',
          background: 'var(--metal-bg)',
          color: 'var(--text)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Wallpaper Attribution
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-2)',
              marginBottom: 12,
              lineHeight: 1.4,
            }}
          >
            Desktop photographs from Wikimedia Commons under free licenses:
          </div>

          <div
            className="hc-well"
            style={{
              background: 'var(--paper)',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {WALLPAPER_CREDITS.map((item) => (
              <div key={item.name} style={{ fontSize: 11, lineHeight: 1.35 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{item.name}</div>
                <div style={{ color: 'var(--text-2)' }}>{item.credit}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: 'var(--text-2)',
            }}
          >
            Signed in as {settings.username} ({vfs.nodes.length} items on Local Disk C:)
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="hc-btn"
            onClick={() => {
              playSound('click');
              setShowCredits(false);
            }}
          >
            Back
          </button>
          <button
            type="button"
            className="hc-btn hc-btn--default"
            onClick={() => {
              playSound('open');
              openApp('control-panel', { section: 'desktop' });
            }}
          >
            Desktop Prefs…
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="hc-metal"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '26px 24px 16px',
        background: 'var(--metal-bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <HalcyonMark size={96} variant="color" />
        <h1
          style={{
            margin: '12px 0 0',
            fontFamily: 'var(--font-wordmark)',
            fontSize: 32,
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '0.01em',
            color: 'var(--text)',
          }}
        >
          Halcyon
        </h1>
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: 'var(--text-2)',
          }}
        >
          Version 2.0
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            className="hc-btn"
            onClick={() => {
              playSound('open');
              openApp('control-panel');
            }}
          >
            More Info…
          </button>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          fontSize: 11,
          lineHeight: 1.45,
          color: 'var(--text)',
        }}
      >
        <div>
          <strong>Processor:</strong> Apple-Luna Hybrid H4 Silicon
        </div>
        <div>
          <strong>Memory:</strong> 512 MB Unified RAM
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <button
          type="button"
          className="hc-btn hc-btn--sm"
          onClick={() => {
            playSound('click');
            setShowCredits(true);
          }}
        >
          Wallpaper Credits…
        </button>
        <div
          style={{
            fontSize: 10,
            color: 'var(--text-3)',
          }}
        >
          TM and © 2026 Halcyon.
        </div>
      </div>
    </div>
  );
};
