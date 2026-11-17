import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon, FileTypeIcon } from '../art';
import { useOS } from '../core/osStore';
import type { TimeOfDay, VFSNode } from '../core/types';
import { FONT_UI, MENUBAR_HEIGHT, SHELF_CLEARANCE } from './shellTheme';

interface DesktopItem {
  key: string;
  label: string;
  vfsNode?: VFSNode;
  renderIcon: () => React.ReactNode;
  onOpen: () => void;
}

interface MarqueeRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  targetNode?: VFSNode;
}

function nextTimeOfDay(current: TimeOfDay): TimeOfDay {
  const order: TimeOfDay[] = ['morning', 'midday', 'golden', 'midnight'];
  return order[(order.indexOf(current) + 1) % order.length];
}

export const DesktopSurface: React.FC = () => {
  const { settings, updateSettings, openApp, vfs, playSound, notify } = useOS();

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const iconRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const marqueeRef = useRef<MarqueeRect | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const desktopNodes = vfs.getChildren('desktop');
  const trashEmpty = vfs.getChildren('trash').length === 0;

  const openVfsNode = (node: VFSNode) => {
    if (node.type === 'folder') {
      openApp('navigator', { section: node.id });
      return;
    }
    if (node.ext === 'txt' || node.ext === 'md') {
      openApp('wordleaf', { fileId: node.id });
      return;
    }
    if (node.ext === 'url') {
      openApp('browser', { fileId: node.id, url: node.content });
      return;
    }
    if (node.ext === 'svg' || node.ext === 'png') {
      openApp('paint', { fileId: node.id });
      return;
    }
    openApp('navigator', { fileId: node.id });
  };

  const items: DesktopItem[] = useMemo(() => {
    const builtins: DesktopItem[] = [
      {
        key: 'builtin-computer',
        label: 'My Computer',
        renderIcon: () => <AppIcon appId="navigator" size={48} />,
        onOpen: () => openApp('navigator', { section: 'computer' }),
      },
      {
        key: 'builtin-trash',
        label: 'Recycle Bin',
        renderIcon: () => (
          <FileTypeIcon folderId="trash" isTrashEmpty={trashEmpty} size={48} />
        ),
        onOpen: () => openApp('navigator', { section: 'trash' }),
      },
      {
        key: 'builtin-browser',
        label: 'Safari Explorer',
        renderIcon: () => <AppIcon appId="browser" size={48} />,
        onOpen: () => openApp('browser', { url: 'halcyon://home' }),
      },
      {
        key: 'builtin-wordleaf',
        label: 'WordLeaf',
        renderIcon: () => <AppIcon appId="wordleaf" size={48} />,
        onOpen: () => openApp('wordleaf'),
      },
    ];

    const vfsItems: DesktopItem[] = desktopNodes.map((node) => ({
      key: `vfs-${node.id}`,
      label:
        node.type === 'file' && node.ext && !node.name.endsWith(`.${node.ext}`)
          ? `${node.name}.${node.ext}`
          : node.name,
      vfsNode: node,
      renderIcon: () => (
        <FileTypeIcon
          ext={node.ext}
          isFolder={node.type === 'folder'}
          size={48}
        />
      ),
      onOpen: () => openVfsNode(node),
    }));

    return [...builtins, ...vfsItems];
  }, [desktopNodes, trashEmpty, openApp]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const m = marqueeRef.current;
      if (!m) return;
      const next: MarqueeRect = { ...m, currentX: e.clientX, currentY: e.clientY };
      marqueeRef.current = next;
      setMarquee(next);

      const left = Math.min(next.startX, next.currentX);
      const right = Math.max(next.startX, next.currentX);
      const top = Math.min(next.startY, next.currentY);
      const bottom = Math.max(next.startY, next.currentY);

      if (right - left > 4 || bottom - top > 4) {
        const hit: string[] = [];
        for (const item of items) {
          const el = iconRefs.current[item.key];
          if (!el) continue;
          const r = el.getBoundingClientRect();
          const intersects =
            r.left < right && r.right > left && r.top < bottom && r.bottom > top;
          if (intersects) hit.push(item.key);
        }
        setSelectedKeys(hit);
      }
    };

    const handlePointerUp = () => {
      if (!marqueeRef.current) return;
      marqueeRef.current = null;
      setMarquee(null);
    };

    const handleGlobalPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointerdown', handleGlobalPointerDown, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointerdown', handleGlobalPointerDown, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [items]);

  const handleSurfacePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setContextMenu(null);
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-desktop-icon="true"]')) return;

    setSelectedKeys([]);
    const init: MarqueeRect = {
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    };
    marqueeRef.current = init;
    setMarquee(init);
  };

  const handleDesktopContextMenu = (
    e: React.MouseEvent,
    targetNode?: VFSNode
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const menuW = 216;
    const menuH = targetNode ? 220 : 172;
    const x = Math.min(e.clientX, window.innerWidth - menuW - 8);
    const y = Math.max(
      MENUBAR_HEIGHT + 4,
      Math.min(e.clientY, window.innerHeight - menuH - 8)
    );
    setContextMenu({ x, y, targetNode });
  };

  const createNewTextDocument = () => {
    const existing = vfs.getChildren('desktop');
    let idx = 1;
    while (existing.some((n) => n.name === (idx === 1 ? 'New Note' : `New Note ${idx}`))) {
      idx += 1;
    }
    const name = idx === 1 ? 'New Note' : `New Note ${idx}`;
    const created = vfs.createFile('desktop', name, 'txt', '');
    playSound('click');
    setSelectedKeys([`vfs-${created.id}`]);
    setContextMenu(null);
  };

  const createNewFolder = () => {
    const existing = vfs.getChildren('desktop');
    let idx = 1;
    while (
      existing.some((n) => n.name === (idx === 1 ? 'New Folder' : `New Folder ${idx}`))
    ) {
      idx += 1;
    }
    const name = idx === 1 ? 'New Folder' : `New Folder ${idx}`;
    const created = vfs.createFolder('desktop', name);
    playSound('click');
    setSelectedKeys([`vfs-${created.id}`]);
    setContextMenu(null);
  };

  const marqueeStyle: React.CSSProperties | null = marquee
    ? {
        position: 'fixed',
        left: Math.min(marquee.startX, marquee.currentX),
        top: Math.min(marquee.startY, marquee.currentY),
        width: Math.abs(marquee.currentX - marquee.startX),
        height: Math.abs(marquee.currentY - marquee.startY),
        background: 'rgba(56, 117, 215, 0.22)',
        border: '1px solid rgba(56, 117, 215, 0.85)',
        pointerEvents: 'none',
        zIndex: 50,
      }
    : null;

  const menuEntries: Array<{
    label: string;
    disabled?: boolean;
    bold?: boolean;
    dividerAfter?: boolean;
    action: () => void;
  }> = [];

  if (contextMenu?.targetNode) {
    const target = contextMenu.targetNode;
    menuEntries.push(
      {
        label: 'Open',
        bold: true,
        action: () => {
          setContextMenu(null);
          openVfsNode(target);
        },
      },
      {
        label: 'Move to Recycle Bin',
        dividerAfter: true,
        action: () => {
          vfs.moveToTrash(target.id);
          playSound('trash');
          setContextMenu(null);
        },
      }
    );
  }

  menuEntries.push(
    { label: 'New Text Document', action: createNewTextDocument },
    { label: 'New Folder', dividerAfter: true, action: createNewFolder },
    {
      label: 'Next Time of Day',
      action: () => {
        updateSettings({ timeOfDay: nextTimeOfDay(settings.timeOfDay) });
        playSound('click');
        setContextMenu(null);
      },
    },
    {
      label: 'Change Desktop Background…',
      dividerAfter: true,
      action: () => {
        setContextMenu(null);
        openApp('control-panel');
      },
    },
    {
      label: 'Empty Recycle Bin',
      disabled: trashEmpty,
      action: () => {
        vfs.emptyTrash();
        playSound('trash');
        notify({
          title: 'Recycle Bin',
          message: 'All items in the Recycle Bin were permanently deleted.',
          icon: 'info',
        });
        setContextMenu(null);
      },
    }
  );

  return (
    <>
      <div
        onPointerDown={handleSurfacePointerDown}
        onContextMenu={(e) => handleDesktopContextMenu(e)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10,
          padding: `${MENUBAR_HEIGHT + 14}px 14px ${SHELF_CLEARANCE + 14}px`,
          display: 'flex',
          flexFlow: 'column wrap',
          alignContent: 'flex-start',
          gap: 8,
          fontFamily: FONT_UI,
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {items.map((item) => {
          const selected = selectedKeys.includes(item.key);
          return (
            <button
              key={item.key}
              ref={(el) => {
                iconRefs.current[item.key] = el;
              }}
              type="button"
              data-desktop-icon="true"
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu(null);
                if (e.shiftKey || e.metaKey || e.ctrlKey) {
                  setSelectedKeys((prev) =>
                    prev.includes(item.key)
                      ? prev.filter((k) => k !== item.key)
                      : [...prev, item.key]
                  );
                } else {
                  setSelectedKeys([item.key]);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                playSound('click');
                item.onOpen();
              }}
              onContextMenu={(e) => {
                if (item.vfsNode) {
                  setSelectedKeys([item.key]);
                  handleDesktopContextMenu(e, item.vfsNode);
                }
              }}
              style={{
                width: 80,
                minHeight: 84,
                padding: '4px 2px',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'default',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 52,
                  height: 52,
                  borderRadius: 4,
                  background: selected ? 'rgba(56, 117, 215, 0.35)' : 'transparent',
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
                  fontWeight: 400,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  padding: selected ? '1px 3px' : '1px 2px',
                  borderRadius: selected ? 2 : 0,
                  background: selected ? 'var(--select, #3875D7)' : 'transparent',
                  textShadow: selected
                    ? 'none'
                    : '1px 1px 1px rgba(0, 0, 0, 0.95), 0 0 4px rgba(0, 0, 0, 0.55)',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                  maxWidth: 78,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {marqueeStyle && <div aria-hidden="true" style={marqueeStyle} />}
      </div>

      {/* Sibling Context Menu (above open windows at z-1280) */}
      {contextMenu && (
        <div
          ref={menuRef}
          role="menu"
          className="hc-menu halcyon-pop-anim"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            transformOrigin: 'top left',
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: 212,
            zIndex: 1280,
            padding: '4px 4px',
            borderRadius: 6,
            background: 'var(--vibrancy-menu, rgba(240, 240, 242, 0.92))',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            boxShadow:
              'var(--shadow-menu, 0 0 0 0.5px rgba(0,0,0,.25), 0 10px 30px rgba(0,0,0,.22))',
            fontFamily: FONT_UI,
          }}
        >
          {menuEntries.map((entry) => (
            <React.Fragment key={entry.label}>
              <button
                type="button"
                disabled={entry.disabled}
                onClick={() => {
                  if (!entry.disabled) entry.action();
                }}
                onMouseEnter={(e) => {
                  if (!entry.disabled) {
                    e.currentTarget.style.background = 'var(--select, #3875D7)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = entry.disabled
                    ? 'var(--text-3, #8A8A8A)'
                    : 'var(--text, #1D1D1F)';
                }}
                style={{
                  width: '100%',
                  height: 20,
                  padding: '0 12px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  color: entry.disabled
                    ? 'var(--text-3, #8A8A8A)'
                    : 'var(--text, #1D1D1F)',
                  fontFamily: FONT_UI,
                  fontSize: 13,
                  lineHeight: '20px',
                  fontWeight: entry.bold ? 700 : 400,
                  textAlign: 'left',
                  cursor: entry.disabled ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {entry.label}
              </button>
              {entry.dividerAfter && (
                <div
                  style={{
                    height: 1,
                    margin: '5px 8px',
                    background: 'rgba(0, 0, 0, 0.1)',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
};
