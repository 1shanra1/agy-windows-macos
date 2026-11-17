import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HalcyonMark, UIGlyph } from '../art';
import { useOS } from '../core/osStore';
import type { MenuGroup } from '../core/types';
import { WALLPAPER_REGISTRY } from '../core/wallpapers';
import {
  APP_META,
  FONT_UI,
  MENUBAR_HEIGHT,
  TIME_OF_DAY_OPTIONS,
} from './shellTheme';

function formatClock(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const MenuBar: React.FC<{ onOpenPowerModal: () => void }> = ({
  onOpenPowerModal,
}) => {
  const {
    settings,
    updateSettings,
    windows,
    focusedWindowId,
    activeMenus,
    openApp,
    setPhase,
    vfs,
    playSound,
    notify,
    setSpotlightOpen,
  } = useOS();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [clockText, setClockText] = useState(() => formatClock(new Date()));

  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClockText(formatClock(new Date()));
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setControlCenterOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setControlCenterOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  const focusedWindow = useMemo(
    () => windows.find((w) => w.id === focusedWindowId && !w.isMinimized) ?? null,
    [windows, focusedWindowId]
  );

  const trashItems = vfs.getChildren('trash');

  const desktopMenus: MenuGroup[] = useMemo(
    () => [
      {
        label: 'File',
        items: [
          {
            label: 'New Text Document',
            shortcut: 'Cmd+N',
            action: () => {
              const count =
                vfs.getChildren('desktop').filter((n) => n.name.startsWith('New Note')).length + 1;
              const file = vfs.createFile(
                'desktop',
                count === 1 ? 'New Note' : `New Note ${count}`,
                'txt',
                ''
              );
              openApp('wordleaf', { fileId: file.id });
            },
          },
          {
            label: 'New Folder',
            dividerAfter: true,
            action: () => {
              const count =
                vfs.getChildren('desktop').filter((n) => n.name.startsWith('New Folder')).length + 1;
              vfs.createFolder('desktop', count === 1 ? 'New Folder' : `New Folder ${count}`);
              playSound('click');
            },
          },
          {
            label: 'Open Navigator',
            action: () => openApp('navigator', { section: 'computer' }),
          },
          {
            label: 'Open WordLeaf',
            action: () => openApp('wordleaf'),
          },
        ],
      },
      {
        label: 'View',
        items: [
          {
            label: settings.dockMagnification
              ? 'Disable Dock Magnification'
              : 'Enable Dock Magnification',
            action: () => {
              updateSettings({ dockMagnification: !settings.dockMagnification });
              playSound('click');
            },
          },
          {
            label: settings.crtScanlines ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines',
            action: () => {
              updateSettings({ crtScanlines: !settings.crtScanlines });
              playSound('click');
            },
          },
        ],
      },
      {
        label: 'Go',
        items: [
          { label: 'My Computer', action: () => openApp('navigator', { section: 'computer' }) },
          { label: 'My Documents', action: () => openApp('navigator', { section: 'documents' }) },
          { label: 'My Pictures', action: () => openApp('navigator', { section: 'pictures' }) },
          { label: 'My Music', action: () => openApp('navigator', { section: 'music' }) },
          {
            label: 'Recycle Bin',
            dividerAfter: true,
            action: () => openApp('navigator', { section: 'trash' }),
          },
          {
            label: 'Safari Explorer',
            action: () => openApp('browser', { url: 'halcyon://home' }),
          },
        ],
      },
      {
        label: 'Window',
        items: [
          {
            label: 'Control Panel…',
            action: () => openApp('control-panel'),
          },
        ],
      },
      {
        label: 'Help',
        items: [
          {
            label: 'Spotlight Search…',
            shortcut: 'Cmd+K',
            action: () => setSpotlightOpen(true),
          },
          {
            label: 'About Halcyon…',
            action: () => openApp('about'),
          },
        ],
      },
    ],
    [
      vfs,
      openApp,
      playSound,
      updateSettings,
      settings.dockMagnification,
      settings.crtScanlines,
      setSpotlightOpen,
    ]
  );

  const displayedMenus =
    focusedWindow && activeMenus.length > 0 ? activeMenus : desktopMenus;

  const prismMenu: MenuGroup = {
    label: '__mark__',
    items: [
      { label: 'About Halcyon', action: () => openApp('about'), dividerAfter: true },
      { label: 'Control Panel…', action: () => openApp('control-panel') },
      {
        label: 'Spotlight…',
        shortcut: 'Cmd+K',
        action: () => setSpotlightOpen(true),
        dividerAfter: true,
      },
      {
        label: 'Empty Recycle Bin…',
        disabled: trashItems.length === 0,
        action: () => {
          vfs.emptyTrash();
          playSound('trash');
          notify({
            title: 'Recycle Bin',
            message: 'Recycle Bin emptied.',
            icon: 'info',
          });
        },
        dividerAfter: true,
      },
      {
        label: `Log Off ${settings.username}…`,
        action: () => {
          playSound('shutdown');
          setPhase('login');
        },
      },
      {
        label: 'Turn Off Computer…',
        action: () => onOpenPowerModal(),
      },
    ],
  };

  const activeAppLabel = focusedWindow
    ? APP_META[focusedWindow.appId].name
    : 'Navigator';

  const renderDropdown = (group: MenuGroup) => (
    <div
      role="menu"
      className="hc-menu halcyon-pop-anim"
      style={{
        position: 'absolute',
        transformOrigin: 'top left',
        top: MENUBAR_HEIGHT + 1,
        left: 0,
        minWidth: 214,
        padding: '4px 0',
        borderRadius: 6,
        background: 'var(--vibrancy-menu, rgba(240, 240, 242, 0.92))',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        boxShadow:
          'var(--shadow-menu, 0 0 0 0.5px rgba(0,0,0,.25), 0 10px 30px rgba(0,0,0,.22))',
        zIndex: 1250,
      }}
    >
      {group.items.map((item, idx) => (
        <React.Fragment key={`${item.label}-${idx}`}>
          <button
            type="button"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              playSound('click');
              setOpenMenu(null);
              item.action?.();
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.background = 'var(--select, #3875D7)';
                e.currentTarget.style.color = '#FFFFFF';
                const sc = e.currentTarget.querySelector('[data-sc]') as HTMLElement | null;
                if (sc) sc.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = item.disabled
                ? 'var(--text-3, #8A8A8A)'
                : 'var(--text, #1D1D1F)';
              const sc = e.currentTarget.querySelector('[data-sc]') as HTMLElement | null;
              if (sc) sc.style.color = '#8A8A8A';
            }}
            style={{
              width: 'calc(100% - 8px)',
              margin: '0 4px',
              height: 20,
              padding: '0 12px',
              border: 'none',
              borderRadius: 4,
              background: 'transparent',
              color: item.disabled
                ? 'var(--text-3, #8A8A8A)'
                : 'var(--text, #1D1D1F)',
              fontSize: 13,
              lineHeight: '20px',
              fontWeight: 400,
              fontFamily: FONT_UI,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              textAlign: 'left',
              cursor: 'default',
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span
                data-sc="true"
                style={{ fontSize: 11, color: '#8A8A8A', fontWeight: 400 }}
              >
                {item.shortcut}
              </span>
            )}
          </button>
          {item.dividerAfter && (
            <div
              style={{
                height: 1,
                margin: '5px 0',
                background: 'rgba(0, 0, 0, 0.1)',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <nav
      ref={barRef}
      aria-label="Menu Bar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: MENUBAR_HEIGHT,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px 0 8px',
        fontFamily: FONT_UI,
        background: 'var(--vibrancy-light, rgba(242, 242, 244, 0.80))',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.18)',
        boxShadow: 'inset 0 -0.5px 0 rgba(255, 255, 255, 0.5)',
        userSelect: 'none',
      }}
    >
      {/* Left: Monochrome Halcyon Mark + Bold App Name + Menus */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="Halcyon Menu"
            onClick={() => {
              playSound('click');
              setControlCenterOpen(false);
              setOpenMenu((prev) => (prev === '__mark__' ? null : '__mark__'));
            }}
            onMouseEnter={() => {
              if (openMenu && openMenu !== '__mark__') setOpenMenu('__mark__');
            }}
            style={{
              height: 21,
              padding: '0 10px',
              borderRadius: 4,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'default',
              color: openMenu === '__mark__' ? '#FFFFFF' : 'rgba(0, 0, 0, 0.85)',
              background:
                openMenu === '__mark__' ? 'var(--select, #3875D7)' : 'transparent',
            }}
          >
            <HalcyonMark size={15} variant="color" />
          </button>
          {openMenu === '__mark__' && renderDropdown(prismMenu)}
        </div>

        <span
          style={{
            fontSize: 13,
            lineHeight: '16px',
            fontWeight: 700,
            color: 'rgba(0, 0, 0, 0.85)',
            padding: '0 9px',
            whiteSpace: 'nowrap',
          }}
        >
          {activeAppLabel}
        </span>

        {displayedMenus.map((group) => {
          const isOpen = openMenu === group.label;
          return (
            <div key={group.label} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setControlCenterOpen(false);
                  setOpenMenu((prev) => (prev === group.label ? null : group.label));
                }}
                onMouseEnter={() => {
                  if (openMenu && openMenu !== group.label) {
                    setOpenMenu(group.label);
                  }
                }}
                style={{
                  height: 21,
                  padding: '0 9px',
                  borderRadius: 4,
                  border: 'none',
                  background: isOpen ? 'var(--select, #3875D7)' : 'transparent',
                  color: isOpen ? '#FFFFFF' : 'rgba(0, 0, 0, 0.85)',
                  fontSize: 13,
                  lineHeight: '16px',
                  fontWeight: 400,
                  fontFamily: FONT_UI,
                  cursor: 'default',
                  whiteSpace: 'nowrap',
                }}
              >
                {group.label}
              </button>
              {isOpen && renderDropdown(group)}
            </div>
          );
        })}
      </div>

      {/* Right: Monochrome Status Glyphs + Clock Only */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
          paddingRight: 2,
        }}
      >
        <button
          type="button"
          title={settings.soundEnabled ? 'Mute sound' : 'Unmute sound'}
          aria-label="Toggle Sound"
          onClick={() => {
            const next = !settings.soundEnabled;
            updateSettings({ soundEnabled: next });
            if (next) playSound('click');
          }}
          style={{
            height: 21,
            width: 20,
            padding: 0,
            border: 'none',
            background: 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
            opacity: 0.82,
          }}
        >
          <UIGlyph
            name={settings.soundEnabled ? 'speaker' : 'speaker-mute'}
            size={16}
            tone="dark"
          />
        </button>

        <button
          type="button"
          title="Halcyon Network"
          aria-label="Network Status"
          onClick={() => {
            playSound('click');
            openApp('browser', { url: 'halcyon://safenet' });
          }}
          style={{
            height: 21,
            width: 20,
            padding: 0,
            border: 'none',
            background: 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
            opacity: 0.82,
          }}
        >
          <UIGlyph name="wifi" size={16} tone="dark" />
        </button>

        <button
          type="button"
          title="Spotlight"
          aria-label="Open Spotlight"
          onClick={() => {
            playSound('click');
            setOpenMenu(null);
            setControlCenterOpen(false);
            setSpotlightOpen(true);
          }}
          style={{
            height: 21,
            width: 20,
            padding: 0,
            border: 'none',
            background: 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
            opacity: 0.82,
          }}
        >
          <UIGlyph name="search" size={16} tone="dark" />
        </button>

        <button
          type="button"
          title="Display and Sound"
          aria-label="Open Display and Sound Popover"
          onClick={() => {
            playSound('click');
            setOpenMenu(null);
            setControlCenterOpen((prev) => !prev);
          }}
          style={{
            height: 21,
            width: 22,
            padding: 0,
            borderRadius: 4,
            border: 'none',
            background: controlCenterOpen ? 'var(--select, #3875D7)' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
            opacity: controlCenterOpen ? 1 : 0.82,
          }}
        >
          <UIGlyph
            name="control"
            size={16}
            tone={controlCenterOpen ? 'light' : 'dark'}
          />
        </button>

        <span
          style={{
            fontSize: 13,
            lineHeight: '16px',
            fontWeight: 400,
            color: 'rgba(0, 0, 0, 0.85)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {clockText}
        </span>

        {/* Quick Controls Popover */}
        {controlCenterOpen && (
          <div
            role="dialog"
            aria-label="Quick Settings"
            className="hc-menu halcyon-pop-anim"
            style={{
              position: 'absolute',
              transformOrigin: 'top right',
              top: MENUBAR_HEIGHT + 4,
              right: 0,
              width: 268,
              padding: 12,
              borderRadius: 6,
              background: 'var(--vibrancy-menu, rgba(240, 240, 242, 0.92))',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              boxShadow:
                'var(--shadow-menu, 0 0 0 0.5px rgba(0,0,0,.25), 0 10px 30px rgba(0,0,0,.22))',
              zIndex: 1250,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              color: 'var(--text, #1D1D1F)',
              fontFamily: FONT_UI,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                Desktop Wallpaper
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {WALLPAPER_REGISTRY.map((wp) => {
                  const active = settings.wallpaper === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        updateSettings({ wallpaper: wp.id });
                      }}
                      style={{
                        height: 22,
                        padding: '0 8px',
                        border: 'none',
                        borderRadius: 4,
                        background: active ? 'var(--select, #3875D7)' : 'transparent',
                        color: active ? '#FFFFFF' : 'var(--text, #1D1D1F)',
                        fontSize: 12,
                        fontWeight: 400,
                        textAlign: 'left',
                        cursor: 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{wp.label}</span>
                      {active && <UIGlyph name="check" size={12} tone="light" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {settings.wallpaper === 'halcyon-live' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                  Lighting
                </div>
                <div className="hc-seg" style={{ width: '100%' }}>
                  {TIME_OF_DAY_OPTIONS.map((tod) => (
                    <button
                      key={tod.id}
                      type="button"
                      className={settings.timeOfDay === tod.id ? 'is-active' : ''}
                      onClick={() => {
                        playSound('click');
                        updateSettings({ timeOfDay: tod.id });
                      }}
                      style={{ flex: 1, padding: '0 4px' }}
                    >
                      {tod.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                <span>Sound Volume</span>
                <span style={{ fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                className="hc-slider"
                min={0}
                max={1}
                step={0.02}
                value={settings.volume}
                onChange={(e) =>
                  updateSettings({
                    volume: Number(e.target.value),
                    soundEnabled: Number(e.target.value) > 0,
                  })
                }
                style={{ width: '100%' }}
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                cursor: 'default',
              }}
            >
              <input
                type="checkbox"
                className="hc-check"
                checked={settings.dockMagnification}
                onChange={(e) => {
                  playSound('click');
                  updateSettings({ dockMagnification: e.target.checked });
                }}
              />
              <span>Dock magnification</span>
            </label>

            <div
              style={{
                borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                paddingTop: 8,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="hc-btn"
                onClick={() => {
                  playSound('click');
                  setControlCenterOpen(false);
                  openApp('control-panel');
                }}
              >
                Control Panel…
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
