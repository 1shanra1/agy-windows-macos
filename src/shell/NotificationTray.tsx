import React from 'react';
import { AppIcon, UIGlyph } from '../art';
import { useOS } from '../core/osStore';
import type { NotificationBalloon } from '../core/types';
import { FONT_UI } from './shellTheme';

export const NotificationTray: React.FC = () => {
  const { notifications, dismissNotification, playSound } = useOS();

  if (notifications.length === 0) return null;

  const renderIcon = (icon?: NotificationBalloon['icon']) => {
    if (!icon || icon === 'info') {
      return <UIGlyph name="info" size={16} tone="dark" />;
    }
    if (icon === 'shield') {
      return <UIGlyph name="shield" size={16} tone="dark" />;
    }
    if (icon === 'sparkles') {
      return <UIGlyph name="star" size={16} tone="dark" />;
    }
    return <AppIcon appId={icon} size={16} />;
  };

  return (
    <aside
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: 68,
        right: 16,
        zIndex: 1300,
        maxWidth: 300,
        width: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: FONT_UI,
        pointerEvents: 'none',
      }}
    >
      {notifications.map((balloon, idx) => {
        const isLast = idx === notifications.length - 1;
        return (
          <div
            key={balloon.id}
            role="status"
            className="halcyon-pop-anim"
            style={{
              position: 'relative',
              transformOrigin: 'bottom right',
              pointerEvents: 'auto',
              padding: '10px 12px',
              borderRadius: 6,
              background: 'var(--balloon, #FFFFE1)',
              border: '1px solid rgba(0, 0, 0, 0.6)',
              boxShadow: '2px 3px 6px rgba(0, 0, 0, 0.25)',
              color: 'var(--text, #1D1D1F)',
            }}
          >
            {/* Header Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span style={{ display: 'flex', flexShrink: 0 }}>
                  {renderIcon(balloon.icon)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    lineHeight: '16px',
                    fontWeight: 700,
                    color: 'var(--text, #1D1D1F)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {balloon.title}
                </span>
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                className="hc-btn hc-btn--sm"
                onClick={() => {
                  playSound('click');
                  dismissNotification(balloon.id);
                }}
                style={{
                  width: 14,
                  height: 14,
                  minWidth: 14,
                  padding: 0,
                  borderRadius: 3,
                  flexShrink: 0,
                }}
              >
                <UIGlyph name="close" size={9} tone="dark" />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                fontSize: 12,
                lineHeight: '16px',
                fontWeight: 400,
                color: 'var(--text, #1D1D1F)',
              }}
            >
              {balloon.message}
            </div>

            {/* Optional Action Button */}
            {balloon.actionLabel && balloon.onAction && (
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="hc-btn hc-btn--sm"
                  onClick={() => {
                    playSound('click');
                    balloon.onAction?.();
                    dismissNotification(balloon.id);
                  }}
                >
                  {balloon.actionLabel}
                </button>
              </div>
            )}

            {/* 14px XP Balloon Pointer Tail */}
            {isLast && (
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                style={{
                  position: 'absolute',
                  bottom: -14,
                  right: 22,
                  pointerEvents: 'none',
                }}
              >
                <path
                  d="M0 0 L13 0 L13 13 Z"
                  fill="#FFFFE1"
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth="1"
                />
                <line x1="0" y1="0" x2="13" y2="0" stroke="#FFFFE1" strokeWidth="2" />
              </svg>
            )}
          </div>
        );
      })}
    </aside>
  );
};
