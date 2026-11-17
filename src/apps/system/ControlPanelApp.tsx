import React, { useEffect, useMemo, useState } from 'react';
import type {
  AvatarId,
  OSAppProps,
  SoundEffect,
  TimeOfDay,
  WallpaperId,
} from '../../core/types';
import { useOS } from '../../core/osStore';
import { WALLPAPER_REGISTRY } from '../../core/wallpapers';
import { AppIcon, AvatarIcon, BlissSonomaCanvas, HalcyonMark, PrefIcon, UIGlyph } from '../../art';

type PaneId =
  | 'home'
  | 'appearance'
  | 'desktop'
  | 'accounts'
  | 'sound'
  | 'displays'
  | 'datetime'
  | 'security';

interface PrefItem {
  id: PaneId | 'about';
  label: string;
  section: 'Personal' | 'Hardware' | 'System';
  renderIcon: () => React.ReactNode;
}

const TIMES_OF_DAY: { id: TimeOfDay; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'midday', label: 'Midday' },
  { id: 'golden', label: 'Golden Hour' },
  { id: 'midnight', label: 'Midnight' },
];

const SOUND_EFFECTS: { id: SoundEffect; label: string }[] = [
  { id: 'startup', label: 'Startup' },
  { id: 'login', label: 'Logon' },
  { id: 'shutdown', label: 'Shutdown' },
  { id: 'click', label: 'Click' },
  { id: 'open', label: 'Open' },
  { id: 'close', label: 'Close' },
  { id: 'minimize', label: 'Minimize' },
  { id: 'balloon', label: 'Balloon' },
  { id: 'error', label: 'Alert' },
  { id: 'trash', label: 'Trash' },
];

const AVATARS: { id: AvatarId; label: string }[] = [
  { id: 'butterfly', label: 'Butterfly' },
  { id: 'astronaut', label: 'Astronaut' },
  { id: 'chess', label: 'Chess' },
  { id: 'blossom', label: 'Blossom' },
  { id: 'guitar', label: 'Guitar' },
  { id: 'prism', label: 'Snowflake' },
];

function mapSectionToPane(section?: string): PaneId {
  switch (section) {
    case 'appearance':
      return 'appearance';
    case 'desktop':
    case 'wallpaper':
      return 'desktop';
    case 'accounts':
    case 'profile':
      return 'accounts';
    case 'sound':
    case 'sounds':
      return 'sound';
    case 'displays':
      return 'displays';
    case 'datetime':
      return 'datetime';
    case 'security':
    case 'safenet':
      return 'security';
    default:
      return 'home';
  }
}

export const ControlPanelApp: React.FC<OSAppProps> = ({
  isFocused,
  payload,
  setWindowTitle,
  setAppMenus,
}) => {
  const { settings, updateSettings, playSound, vfs, notify, setPhase, openApp } = useOS();

  const [history, setHistory] = useState<PaneId[]>(() => [mapSectionToPane(payload?.section)]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const currentPane = history[historyIdx] ?? 'home';

  useEffect(() => {
    if (payload?.section) {
      const next = mapSectionToPane(payload.section);
      setHistory([next]);
      setHistoryIdx(0);
    }
  }, [payload?.section]);

  const navigatePane = (pane: PaneId) => {
    if (pane === currentPane) return;
    playSound('click');
    setStyleMenuOpen(false);
    const nextHist = history.slice(0, historyIdx + 1);
    nextHist.push(pane);
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
  };

  useEffect(() => {
    const titles: Record<PaneId, string> = {
      home: 'Control Panel',
      appearance: 'Appearance',
      desktop: 'Desktop & Screen Saver',
      accounts: 'Accounts',
      sound: 'Sound',
      displays: 'Displays',
      datetime: 'Date & Time',
      security: 'Security',
    };
    setWindowTitle(titles[currentPane]);
  }, [currentPane, setWindowTitle]);

  useEffect(() => {
    if (!isFocused) return;
    setAppMenus([
      {
        label: 'View',
        items: [
          { label: 'Show All Categories', action: () => navigatePane('home'), dividerAfter: true },
          { label: 'Appearance', action: () => navigatePane('appearance') },
          { label: 'Desktop & Screen Saver', action: () => navigatePane('desktop') },
          { label: 'Accounts', action: () => navigatePane('accounts') },
          { label: 'Sound', action: () => navigatePane('sound') },
          { label: 'Displays', action: () => navigatePane('displays') },
          { label: 'Security', action: () => navigatePane('security') },
        ],
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, currentPane]);

  const prefItems: PrefItem[] = useMemo(
    () => [
      {
        id: 'appearance',
        label: 'Appearance',
        section: 'Personal',
        renderIcon: () => <PrefIcon id="pref-appearance" size={32} />,
      },
      {
        id: 'desktop',
        label: 'Desktop & Screen Saver',
        section: 'Personal',
        renderIcon: () => <PrefIcon id="pref-desktop" size={32} />,
      },
      {
        id: 'accounts',
        label: 'Accounts',
        section: 'Personal',
        renderIcon: () => <PrefIcon id="pref-accounts" size={32} />,
      },
      {
        id: 'sound',
        label: 'Sound',
        section: 'Hardware',
        renderIcon: () => <PrefIcon id="pref-sound" size={32} />,
      },
      {
        id: 'displays',
        label: 'Displays',
        section: 'Hardware',
        renderIcon: () => <AppIcon appId="navigator" size={32} />,
      },
      {
        id: 'datetime',
        label: 'Date & Time',
        section: 'System',
        renderIcon: () => <UIGlyph name="clock" size={28} tone="dark" />,
      },
      {
        id: 'security',
        label: 'Security',
        section: 'System',
        renderIcon: () => <UIGlyph name="shield-enamel" size={32} />,
      },
      {
        id: 'about',
        label: 'About Halcyon',
        section: 'System',
        renderIcon: () => <HalcyonMark size={32} variant="color" />,
      },
    ],
    []
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return prefItems;
    return prefItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [prefItems, searchQuery]);

  const vfsStats = useMemo(() => {
    const files = vfs.nodes.filter((n) => n.type === 'file').length;
    const folders = vfs.nodes.filter((n) => n.type === 'folder').length;
    const trashed = vfs.nodes.filter((n) => n.parentId === 'trash').length;
    const totalBytes = vfs.nodes.reduce((sum, n) => sum + (n.size || 0), 0);
    return { total: vfs.nodes.length, files, folders, trashed, totalBytes };
  }, [vfs.nodes]);

  const handleFactoryReset = () => {
    vfs.resetVFS();
    updateSettings({
      wallpaper: 'meadow',
      timeOfDay: 'midday',
      accentTheme: 'luna',
      glassOpacity: 0.8,
      soundEnabled: true,
      volume: 0.65,
      crtScanlines: false,
      dockMagnification: true,
    });
    setConfirmReset(false);
    playSound('balloon');
    notify({
      title: 'Halcyon Reset Complete',
      message: 'Virtual computer and preferences restored to defaults.',
      icon: 'control-panel',
    });
  };

  const windowStyleLabel =
    settings.accentTheme === 'graphite' || settings.accentTheme === 'sequoia-silver'
      ? 'Graphite'
      : 'Luna';

  const renderHomeGrid = () => {
    const sections: ('Personal' | 'Hardware' | 'System')[] = ['Personal', 'Hardware', 'System'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sections.map((sec) => {
          const items = filteredItems.filter((i) => i.section === sec);
          if (items.length === 0) return null;
          return (
            <section key={sec}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text)',
                  paddingBottom: 4,
                  marginBottom: 8,
                  borderBottom: '1px solid var(--etch-dark)',
                  boxShadow: '0 1px 0 var(--etch-light)',
                  textShadow: '0 1px 0 rgba(255, 255, 255, 0.75)',
                }}
              >
                {sec}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 'about') {
                        playSound('open');
                        openApp('about');
                      } else {
                        navigatePane(item.id);
                      }
                    }}
                    style={{
                      width: 88,
                      height: 76,
                      padding: '6px 4px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: 5,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.renderIcon()}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        lineHeight: '13px',
                        color: 'var(--text)',
                        textAlign: 'center',
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  const renderWallpaperThumbs = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {WALLPAPER_REGISTRY.map((wp) => {
        const active = settings.wallpaper === wp.id;
        return (
          <button
            key={wp.id}
            type="button"
            onClick={() => {
              playSound('click');
              updateSettings({ wallpaper: wp.id as WallpaperId });
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 96,
                height: 60,
                borderRadius: 3,
                overflow: 'hidden',
                background: wp.placeholderColor,
                border: '1px solid rgba(0, 0, 0, 0.35)',
                outline: active ? '3px solid var(--select)' : 'none',
                outlineOffset: 2,
                position: 'relative',
              }}
            >
              {wp.kind === 'photo' && wp.thumbSrc ? (
                <img
                  src={wp.thumbSrc}
                  alt={wp.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <BlissSonomaCanvas
                  wallpaper={wp.id}
                  timeOfDay={settings.timeOfDay}
                />
              )}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: active ? 700 : 400,
                color: 'var(--text)',
              }}
            >
              {wp.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--linen)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* 34px Mac System Preferences Toolbar (§9.5) */}
      <div className="hc-toolbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="hc-seg">
            <button
              type="button"
              title="Back"
              disabled={historyIdx <= 0}
              onClick={() => {
                playSound('click');
                setHistoryIdx((i) => Math.max(0, i - 1));
              }}
            >
              <UIGlyph name="back" size={14} tone="dark" disabled={historyIdx <= 0} />
            </button>
            <button
              type="button"
              title="Forward"
              disabled={historyIdx >= history.length - 1}
              onClick={() => {
                playSound('click');
                setHistoryIdx((i) => Math.min(history.length - 1, i + 1));
              }}
            >
              <UIGlyph
                name="forward"
                size={14}
                tone="dark"
                disabled={historyIdx >= history.length - 1}
              />
            </button>
          </div>

          <button
            type="button"
            className="hc-btn"
            disabled={currentPane === 'home'}
            onClick={() => navigatePane('home')}
          >
            Show All
          </button>
        </div>

        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span
            style={{
              position: 'absolute',
              left: 6,
              pointerEvents: 'none',
              display: 'inline-flex',
            }}
          >
            <UIGlyph name="search" size={14} tone="dark" />
          </span>
          <input
            className="hc-search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (currentPane !== 'home') navigatePane('home');
            }}
            placeholder="Search"
            style={{ width: 170 }}
          />
        </div>
      </div>

      {/* Main Content Area on Opaque --linen */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {currentPane === 'home' && renderHomeGrid()}

        {currentPane === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Window Style</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, minWidth: 96 }}>Appearance:</span>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="hc-popup"
                    style={{ width: 150 }}
                    onClick={() => setStyleMenuOpen((o) => !o)}
                  >
                    <span>{windowStyleLabel}</span>
                    <span
                      style={{
                        position: 'absolute',
                        right: 6,
                        display: 'inline-flex',
                      }}
                    >
                      <UIGlyph name="chevron-double" size={10} tone="dark" />
                    </span>
                  </button>
                  {styleMenuOpen && (
                    <div
                      className="hc-menu"
                      style={{
                        position: 'absolute',
                        top: 24,
                        left: 0,
                        width: 150,
                        zIndex: 40,
                      }}
                    >
                      {(
                        [
                          { id: 'luna', label: 'Luna' },
                          { id: 'graphite', label: 'Graphite' },
                        ] as const
                      ).map((opt) => (
                        <div
                          key={opt.id}
                          role="button"
                          tabIndex={0}
                          className="hc-menu-item"
                          onClick={() => {
                            playSound('click');
                            updateSettings({ accentTheme: opt.id });
                            setStyleMenuOpen(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateSettings({ accentTheme: opt.id });
                              setStyleMenuOpen(false);
                            }
                          }}
                        >
                          <span>{opt.label}</span>
                          {windowStyleLabel === opt.label && (
                            <UIGlyph name="check" size={12} tone="dark" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Desktop & Shelf</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    className="hc-check"
                    checked={settings.glassOpacity > 0.5}
                    onChange={(e) => {
                      playSound('click');
                      updateSettings({ glassOpacity: e.target.checked ? 0.8 : 0.45 });
                    }}
                  />
                  <span>Translucent menu bar and shelf</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    className="hc-check"
                    checked={settings.dockMagnification}
                    onChange={(e) => {
                      playSound('click');
                      updateSettings({ dockMagnification: e.target.checked });
                    }}
                  />
                  <span>Magnify icons on the Horizon Shelf</span>
                </label>
              </div>
            </div>

            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Wallpaper</span>
              {renderWallpaperThumbs()}
            </div>
          </div>
        )}

        {currentPane === 'desktop' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Wallpaper</span>
              {renderWallpaperThumbs()}
            </div>

            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Time of Day (Halcyon Live)</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {TIMES_OF_DAY.map((t) => (
                  <label
                    key={t.id}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="halcyon-tod"
                      className="hc-radio"
                      checked={settings.timeOfDay === t.id}
                      onChange={() => {
                        playSound('click');
                        updateSettings({ timeOfDay: t.id });
                      }}
                    />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentPane === 'accounts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">User Account</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 5,
                    border: '2px solid rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <AvatarIcon avatarId={settings.avatarId} size={48} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="cp-username" style={{ fontSize: 12, minWidth: 74 }}>
                      User name:
                    </label>
                    <input
                      id="cp-username"
                      className="hc-field"
                      value={settings.username}
                      maxLength={28}
                      onChange={(e) => updateSettings({ username: e.target.value })}
                      onBlur={(e) => {
                        if (!e.target.value.trim()) updateSettings({ username: 'Explorer' });
                      }}
                      style={{ width: 200 }}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="hc-btn"
                      onClick={() => {
                        playSound('click');
                        setPhase('login');
                      }}
                    >
                      Log Off…
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Picture</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {AVATARS.map((av) => {
                  const active = settings.avatarId === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        updateSettings({ avatarId: av.id });
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: 4,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 5,
                          overflow: 'hidden',
                          border: active
                            ? '2px solid var(--select)'
                            : '2px solid rgba(255, 255, 255, 0.9)',
                          outline: active ? '2px solid var(--select)' : 'none',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.28)',
                        }}
                      >
                        <AvatarIcon avatarId={av.id} size={48} />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: active ? 700 : 400,
                          color: 'var(--text)',
                        }}
                      >
                        {av.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentPane === 'sound' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Output Volume</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, minWidth: 105 }}>
                    Master volume ({Math.round(settings.volume * 100)}%):
                  </span>
                  <input
                    type="range"
                    className="hc-slider"
                    min={0}
                    max={1}
                    step={0.02}
                    value={settings.volume}
                    onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                    style={{ width: 200 }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    className="hc-check"
                    checked={!settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: !e.target.checked })}
                  />
                  <span>Mute system sound</span>
                </label>
              </div>
            </div>

            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Sound Effects</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SOUND_EFFECTS.map((fx) => (
                  <button
                    key={fx.id}
                    type="button"
                    className="hc-btn"
                    onClick={() => {
                      if (!settings.soundEnabled) updateSettings({ soundEnabled: true });
                      playSound(fx.id);
                    }}
                  >
                    {fx.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentPane === 'displays' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Display</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 196,
                    height: 124,
                    padding: 8,
                    borderRadius: 6,
                    background: 'linear-gradient(180deg, #DCDEE2 0%, #AEB2B9 100%)',
                    border: '1px solid #767A82',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      border: '1px solid #222',
                      overflow: 'hidden',
                      background: '#3F86E3',
                    }}
                  >
                    {settings.wallpaper !== 'halcyon-live' ? (
                      <img
                        src={
                          WALLPAPER_REGISTRY.find((w) => w.id === settings.wallpaper)?.thumbSrc ??
                          '/wallpapers/meadow-thumb.jpg'
                        }
                        alt="Display preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <BlissSonomaCanvas
                        wallpaper={settings.wallpaper}
                        timeOfDay={settings.timeOfDay}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      className="hc-check"
                      checked={settings.crtScanlines}
                      onChange={(e) => {
                        playSound('click');
                        updateSettings({ crtScanlines: e.target.checked });
                      }}
                    />
                    <span>CRT scanline overlay</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12 }}>Shelf opacity:</span>
                    <input
                      type="range"
                      className="hc-slider"
                      min={0.45}
                      max={0.95}
                      step={0.01}
                      value={settings.glassOpacity}
                      onChange={(e) => updateSettings({ glassOpacity: parseFloat(e.target.value) })}
                      style={{ width: 130 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPane === 'datetime' && (
          <div className="hc-groupbox">
            <span className="hc-groupbox-legend">Date & Time</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                Current system time: <strong>{new Date().toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {TIMES_OF_DAY.map((t) => (
                  <label
                    key={t.id}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="cp-dt-tod"
                      className="hc-radio"
                      checked={settings.timeOfDay === t.id}
                      onChange={() => {
                        playSound('click');
                        updateSettings({ timeOfDay: t.id });
                      }}
                    />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentPane === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Halcyon Library Policy</span>
              <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: 'var(--text-2)' }}>
                Safari Explorer restricts web requests to Wikipedia and built-in Halcyon pages. External addresses and third-party scripts are blocked.
              </p>
            </div>

            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Virtual Filesystem</span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <div>
                  Objects: {vfsStats.total} ({vfsStats.folders} folders, {vfsStats.files} files,{' '}
                  {vfsStats.trashed} in Trash)
                </div>
                <div>Storage used: {(vfsStats.totalBytes / 1024).toFixed(1)} KB</div>
              </div>
            </div>

            <div className="hc-groupbox">
              <span className="hc-groupbox-legend">Reset Computer</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  Restore sample files and default system preferences.
                </span>
                {!confirmReset ? (
                  <button
                    type="button"
                    className="hc-btn"
                    onClick={() => {
                      playSound('error');
                      setConfirmReset(true);
                    }}
                  >
                    Reset Computer…
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="hc-btn hc-btn--default"
                      onClick={handleFactoryReset}
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      className="hc-btn"
                      onClick={() => setConfirmReset(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
