import React, { useEffect } from 'react';
import { HalcyonMark, UIGlyph } from '../art';
import { useOS } from '../core/osStore';

interface PowerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TAPERED_LIGHT_DIVIDER =
  'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0) 5%, #FFFFFF 30%, #F5C46B 50%, #FFFFFF 70%, transparent 95%)';

export const PowerModal: React.FC<PowerModalProps> = ({ isOpen, onClose }) => {
  const { setPhase, playSound } = useOS();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStandBy = () => {
    playSound('minimize');
    setPhase('sleeping');
    onClose();
  };

  const handleTurnOff = () => {
    playSound('shutdown');
    setPhase('login');
    onClose();
  };

  const handleRestart = () => {
    playSound('shutdown');
    setPhase('booting');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="halcyon-power-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.18)',
        backdropFilter: 'grayscale(1) brightness(0.75)',
        WebkitBackdropFilter: 'grayscale(1) brightness(0.75)',
        transition: 'backdrop-filter 600ms ease, background-color 600ms ease',
        fontFamily: 'var(--font-ui)',
        userSelect: 'none',
      }}
    >
      {/* XP "Turn off computer" Dialog (314x200, r8) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '314px',
          height: '200px',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sheet)',
        }}
      >
        {/* Top Band (44px) */}
        <div
          style={{
            position: 'relative',
            height: '44px',
            flexShrink: 0,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #0B3A9E 0%, #1556C8 100%)',
            color: '#FFFFFF',
          }}
        >
          <h2
            id="halcyon-power-title"
            style={{
              margin: 0,
              fontFamily: 'var(--font-title)',
              fontSize: '15px',
              fontWeight: 400,
              color: '#FFFFFF',
              textShadow: '1px 1px 1px rgba(6, 20, 62, 0.70)',
            }}
          >
            Turn off Halcyon
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <HalcyonMark size={20} variant="color" />
          </div>

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
        </div>

        {/* Middle Field (--luna-field) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            backgroundColor: 'var(--luna-field)',
          }}
        >
          {/* Stand By — Amber #F5B53B */}
          <PowerJewelButton
            label="Stand By"
            background="linear-gradient(180deg, #FFD36B 0%, #F5B53B 55%, #D98A1A 100%)"
            onClick={handleStandBy}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10.4 3.2A5.2 5.2 0 1 0 12.8 11.4A4.2 4.2 0 0 1 10.4 3.2Z"
                  fill="#FFFFFF"
                />
              </svg>
            }
          />

          {/* Turn Off — Red #E2502C */}
          <PowerJewelButton
            label="Turn Off"
            background="linear-gradient(180deg, #F48365 0%, #E2502C 55%, #B83114 100%)"
            onClick={handleTurnOff}
            icon={<UIGlyph name="power" size={16} tone="light" />}
          />

          {/* Restart — Green #3C9A35 */}
          <PowerJewelButton
            label="Restart"
            background="linear-gradient(180deg, #7AD662 0%, #3C9A35 55%, #24721F 100%)"
            onClick={handleRestart}
            icon={<UIGlyph name="reload" size={16} tone="light" />}
          />
        </div>

        {/* Bottom Band (40px) */}
        <div
          style={{
            position: 'relative',
            height: '40px',
            flexShrink: 0,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            background: '#0B3A9E',
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

          <button type="button" className="hc-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface PowerJewelButtonProps {
  label: string;
  background: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const PowerJewelButton: React.FC<PowerJewelButtonProps> = ({
  label,
  background,
  icon,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '5px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background,
          border: '1px solid rgba(0, 0, 0, 0.35)',
          boxShadow:
            'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4)',
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '11px',
          fontWeight: 400,
          color: '#FFFFFF',
          textShadow: '1px 1px 1px rgba(6, 20, 62, 0.65)',
        }}
      >
        {label}
      </span>
    </button>
  );
};
