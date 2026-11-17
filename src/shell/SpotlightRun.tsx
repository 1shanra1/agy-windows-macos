import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon, FileTypeIcon, UIGlyph } from '../art';
import { useOS } from '../core/osStore';
import type { AppId, VFSNode } from '../core/types';
import { WALLPAPER_REGISTRY } from '../core/wallpapers';
import { APP_META, FONT_UI, TIME_OF_DAY_OPTIONS } from './shellTheme';

interface SpotlightEntry {
  id: string;
  group: 'Top Hit' | 'Applications' | 'Documents & Folders' | 'System Preferences';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onExecute: () => void;
}

function evaluateMath(raw: string): number | null {
  const expr = raw.trim().replace(/\*\*/g, '^');
  if (!expr || !/^[0-9+\-*/%^().,\sA-Za-z]+$/.test(expr)) return null;
  if (!/[+\-*/%^()]|\b(sqrt|abs|round|floor|ceil)\b/i.test(expr)) return null;

  let pos = 0;

  const skipWs = () => {
    while (pos < expr.length && /\s/.test(expr[pos])) pos++;
  };

  const parseExpression = (): number => {
    let val = parseTerm();
    while (true) {
      skipWs();
      if (expr[pos] === '+') {
        pos++;
        val += parseTerm();
      } else if (expr[pos] === '-') {
        pos++;
        val -= parseTerm();
      } else {
        break;
      }
    }
    return val;
  };

  const parseTerm = (): number => {
    let val = parsePower();
    while (true) {
      skipWs();
      if (expr[pos] === '*') {
        pos++;
        val *= parsePower();
      } else if (expr[pos] === '/') {
        pos++;
        const denom = parsePower();
        if (denom === 0) throw new Error('div0');
        val /= denom;
      } else if (expr[pos] === '%') {
        pos++;
        const denom = parsePower();
        if (denom === 0) throw new Error('div0');
        val %= denom;
      } else {
        break;
      }
    }
    return val;
  };

  const parsePower = (): number => {
    const base = parseUnary();
    skipWs();
    if (expr[pos] === '^') {
      pos++;
      return Math.pow(base, parsePower());
    }
    return base;
  };

  const parseUnary = (): number => {
    skipWs();
    if (expr[pos] === '+') {
      pos++;
      return parseUnary();
    }
    if (expr[pos] === '-') {
      pos++;
      return -parseUnary();
    }
    return parsePrimary();
  };

  const parsePrimary = (): number => {
    skipWs();
    if (expr[pos] === '(') {
      pos++;
      const inner = parseExpression();
      skipWs();
      if (expr[pos] !== ')') throw new Error('paren');
      pos++;
      return inner;
    }

    const numMatch = expr.slice(pos).match(/^(?:\d+\.?\d*|\.\d+)/);
    if (numMatch) {
      pos += numMatch[0].length;
      return Number(numMatch[0]);
    }

    const idMatch = expr.slice(pos).match(/^[A-Za-z]+/);
    if (idMatch) {
      const name = idMatch[0].toLowerCase();
      pos += idMatch[0].length;
      if (name === 'pi') return Math.PI;
      if (name === 'e') return Math.E;
      skipWs();
      if (expr[pos] !== '(') throw new Error('fn');
      pos++;
      const arg = parseExpression();
      skipWs();
      if (expr[pos] !== ')') throw new Error('paren');
      pos++;
      if (name === 'sqrt') return Math.sqrt(arg);
      if (name === 'abs') return Math.abs(arg);
      if (name === 'round') return Math.round(arg);
      if (name === 'floor') return Math.floor(arg);
      if (name === 'ceil') return Math.ceil(arg);
    }

    throw new Error('token');
  };

  try {
    const result = parseExpression();
    skipWs();
    if (pos !== expr.length || !Number.isFinite(result)) return null;
    return Number.isInteger(result) ? result : Number(result.toFixed(6));
  } catch {
    return null;
  }
}

export const SpotlightRun: React.FC = () => {
  const {
    spotlightOpen,
    setSpotlightOpen,
    updateSettings,
    openApp,
    vfs,
    playSound,
    notify,
  } = useOS();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (spotlightOpen) {
      setQuery('');
      setSelectedIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [spotlightOpen]);

  const openVfsNode = (node: VFSNode) => {
    if (node.type === 'folder') {
      openApp('navigator', { section: node.id });
    } else if (node.ext === 'txt' || node.ext === 'md') {
      openApp('wordleaf', { fileId: node.id });
    } else if (node.ext === 'url') {
      openApp('browser', { fileId: node.id, url: node.content });
    } else if (node.ext === 'svg' || node.ext === 'png') {
      openApp('paint', { fileId: node.id });
    } else {
      openApp('navigator', { fileId: node.id });
    }
  };

  const results = useMemo<SpotlightEntry[]>(() => {
    const q = query.trim();
    const qLower = q.toLowerCase();
    const list: SpotlightEntry[] = [];

    const wikiMatch = q.match(/^(?:wiki|wikipedia)\s*:\s*(.+)$/i);
    if (wikiMatch && wikiMatch[1].trim()) {
      const topic = wikiMatch[1].trim();
      list.push({
        id: 'wiki-cmd',
        group: 'Top Hit',
        title: `Search Wikipedia for “${topic}”`,
        subtitle: 'Safari Explorer',
        icon: <AppIcon appId="browser" size={16} />,
        onExecute: () => {
          openApp('browser', { url: topic });
          setSpotlightOpen(false);
        },
      });
    }

    if (q) {
      const mathResult = evaluateMath(q);
      if (mathResult !== null) {
        list.push({
          id: 'math-result',
          group: 'Top Hit',
          title: `${q} = ${mathResult}`,
          subtitle: 'Copy result',
          icon: <UIGlyph name="info" size={16} tone="dark" />,
          onExecute: () => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(String(mathResult)).catch(() => {});
            }
            notify({
              title: 'Calculator',
              message: `${q} = ${mathResult}`,
              icon: 'info',
            });
            setSpotlightOpen(false);
          },
        });
      }
    }

    const appIds: AppId[] = [
      'browser',
      'wordleaf',
      'navigator',
      'media-player',
      'paint',
      'sticky-notes',
      'control-panel',
      'about',
    ];
    for (const appId of appIds) {
      const meta = APP_META[appId];
      const matches =
        !qLower ||
        meta.name.toLowerCase().includes(qLower) ||
        meta.keywords.some((kw) => kw.includes(qLower));
      if (matches) {
        list.push({
          id: `app-${appId}`,
          group: 'Applications',
          title: meta.name,
          icon: <AppIcon appId={appId} size={16} />,
          onExecute: () => {
            openApp(appId);
            setSpotlightOpen(false);
          },
        });
      }
    }

    if (qLower) {
      const matchingNodes = vfs.nodes
        .filter((n) => {
          if (n.parentId === 'trash' || n.id === 'system') return false;
          const fullName = n.ext ? `${n.name}.${n.ext}` : n.name;
          return fullName.toLowerCase().includes(qLower);
        })
        .slice(0, 6);

      for (const node of matchingNodes) {
        const displayName =
          node.type === 'file' && node.ext && !node.name.endsWith(`.${node.ext}`)
            ? `${node.name}.${node.ext}`
            : node.name;
        const parentName = node.parentId
          ? vfs.getNode(node.parentId)?.name ?? node.parentId
          : 'My Computer';
        list.push({
          id: `vfs-${node.id}`,
          group: 'Documents & Folders',
          title: displayName,
          subtitle: parentName,
          icon: (
            <FileTypeIcon
              ext={node.ext}
              isFolder={node.type === 'folder'}
              folderId={node.parentId === null ? node.id : undefined}
              size={16}
            />
          ),
          onExecute: () => {
            openVfsNode(node);
            setSpotlightOpen(false);
          },
        });
      }

      for (const wp of WALLPAPER_REGISTRY) {
        if (wp.label.toLowerCase().includes(qLower)) {
          list.push({
            id: `wp-${wp.id}`,
            group: 'System Preferences',
            title: `Wallpaper: ${wp.label}`,
            icon: <UIGlyph name="image" size={16} tone="dark" />,
            onExecute: () => {
              updateSettings({ wallpaper: wp.id });
              playSound('click');
              setSpotlightOpen(false);
            },
          });
        }
      }

      for (const tod of TIME_OF_DAY_OPTIONS) {
        if (tod.label.toLowerCase().includes(qLower)) {
          list.push({
            id: `tod-${tod.id}`,
            group: 'System Preferences',
            title: `Time of day: ${tod.label}`,
            icon: <UIGlyph name="clock" size={16} tone="dark" />,
            onExecute: () => {
              updateSettings({ timeOfDay: tod.id });
              playSound('click');
              setSpotlightOpen(false);
            },
          });
        }
      }

      if (!wikiMatch) {
        list.push({
          id: 'wiki-fallback',
          group: 'Top Hit',
          title: `Look up “${q}” in Wikipedia`,
          subtitle: 'Safari Explorer',
          icon: <UIGlyph name="search" size={16} tone="dark" />,
          onExecute: () => {
            openApp('browser', { url: q });
            setSpotlightOpen(false);
          },
        });
      }
    }

    return list.slice(0, 10);
  }, [query, vfs, openApp, setSpotlightOpen, updateSettings, playSound, notify]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!spotlightOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[selectedIndex];
      if (target) {
        playSound('click');
        target.onExecute();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSpotlightOpen(false);
    }
  };

  // Group items preserving order
  const grouped: { group: SpotlightEntry['group']; items: { entry: SpotlightEntry; flatIdx: number }[] }[] = [];
  results.forEach((entry, flatIdx) => {
    const existing = grouped.find((g) => g.group === entry.group);
    if (existing) existing.items.push({ entry, flatIdx });
    else grouped.push({ group: entry.group, items: [{ entry, flatIdx }] });
  });

  return (
    <div
      role="dialog"
      aria-label="Spotlight"
      onMouseDown={() => setSpotlightOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: 'rgba(0, 0, 0, 0.16)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '22vh',
        fontFamily: FONT_UI,
      }}
    >
      <div
        className="halcyon-pop-anim"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          transformOrigin: 'top center',
          width: 560,
          maxWidth: 'calc(100vw - 24px)',
          borderRadius: 10,
          overflow: 'hidden',
          background: 'var(--vibrancy-menu, rgba(240, 240, 242, 0.92))',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          boxShadow:
            'var(--shadow-menu, 0 0 0 0.5px rgba(0,0,0,.25), 0 10px 30px rgba(0,0,0,.22))',
        }}
      >
        {/* 44px Spotlight Field */}
        <div
          style={{
            height: 44,
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid rgba(0, 0, 0, 0.14)',
          }}
        >
          <UIGlyph name="search" size={20} tone="dark" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Spotlight"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text, #1D1D1F)',
              fontSize: 20,
              lineHeight: '24px',
              fontWeight: 400,
              fontFamily: FONT_UI,
            }}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <UIGlyph name="close" size={14} tone="dark" />
            </button>
          )}
        </div>

        {/* Results */}
        <div
          className="hc-scroll"
          style={{
            maxHeight: 320,
            overflowY: 'auto',
            padding: '6px 0',
          }}
        >
          {grouped.map((section) => (
            <div key={section.group} style={{ marginBottom: 4 }}>
              <div
                style={{
                  padding: '4px 14px 2px',
                  fontSize: 11,
                  lineHeight: '14px',
                  fontWeight: 700,
                  color: '#6E7A8A',
                }}
              >
                {section.group}
              </div>
              {section.items.map(({ entry, flatIdx }) => {
                const active = flatIdx === selectedIndex;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(flatIdx)}
                    onClick={() => {
                      playSound('click');
                      entry.onExecute();
                    }}
                    style={{
                      width: '100%',
                      height: 28,
                      padding: '0 14px',
                      border: 'none',
                      background: active ? 'var(--select, #3875D7)' : 'transparent',
                      color: active ? '#FFFFFF' : 'var(--text, #1D1D1F)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'default',
                      textAlign: 'left',
                      fontFamily: FONT_UI,
                      fontSize: 12,
                      fontWeight: 400,
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {entry.icon}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {entry.title}
                    </span>
                    {entry.subtitle && (
                      <span
                        style={{
                          fontSize: 11,
                          color: active
                            ? 'rgba(255, 255, 255, 0.85)'
                            : 'var(--text-3, #8A8A8A)',
                          flexShrink: 0,
                        }}
                      >
                        {entry.subtitle}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
