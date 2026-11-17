import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HalcyonMark } from '../art';

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState(false);
  const completedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const finishBoot = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setFadingOut(true);
    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, 400);
    timersRef.current.push(doneTimer);
  }, [onComplete]);

  useEffect(() => {
    const bootTimer = window.setTimeout(() => {
      finishBoot();
    }, 2650);
    timersRef.current = [bootTimer];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        finishBoot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [finishBoot]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Starting Halcyon"
      onClick={finishBoot}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000000',
        color: '#FFFFFF',
        fontFamily: 'var(--font-ui)',
        userSelect: 'none',
        overflow: 'hidden',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 400ms ease',
      }}
    >
      <style>{`
        @keyframes halcyonXpBootMarch {
          0% {
            transform: translateX(-32px);
          }
          100% {
            transform: translateX(124px);
          }
        }
      `}</style>

      {/* Centre lockup at 44% height */}
      <div
        style={{
          position: 'absolute',
          top: '44%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <HalcyonMark size={72} variant="color" />

        <h1
          style={{
            margin: '18px 0 0',
            fontFamily: 'var(--font-wordmark)',
            fontSize: '34px',
            fontWeight: 400,
            letterSpacing: '0.01em',
            lineHeight: 1.1,
            color: '#FFFFFF',
          }}
        >
          Halcyon
        </h1>

        {/* 56px below wordmark: XP 3-block loader (124x12, r3) */}
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            marginTop: '56px',
            width: '124px',
            height: '12px',
            borderRadius: '3px',
            background: '#000000',
            border: '1px solid #4A4A4A',
            boxShadow:
              'inset 0 1px 2px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              animation: 'halcyonXpBootMarch 2.0s linear infinite',
              animationDelay: '-0.65s',
              willChange: 'transform',
            }}
          >
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                style={{
                  display: 'block',
                  width: '8px',
                  height: '6px',
                  borderRadius: '1px',
                  background:
                    'linear-gradient(180deg, #9CCBFF 0%, #2C6FE0 60%, #1C4FB8 100%)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom-left copyright only */}
      <div
        style={{
          position: 'fixed',
          left: '24px',
          bottom: '24px',
          fontSize: '11px',
          fontWeight: 400,
          color: '#6B6B6B',
        }}
      >
        Copyright &copy; 2026 Halcyon
      </div>
    </div>
  );
};
