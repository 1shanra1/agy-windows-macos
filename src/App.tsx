import React, { useEffect, useState } from 'react';
import { BlissSonomaCanvas, StartPrismOrb } from './art';
import { WindowAppContent } from './apps/registry';
import { BootSequence, PowerModal, WelcomeLogin } from './boot';
import { useOS } from './core/osStore';
import type { TimeOfDay, WallpaperId } from './core/types';
import { getWallpaperEntry } from './core/wallpapers';
import {
  DesktopSurface,
  MenuBar,
  NotificationTray,
  SpotlightRun,
  TaskDock,
  WindowFrame,
} from './shell';

const WallpaperBackdrop: React.FC<{
  wallpaper: WallpaperId;
  timeOfDay: TimeOfDay;
}> = ({ wallpaper, timeOfDay }) => {
  const entry = getWallpaperEntry(wallpaper);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (entry.kind !== 'photo' || !entry.src) {
      setLoadedSrc(null);
      setFailedSrc(null);
      return;
    }

    let cancelled = false;
    const targetSrc = entry.src;
    setFailedSrc(null);

    const img = new Image();
    img.src = targetSrc;
    const handleReady = () => {
      if (!cancelled) setLoadedSrc(targetSrc);
    };
    const handleError = () => {
      if (!cancelled) setFailedSrc(targetSrc);
    };

    if (typeof img.decode === 'function') {
      img
        .decode()
        .then(handleReady)
        .catch(() => {
          if (img.complete && img.naturalWidth > 0) {
            handleReady();
          } else {
            handleError();
          }
        });
    } else {
      img.onload = handleReady;
      img.onerror = handleError;
    }

    return () => {
      cancelled = true;
    };
  }, [entry.kind, entry.src]);

  if (entry.kind === 'canvas' || (entry.src && failedSrc === entry.src)) {
    return (
      <BlissSonomaCanvas
        wallpaper={wallpaper}
        timeOfDay={timeOfDay}
        interactive
      />
    );
  }

  const isDecoded = Boolean(entry.src && loadedSrc === entry.src);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: entry.placeholderColor,
        zIndex: 0,
      }}
    >
      {entry.src && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: entry.placeholderColor,
            backgroundImage: `url(${entry.src})`,
            backgroundPosition: entry.objectPosition,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            opacity: isDecoded ? 1 : 0,
            transition: 'opacity 400ms ease',
          }}
        />
      )}
    </div>
  );
};

const SleepOverlay: React.FC<{ onWake: () => void }> = ({ onWake }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      onWake();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onWake]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Wake Halcyon from sleep"
      onClick={onWake}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        color: '#FFFFFF',
        cursor: 'pointer',
        animation: 'halcyonFadeIn 400ms ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <StartPrismOrb size={64} />
        <div
          style={{
            fontFamily: 'var(--font-wordmark)',
            fontSize: 30,
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}
        >
          Halcyon
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.65)',
          }}
        >
          Click or press any key to wake
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const {
    phase,
    setPhase,
    settings,
    windows,
    focusedWindowId,
    playSound,
  } = useOS();
  const [powerModalOpen, setPowerModalOpen] = useState(false);

  const rootClass = settings.crtScanlines ? 'crt-scanlines-active' : '';

  if (phase === 'booting') {
    return (
      <div className={rootClass} style={{ width: '100%', height: '100%' }}>
        <BootSequence
          onComplete={() => {
            setPhase('login');
          }}
        />
      </div>
    );
  }

  if (phase === 'login') {
    return (
      <div className={rootClass} style={{ width: '100%', height: '100%' }}>
        <WelcomeLogin />
      </div>
    );
  }

  return (
    <div
      className={rootClass}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Desktop compositor layer: desaturates when XP Turn Off dialog opens (§8.3) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: powerModalOpen ? 'grayscale(1) brightness(0.75)' : 'none',
          transition: 'filter 600ms ease',
        }}
      >
        <WallpaperBackdrop
          wallpaper={settings.wallpaper}
          timeOfDay={settings.timeOfDay}
        />

        <MenuBar onOpenPowerModal={() => setPowerModalOpen(true)} />

        <DesktopSurface />

        {windows.map((win) => (
          <WindowFrame key={win.id} win={win}>
            <WindowAppContent
              win={win}
              isFocused={focusedWindowId === win.id && !win.isMinimized}
            />
          </WindowFrame>
        ))}

        <TaskDock onOpenPowerModal={() => setPowerModalOpen(true)} />

        <SpotlightRun />

        <NotificationTray />
      </div>

      <PowerModal
        isOpen={powerModalOpen}
        onClose={() => setPowerModalOpen(false)}
      />

      {phase === 'sleeping' && (
        <SleepOverlay
          onWake={() => {
            playSound('login');
            setPhase('desktop');
          }}
        />
      )}
    </div>
  );
};
