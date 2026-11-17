import React, { useEffect, useRef, useState } from 'react';
import { AvatarIcon, HalcyonMark, UIGlyph } from '../art';
import { useOS } from '../core/osStore';
import { PowerModal } from './PowerModal';

const TAPERED_LIGHT_DIVIDER =
  'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0) 5%, #FFFFFF 30%, #F5C46B 50%, #FFFFFF 70%, transparent 95%)';

export const WelcomeLogin: React.FC = () => {
  const { settings, setPhase, playSound, notify } = useOS();

  const [now, setNow] = useState(() => new Date());
  const [selectedTile, setSelectedTile] = useState<'primary' | null>(null);
  const [hoveredTile, setHoveredTile] = useState<'primary' | 'guest' | null>(null);
  const [password, setPassword] = useState('');
  const [welcomeText, setWelcomeText] = useState<string | null>(null);
  const [powerOpen, setPowerOpen] = useState(false);

  const loginTimerRef = useRef<number | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (loginTimerRef.current !== null) {
        window.clearTimeout(loginTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedTile === 'primary') {
      passwordInputRef.current?.focus();
    }
  }, [selectedTile]);

  const handleLogin = (profileLabel: string) => {
    if (welcomeText !== null) return;
    playSound('startup');
    setWelcomeText(profileLabel);

    loginTimerRef.current = window.setTimeout(() => {
      notify({
        title: `Welcome, ${profileLabel}`,
        message: 'Halcyon is ready.',
        icon: 'info',
      });
      setPhase('desktop');
    }, 600);
  };

  const formattedTime = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const formattedDate = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const isWelcoming = welcomeText !== null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        fontFamily: 'var(--font-ui)',
        color: '#FFFFFF',
        userSelect: 'none',
      }}
    >
      <style>{`
        .halcyon-welcome-grid {
          position: relative;
          width: 100%;
          max-width: 900px;
          display: grid;
          grid-template-columns: 1fr 1px 1fr;
          align-items: center;
        }
        .halcyon-welcome-left {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          padding-right: 40px;
        }
        .halcyon-welcome-right {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          padding-left: 40px;
        }
        .halcyon-welcome-divider {
          width: 1px;
          height: 60vh;
          max-height: 360px;
          background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.7) 30%, rgba(255, 255, 255, 0.7) 70%, transparent);
        }
        @media (max-width: 760px) {
          .halcyon-welcome-grid {
            grid-template-columns: 1fr;
            justify-items: center;
            gap: 20px;
          }
          .halcyon-welcome-left {
            align-items: center;
            text-align: center;
            padding-right: 0;
          }
          .halcyon-welcome-right {
            align-items: center;
            padding-left: 0;
          }
          .halcyon-welcome-divider {
            width: 240px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7) 30%, rgba(255, 255, 255, 0.7) 70%, transparent);
          }
        }
      `}</style>

      {/* Top Band (76px) */}
      <header
        style={{
          position: 'relative',
          height: '76px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, #00309C 0%, #0B3A9E 100%)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '2px',
            background: TAPERED_LIGHT_DIVIDER,
          }}
        />
      </header>

      {/* Middle Field (--luna-field with top-left radial lift, no wallpaper) */}
      <main
        onClick={() => {
          if (selectedTile !== null) {
            setSelectedTile(null);
            setPassword('');
          }
        }}
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 24px',
          backgroundColor: 'var(--luna-field)',
          backgroundImage:
            'radial-gradient(ellipse 62% 68% at 15% 20%, #89A9EC 0%, transparent 72%)',
        }}
      >
        {isWelcoming ? (
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '48px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#FFFFFF',
              textShadow: '2px 2px 3px rgba(6, 20, 62, 0.65)',
              letterSpacing: '-0.01em',
            }}
          >
            welcome
          </div>
        ) : (
          <div className="halcyon-welcome-grid">
            {/* Left Half: Sonoma Clock + Halcyon Wordmark + Prompt */}
            <div className="halcyon-welcome-left">
              <div
                style={{
                  fontFamily: 'var(--font-clock)',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.75)',
                  lineHeight: 1.3,
                }}
              >
                {formattedDate}
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-clock)',
                  fontSize: '72px',
                  fontWeight: 200,
                  lineHeight: 1.02,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  color: '#FFFFFF',
                }}
              >
                {formattedTime}
              </div>

              <div
                style={{
                  marginTop: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <HalcyonMark size={48} variant="color" />
                <span
                  style={{
                    fontFamily: 'var(--font-wordmark)',
                    fontSize: '30px',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                    color: '#FFFFFF',
                    lineHeight: 1.1,
                  }}
                >
                  Halcyon
                </span>
              </div>

              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#FFFFFF',
                }}
              >
                To begin, click your user name
              </p>
            </div>

            {/* Centre Vertical Divider */}
            <div aria-hidden="true" className="halcyon-welcome-divider" />

            {/* Right Half: User Tiles */}
            <div className="halcyon-welcome-right">
              {/* Primary User Tile */}
              {(() => {
                const isSelected = selectedTile === 'primary';
                const isLit = isSelected || hoveredTile === 'primary';
                return (
                  <div
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => setHoveredTile('primary')}
                    onMouseLeave={() => setHoveredTile(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSelected) {
                        playSound('click');
                        setSelectedTile('primary');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isSelected) {
                          playSound('click');
                          setSelectedTile('primary');
                        }
                      }
                    }}
                    style={{
                      width: '320px',
                      minHeight: '64px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: isSelected ? 'flex-start' : 'center',
                      gap: '14px',
                      cursor: 'pointer',
                      background: isLit
                        ? 'linear-gradient(90deg, #1E4FBF 0%, rgba(30, 79, 191, 0) 100%)'
                        : 'transparent',
                    }}
                  >
                    {/* Framed 48px Portrait */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: '48px',
                        height: '48px',
                        borderRadius: '5px',
                        border: isLit
                          ? '2px solid #F5C46B'
                          : '2px solid rgba(255, 255, 255, 0.9)',
                        boxShadow:
                          '0 2px 4px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(0, 0, 0, 0.2)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#315AC2',
                      }}
                    >
                      <AvatarIcon avatarId={settings.avatarId} size={44} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-title)',
                          fontSize: '18px',
                          fontWeight: 400,
                          lineHeight: 1.25,
                          color: '#FFFFFF',
                          textShadow: '1px 1px 1px rgba(6, 20, 62, 0.70)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {settings.username}
                      </div>

                      {isSelected && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleLogin(settings.username);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ marginTop: '6px' }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 400,
                              color: '#FFFFFF',
                              marginBottom: '4px',
                            }}
                          >
                            Type your password
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              ref={passwordInputRef}
                              type="password"
                              className="hc-field"
                              aria-label="Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              style={{ width: '180px' }}
                            />
                            <button
                              type="submit"
                              aria-label="Log on"
                              style={{
                                width: '22px',
                                height: '22px',
                                padding: 0,
                                borderRadius: '4px',
                                border: '1px solid #1E5E1A',
                                background:
                                  'linear-gradient(180deg, #8AD96E 0%, #4FB23F 16%, #3C9A35 50%, #24721F 100%)',
                                boxShadow:
                                  'inset 0 1px 0 rgba(255, 255, 255, 0.55), 0 1px 2px rgba(0, 0, 0, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            >
                              <UIGlyph name="forward" size={12} tone="light" />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Second Tile: Guest (64px, no subtitle copy) */}
              <button
                type="button"
                onMouseEnter={() => setHoveredTile('guest')}
                onMouseLeave={() => setHoveredTile(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin('Guest');
                }}
                style={{
                  width: '320px',
                  height: '64px',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background:
                    hoveredTile === 'guest'
                      ? 'linear-gradient(90deg, #1E4FBF 0%, rgba(30, 79, 191, 0) 100%)'
                      : 'transparent',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: '48px',
                    height: '48px',
                    borderRadius: '5px',
                    border:
                      hoveredTile === 'guest'
                        ? '2px solid #F5C46B'
                        : '2px solid rgba(255, 255, 255, 0.9)',
                    boxShadow:
                      '0 2px 4px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(0, 0, 0, 0.2)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#315AC2',
                  }}
                >
                  <AvatarIcon avatarId="astronaut" size={44} />
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '18px',
                    fontWeight: 400,
                    color: '#FFFFFF',
                    textShadow: '1px 1px 1px rgba(6, 20, 62, 0.70)',
                  }}
                >
                  Guest
                </span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Band (76px) */}
      <footer
        style={{
          position: 'relative',
          height: '76px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'linear-gradient(180deg, #00309C 0%, #0B3A9E 100%)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '2px',
            background: TAPERED_LIGHT_DIVIDER,
          }}
        />

        <button
          type="button"
          onClick={() => {
            playSound('click');
            setPowerOpen(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: '#FFFFFF',
            fontFamily: 'var(--font-ui)',
            fontSize: '13px',
            fontWeight: 400,
            cursor: 'pointer',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '4px',
              background: 'linear-gradient(180deg, #F07A5A 0%, #C83A1E 100%)',
              border: '1px solid rgba(0, 0, 0, 0.35)',
              boxShadow:
                'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 2px rgba(0, 0, 0, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UIGlyph name="power" size={13} tone="light" />
          </span>
          <span>Turn off Halcyon</span>
        </button>

        <div
          style={{
            fontSize: '11px',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '260px',
            textAlign: 'right',
            lineHeight: 1.35,
          }}
        >
          After you log on, you can add or change accounts.
        </div>
      </footer>

      <PowerModal isOpen={powerOpen} onClose={() => setPowerOpen(false)} />
    </div>
  );
};
