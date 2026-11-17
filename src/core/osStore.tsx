import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { playSynthSound } from './soundEngine';
import {
  AppId,
  BootPhase,
  MENUBAR_HEIGHT,
  MenuGroup,
  NotificationBalloon,
  OSContextValue,
  SHELF_CLEARANCE,
  SoundEffect,
  SystemSettings,
  VFSActions,
  VFSNode,
  WallpaperId,
  WindowInstance,
} from './types';
import { createSeedVFS, loadVFSNodes, ROOT_FOLDER_IDS, saveVFSNodes } from './vfs';

const SETTINGS_STORAGE_KEY = 'halcyon_os_settings_v1';

const DEFAULT_SETTINGS: SystemSettings = {
  username: 'Explorer',
  avatarId: 'butterfly',
  wallpaper: 'meadow',
  timeOfDay: 'midday',
  accentTheme: 'luna',
  glassOpacity: 0.8,
  soundEnabled: true,
  volume: 0.65,
  crtScanlines: false,
  dockMagnification: true,
};

const VALID_WALLPAPERS = new Set<WallpaperId>(['meadow', 'golden', 'dusk', 'coast', 'halcyon-live']);

function migrateWallpaperId(raw: unknown): WallpaperId {
  if (typeof raw === 'string' && VALID_WALLPAPERS.has(raw as WallpaperId)) {
    return raw as WallpaperId;
  }
  switch (raw) {
    case 'orchard-meadow':
      return 'golden';
    case 'royale-aurora':
      return 'dusk';
    case 'aqua-prism':
      return 'coast';
    default:
      return 'meadow';
  }
}

const APP_DEFAULTS: Record<
  AppId,
  { title: string; width: number; height: number; minWidth: number; minHeight: number; singleton?: boolean }
> = {
  navigator: { title: 'Navigator', width: 820, height: 540, minWidth: 560, minHeight: 380 },
  wordleaf: { title: 'WordLeaf', width: 860, height: 600, minWidth: 560, minHeight: 400 },
  browser: { title: 'Safari Explorer', width: 920, height: 620, minWidth: 620, minHeight: 420 },
  'control-panel': { title: 'Control Panel', width: 620, height: 420, minWidth: 540, minHeight: 400, singleton: true },
  'media-player': { title: 'Prism', width: 620, height: 400, minWidth: 520, minHeight: 320, singleton: true },
  paint: { title: 'LunaPaint', width: 800, height: 560, minWidth: 580, minHeight: 420 },
  'sticky-notes': { title: 'Stickies', width: 460, height: 480, minWidth: 320, minHeight: 320, singleton: true },
  about: { title: 'About Halcyon', width: 340, height: 420, minWidth: 340, minHeight: 400, singleton: true },
};

function loadSettings(): SystemSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SystemSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      wallpaper: migrateWallpaperId(parsed.wallpaper),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const OSContext = createContext<OSContextValue | null>(null);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhaseState] = useState<BootPhase>('booting');
  const [settings, setSettings] = useState<SystemSettings>(loadSettings);
  const [vfsNodes, setVfsNodes] = useState<VFSNode[]>(loadVFSNodes);
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [menusByWindow, setMenusByWindow] = useState<Record<string, MenuGroup[]>>({});
  const [notifications, setNotifications] = useState<NotificationBalloon[]>([]);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  const zCounterRef = useRef(100);
  const cascadeIndexRef = useRef(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const windowsRef = useRef(windows);
  windowsRef.current = windows;
  const focusedWindowIdRef = useRef(focusedWindowId);
  focusedWindowIdRef.current = focusedWindowId;

  // Sync theme attributes and CSS variables to :root
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.accentTheme;
    root.dataset.time = settings.timeOfDay;
    root.style.setProperty('--glass-opacity', String(settings.glassOpacity));
  }, [settings.accentTheme, settings.timeOfDay, settings.glassOpacity]);

  // Persist settings
  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  // Persist VFS
  useEffect(() => {
    saveVFSNodes(vfsNodes);
  }, [vfsNodes]);

  const playSound = useCallback((effect: SoundEffect) => {
    const s = settingsRef.current;
    playSynthSound(effect, s.volume, s.soundEnabled);
  }, []);

  const updateSettings = useCallback((patch: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const setPhase = useCallback((nextPhase: BootPhase) => {
    setSpotlightOpen(false);
    setPhaseState(nextPhase);
  }, []);

  // Global Cmd/Ctrl+K shortcut for Spotlight/Run
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'desktop') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      } else if (e.key === 'Escape' && spotlightOpen) {
        setSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, spotlightOpen]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (balloon: Omit<NotificationBalloon, 'id' | 'createdAt'>) => {
      const id = makeId('notif');
      const entry: NotificationBalloon = {
        ...balloon,
        id,
        createdAt: Date.now(),
      };
      setNotifications((prev) => [...prev.slice(-3), entry]);
      playSound('balloon');
      window.setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 6500);
    },
    [playSound]
  );

  const focusWindow = useCallback((id: string) => {
    zCounterRef.current += 1;
    const nextZ = zCounterRef.current;
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w))
    );
    setFocusedWindowId(id);
  }, []);

  const openApp = useCallback(
    (appId: AppId, payload?: WindowInstance['payload']): string => {
      const spec = APP_DEFAULTS[appId];
      const current = windowsRef.current;

      const existingMatch = spec.singleton
        ? current.find((w) => w.appId === appId)
        : payload?.fileId
          ? current.find((w) => w.appId === appId && w.payload?.fileId === payload.fileId)
          : undefined;

      if (existingMatch) {
        zCounterRef.current += 1;
        const nextZ = zCounterRef.current;
        const matchId = existingMatch.id;
        setWindows((prev) =>
          prev.map((w) =>
            w.id === matchId
              ? {
                  ...w,
                  zIndex: nextZ,
                  isMinimized: false,
                  payload: payload ? { ...w.payload, ...payload } : w.payload,
                }
              : w
          )
        );
        setFocusedWindowId(matchId);
        playSound('open');
        return matchId;
      }

      const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const maxW = Math.max(spec.minWidth, vw - 40);
      const maxH = Math.max(spec.minHeight, vh - MENUBAR_HEIGHT - SHELF_CLEARANCE - 20);
      const width = Math.min(spec.width, maxW);
      const height = Math.min(spec.height, maxH);

      const step = (cascadeIndexRef.current % 6) * 26;
      cascadeIndexRef.current += 1;
      const x = Math.max(16, Math.min(vw - width - 16, Math.round((vw - width) / 2 - 36 + step)));
      const y = Math.max(
        MENUBAR_HEIGHT + 12,
        Math.min(vh - height - SHELF_CLEARANCE - 8, Math.round(MENUBAR_HEIGHT + 24 + step))
      );

      zCounterRef.current += 1;
      const newWinId = makeId('win');
      const newWin: WindowInstance = {
        id: newWinId,
        appId,
        title: spec.title,
        x,
        y,
        width,
        height,
        minWidth: spec.minWidth,
        minHeight: spec.minHeight,
        zIndex: zCounterRef.current,
        isMinimized: false,
        isMaximized: false,
        snapZone: null,
        payload,
      };

      setWindows((prev) => (prev.some((w) => w.id === newWinId) ? prev : [...prev, newWin]));
      setFocusedWindowId(newWinId);
      playSound('open');
      return newWinId;
    },
    [playSound]
  );

  const closeWindow = useCallback(
    (id: string) => {
      playSound('close');
      const remaining = windowsRef.current.filter((w) => w.id !== id);
      const visible = remaining.filter((w) => !w.isMinimized);
      const nextFocused =
        visible.length === 0
          ? null
          : visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id;

      setWindows((prev) => prev.filter((w) => w.id !== id));
      if (focusedWindowIdRef.current === id) {
        setFocusedWindowId(nextFocused);
      }
      setMenusByWindow((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [playSound]
  );

  const minimizeWindow = useCallback(
    (id: string) => {
      playSound('minimize');
      const remaining = windowsRef.current.filter((w) => w.id !== id && !w.isMinimized);
      const nextFocused =
        remaining.length === 0
          ? null
          : remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id;

      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
      if (focusedWindowIdRef.current === id) {
        setFocusedWindowId(nextFocused);
      }
    },
    [playSound]
  );

  const restoreWindow = useCallback(
    (id: string) => {
      playSound('open');
      focusWindow(id);
    },
    [focusWindow, playSound]
  );

  const toggleMaximizeWindow = useCallback((id: string) => {
    zCounterRef.current += 1;
    const nextZ = zCounterRef.current;
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              isMaximized: !w.isMaximized,
              snapZone: null,
              isMinimized: false,
              zIndex: nextZ,
            }
          : w
      )
    );
    setFocusedWindowId(id);
  }, []);

  const updateWindowRect = useCallback(
    (
      id: string,
      rect: Partial<Pick<WindowInstance, 'x' | 'y' | 'width' | 'height' | 'snapZone' | 'isMaximized'>>
    ) => {
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...rect } : w)));
    },
    []
  );

  const updateWindowTitle = useCallback((id: string, title: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id && w.title !== title ? { ...w, title } : w))
    );
  }, []);

  const setWindowMenus = useCallback((windowId: string, menus: MenuGroup[]) => {
    setMenusByWindow((prev) => ({ ...prev, [windowId]: menus }));
  }, []);

  const activeMenus = useMemo(() => {
    if (!focusedWindowId) return [];
    return menusByWindow[focusedWindowId] ?? [];
  }, [focusedWindowId, menusByWindow]);

  // Virtual Filesystem Actions
  const getChildren = useCallback(
    (parentId: string | null) =>
      vfsNodes
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
    [vfsNodes]
  );

  const getNode = useCallback(
    (id: string) => vfsNodes.find((n) => n.id === id),
    [vfsNodes]
  );

  const createFile = useCallback(
    (parentId: string, name: string, ext: NonNullable<VFSNode['ext']>, content: string): VFSNode => {
      const now = Date.now();
      const trimmed = name.trim() || `Untitled.${ext}`;
      const fullName = trimmed.includes('.') ? trimmed : `${trimmed}.${ext}`;
      const node: VFSNode = {
        id: makeId('file'),
        name: fullName,
        type: 'file',
        parentId,
        ext,
        content,
        createdAt: now,
        updatedAt: now,
        size: content.length,
      };
      setVfsNodes((prev) => [...prev, node]);
      return node;
    },
    []
  );

  const createFolder = useCallback((parentId: string, name: string): VFSNode => {
    const now = Date.now();
    const node: VFSNode = {
      id: makeId('folder'),
      name: name.trim() || 'New Folder',
      type: 'folder',
      parentId,
      createdAt: now,
      updatedAt: now,
      size: 0,
    };
    setVfsNodes((prev) => [...prev, node]);
    return node;
  }, []);

  const updateFile = useCallback((id: string, content: string, newName?: string) => {
    const now = Date.now();
    setVfsNodes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              content,
              name: newName ? newName : n.name,
              updatedAt: now,
              size: content.length,
            }
          : n
      )
    );
  }, []);

  const renameNode = useCallback((id: string, newName: string) => {
    if ((ROOT_FOLDER_IDS as readonly string[]).includes(id)) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    const now = Date.now();
    setVfsNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, name: trimmed, updatedAt: now } : n))
    );
  }, []);

  const moveNode = useCallback((id: string, targetParentId: string) => {
    if ((ROOT_FOLDER_IDS as readonly string[]).includes(id)) return;
    if (id === targetParentId) return;
    const now = Date.now();
    setVfsNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, parentId: targetParentId, updatedAt: now } : n))
    );
  }, []);

  const moveToTrash = useCallback(
    (id: string) => {
      if ((ROOT_FOLDER_IDS as readonly string[]).includes(id)) return;
      const now = Date.now();
      playSound('trash');
      setVfsNodes((prev) =>
        prev.map((n) =>
          n.id === id && n.parentId !== 'trash'
            ? { ...n, trashedFrom: n.parentId, parentId: 'trash', updatedAt: now }
            : n
        )
      );
    },
    [playSound]
  );

  const restoreFromTrash = useCallback((id: string) => {
    const now = Date.now();
    setVfsNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id || n.parentId !== 'trash') return n;
        const dest = n.trashedFrom && prev.some((p) => p.id === n.trashedFrom) ? n.trashedFrom : 'documents';
        return { ...n, parentId: dest, trashedFrom: null, updatedAt: now };
      })
    );
  }, []);

  const emptyTrash = useCallback(() => {
    playSound('trash');
    setVfsNodes((prev) => {
      const toDelete = new Set<string>();
      const collectDescendants = (parentId: string) => {
        for (const node of prev) {
          if (node.parentId === parentId && !toDelete.has(node.id)) {
            toDelete.add(node.id);
            if (node.type === 'folder') collectDescendants(node.id);
          }
        }
      };
      collectDescendants('trash');
      return prev.filter((n) => !toDelete.has(n.id));
    });
  }, [playSound]);

  const resetVFS = useCallback(() => {
    const fresh = createSeedVFS();
    setVfsNodes(fresh);
    saveVFSNodes(fresh);
  }, []);

  const vfs: VFSActions = useMemo(
    () => ({
      nodes: vfsNodes,
      getChildren,
      getNode,
      createFile,
      createFolder,
      updateFile,
      renameNode,
      moveNode,
      moveToTrash,
      restoreFromTrash,
      emptyTrash,
      resetVFS,
    }),
    [
      vfsNodes,
      getChildren,
      getNode,
      createFile,
      createFolder,
      updateFile,
      renameNode,
      moveNode,
      moveToTrash,
      restoreFromTrash,
      emptyTrash,
      resetVFS,
    ]
  );

  const value: OSContextValue = useMemo(
    () => ({
      phase,
      setPhase,
      settings,
      updateSettings,
      windows,
      focusedWindowId,
      openApp,
      closeWindow,
      focusWindow,
      minimizeWindow,
      restoreWindow,
      toggleMaximizeWindow,
      updateWindowRect,
      updateWindowTitle,
      activeMenus,
      setWindowMenus,
      vfs,
      playSound,
      notifications,
      notify,
      dismissNotification,
      spotlightOpen,
      setSpotlightOpen,
    }),
    [
      phase,
      setPhase,
      settings,
      updateSettings,
      windows,
      focusedWindowId,
      openApp,
      closeWindow,
      focusWindow,
      minimizeWindow,
      restoreWindow,
      toggleMaximizeWindow,
      updateWindowRect,
      updateWindowTitle,
      activeMenus,
      setWindowMenus,
      vfs,
      playSound,
      notifications,
      notify,
      dismissNotification,
      spotlightOpen,
    ]
  );

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
};

export function useOS(): OSContextValue {
  const ctx = useContext(OSContext);
  if (!ctx) {
    throw new Error('useOS must be used inside <OSProvider>');
  }
  return ctx;
}
