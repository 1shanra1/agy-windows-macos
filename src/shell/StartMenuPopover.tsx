import React, { useState } from 'react';
import { AppIcon, AvatarIcon, FileTypeIcon, UIGlyph } from '../art';
import { useOS } from '../core/osStore';
import type { AppId, WindowInstance } from '../core/types';
import { APP_META, FONT_TITLE, FONT_UI } from './shellTheme';

export const StartMenuPopover: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpenPowerModal: () => void;
}> = ({ isOpen, onClose, onOpenPowerModal }) => {
  const { settings, openApp, setPhase, playSound, setSpotlightOpen } = useOS();
  const [allProgramsOpen, setAllProgramsOpen] = useState(false);

  if (!isOpen) return null;

  const launch = (appId: AppId, payload?: WindowInstance['payload']) => {
    playSound('click');
    openApp(appId, payload);
    setAllProgramsOpen(false);
    onClose();
  };

  const pinnedApps: AppId[] = ['browser', 'wordleaf'];
  const mfuApps: AppId[] = ['media-player', 'paint', 'sticky-notes', 'navigator'];
  const allApps: AppId[] = [
    'navigator',
    'browser',
    'wordleaf',
    'media-player',
    'paint',
    'sticky-notes',
    'control-panel',
    'about',
  ];

  return (
    <div
      role="dialog"
      aria-label="Start Menu"
      className="halcyon-pop-anim"
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'relative',
        transformOrigin: 'bottom left',
        width: 400,
        minHeight: 480,
        maxWidth: 'calc(100vw - 16px)',
        borderRadius: 8,
        overflow: 'visible',
        background: '#FFFFFF',
        fontFamily: FONT_UI,
        boxShadow:
          'var(--shadow-menu, 0 0 0 0.5px rgba(0,0,0,.25), 0 10px 30px rgba(0,0,0,.22))',
        border: '1px solid #0B3A9E',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 54px XP Header */}
      <div
        style={{
          height: 54,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderRadius: '7px 7px 0 0',
          background:
            'linear-gradient(180deg, #3E8BEE 0%, #1D66DB 45%, #1556C8 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.45)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 5,
            border: '2px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AvatarIcon avatarId={settings.avatarId} size={36} />
        </div>
        <span
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 14,
            fontWeight: 700,
            color: '#FFFFFF',
            textShadow: '1px 1px 1px rgba(6, 20, 62, 0.70)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {settings.username}
        </span>
      </div>

      {/* 2px Tapered Orange-Gold Line */}
      <div
        aria-hidden="true"
        style={{
          height: 2,
          background:
            'linear-gradient(90deg, transparent, #F5A43B 30%, #F5A43B 70%, transparent)',
        }}
      />

      {/* Two-Column Opaque Body (56% / 44%) */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '56% 44%',
          minHeight: 382,
        }}
      >
        {/* Left Column: White, Pinned + MFU + All Programs */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '6px 4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {/* Pinned Apps (34px rows, 32px icon, 12/700, NO subtitles) */}
            {pinnedApps.map((appId) => (
              <button
                key={appId}
                type="button"
                onClick={() => launch(appId)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--select, #3875D7)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#1D1D1F';
                }}
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 8px',
                  border: 'none',
                  borderRadius: 0,
                  background: 'transparent',
                  color: '#1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: FONT_UI,
                  textAlign: 'left',
                  cursor: 'default',
                }}
              >
                <AppIcon appId={appId} size={32} />
                <span>{APP_META[appId].name}</span>
              </button>
            ))}

            {/* Tapered Separator */}
            <div
              style={{
                height: 1,
                margin: '6px 8px',
                background:
                  'linear-gradient(90deg, transparent, rgba(0,0,0,0.16) 20%, rgba(0,0,0,0.16) 80%, transparent)',
              }}
            />

            {/* MFU Apps (30px rows, 24px icon, 12/400) */}
            {mfuApps.map((appId) => (
              <button
                key={appId}
                type="button"
                onClick={() => launch(appId)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--select, #3875D7)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#1D1D1F';
                }}
                style={{
                  width: '100%',
                  height: 30,
                  padding: '0 8px',
                  border: 'none',
                  borderRadius: 0,
                  background: 'transparent',
                  color: '#1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 400,
                  fontFamily: FONT_UI,
                  textAlign: 'left',
                  cursor: 'default',
                }}
              >
                <AppIcon appId={appId} size={24} />
                <span>{APP_META[appId].name}</span>
              </button>
            ))}
          </div>

          {/* All Programs Footer Row */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                height: 1,
                margin: '4px 8px',
                background:
                  'linear-gradient(90deg, transparent, rgba(0,0,0,0.16) 20%, rgba(0,0,0,0.16) 80%, transparent)',
              }}
            />
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setAllProgramsOpen((prev) => !prev);
              }}
              onMouseEnter={(e) => {
                setAllProgramsOpen(true);
                e.currentTarget.style.background = 'var(--select, #3875D7)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#1D1D1F';
              }}
              style={{
                width: '100%',
                height: 28,
                padding: '0 10px',
                border: 'none',
                borderRadius: 0,
                background: 'transparent',
                color: '#1D1D1F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONT_UI,
                cursor: 'default',
              }}
            >
              <span>All Programs</span>
              <UIGlyph name="all-programs" size={16} />
            </button>

            {allProgramsOpen && (
              <div
                className="hc-menu halcyon-pop-anim"
                onMouseLeave={() => setAllProgramsOpen(false)}
                style={{
                  position: 'absolute',
                  transformOrigin: 'bottom left',
                  left: 'calc(100% + 4px)',
                  bottom: 0,
                  width: 210,
                  zIndex: 1150,
                  padding: '4px 4px',
                  borderRadius: 6,
                  background: 'var(--vibrancy-menu, rgba(240, 240, 242, 0.94))',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  boxShadow:
                    'var(--shadow-menu, 0 0 0 0.5px rgba(0,0,0,.25), 0 10px 30px rgba(0,0,0,.22))',
                }}
              >
                {allApps.map((appId) => (
                  <button
                    key={appId}
                    type="button"
                    onClick={() => launch(appId)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--select, #3875D7)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#1D1D1F';
                    }}
                    style={{
                      width: '100%',
                      height: 24,
                      padding: '0 8px',
                      border: 'none',
                      borderRadius: 4,
                      background: 'transparent',
                      color: '#1D1D1F',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 400,
                      fontFamily: FONT_UI,
                      textAlign: 'left',
                      cursor: 'default',
                    }}
                  >
                    <AppIcon appId={appId} size={16} />
                    <span>{APP_META[appId].name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: #D3E5FA, 26px rows, 24px icons, #0C2A6A */}
        <div
          style={{
            background: '#D3E5FA',
            borderLeft: '1px solid #95BDEE',
            padding: '6px 4px',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {[
            { label: 'My Documents', folderId: 'documents' },
            { label: 'My Pictures', folderId: 'pictures' },
            { label: 'My Music', folderId: 'music' },
          ].map((item) => (
            <button
              key={item.folderId}
              type="button"
              onClick={() => launch('navigator', { section: item.folderId })}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--select, #3875D7)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#0C2A6A';
              }}
              style={{
                width: '100%',
                height: 26,
                padding: '0 8px',
                border: 'none',
                borderRadius: 0,
                background: 'transparent',
                color: '#0C2A6A',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONT_UI,
                textAlign: 'left',
                cursor: 'default',
              }}
            >
              <FileTypeIcon isFolder folderId={item.folderId} size={24} />
              <span>{item.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => launch('navigator', { section: 'computer' })}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--select, #3875D7)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#0C2A6A';
            }}
            style={{
              width: '100%',
              height: 26,
              padding: '0 8px',
              border: 'none',
              borderRadius: 0,
              background: 'transparent',
              color: '#0C2A6A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: FONT_UI,
              textAlign: 'left',
              cursor: 'default',
            }}
          >
            <AppIcon appId="navigator" size={24} />
            <span>My Computer</span>
          </button>

          <div
            style={{
              height: 1,
              margin: '6px 8px',
              background:
                'linear-gradient(90deg, transparent, rgba(12,42,106,0.22) 20%, rgba(12,42,106,0.22) 80%, transparent)',
            }}
          />

          <button
            type="button"
            onClick={() => launch('control-panel')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--select, #3875D7)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#0C2A6A';
            }}
            style={{
              width: '100%',
              height: 26,
              padding: '0 8px',
              border: 'none',
              borderRadius: 0,
              background: 'transparent',
              color: '#0C2A6A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 400,
              fontFamily: FONT_UI,
              textAlign: 'left',
              cursor: 'default',
            }}
          >
            <AppIcon appId="control-panel" size={24} />
            <span>Control Panel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
              setSpotlightOpen(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--select, #3875D7)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#0C2A6A';
            }}
            style={{
              width: '100%',
              height: 26,
              padding: '0 8px',
              border: 'none',
              borderRadius: 0,
              background: 'transparent',
              color: '#0C2A6A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 400,
              fontFamily: FONT_UI,
              textAlign: 'left',
              cursor: 'default',
            }}
          >
            <UIGlyph name="loupe" size={24} />
            <span>Search…</span>
          </button>

          <button
            type="button"
            onClick={() => launch('about')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--select, #3875D7)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#0C2A6A';
            }}
            style={{
              width: '100%',
              height: 26,
              padding: '0 8px',
              border: 'none',
              borderRadius: 0,
              background: 'transparent',
              color: '#0C2A6A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 400,
              fontFamily: FONT_UI,
              textAlign: 'left',
              cursor: 'default',
            }}
          >
            <AppIcon appId="about" size={24} />
            <span>About Halcyon…</span>
          </button>
        </div>
      </div>

      {/* 40px Footer Bar: No Outlined Pill Buttons */}
      <div
        style={{
          height: 40,
          padding: '0 12px',
          borderRadius: '0 0 7px 7px',
          background:
            'linear-gradient(180deg, #3E8BEE 0%, #1D66DB 45%, #1556C8 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 14,
        }}
      >
        <button
          type="button"
          onClick={() => {
            playSound('shutdown');
            onClose();
            setPhase('login');
          }}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '2px 4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 400,
            fontFamily: FONT_UI,
            cursor: 'pointer',
          }}
        >
          <UIGlyph name="key-jewel" size={22} />
          <span>Log Off</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playSound('click');
            onClose();
            onOpenPowerModal();
          }}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '2px 4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 400,
            fontFamily: FONT_UI,
            cursor: 'pointer',
          }}
        >
          <UIGlyph name="power-jewel" size={22} />
          <span>Turn Off Computer</span>
        </button>
      </div>
    </div>
  );
};
