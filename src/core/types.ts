export const MENUBAR_HEIGHT = 25;
export const SHELF_CLEARANCE = 72;

export type AppId = 'navigator' | 'wordleaf' | 'browser' | 'control-panel' | 'media-player' | 'paint' | 'sticky-notes' | 'about';
export type BootPhase = 'booting' | 'login' | 'desktop' | 'sleeping';
export type TimeOfDay = 'morning' | 'midday' | 'golden' | 'midnight';
export type WallpaperId = 'meadow' | 'golden' | 'dusk' | 'coast' | 'halcyon-live';
export type AccentTheme = 'luna' | 'graphite' | 'luna-cerulean' | 'homestead-olive' | 'sequoia-silver' | 'royale-cobalt';
export type AvatarId = 'butterfly' | 'astronaut' | 'chess' | 'blossom' | 'guitar' | 'prism';
export type SoundEffect = 'startup' | 'shutdown' | 'login' | 'click' | 'open' | 'close' | 'minimize' | 'balloon' | 'error' | 'trash';

export interface VFSNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parentId: string | null; // root folders: 'desktop' | 'documents' | 'pictures' | 'music' | 'system' | 'trash'
  trashedFrom?: string | null;
  ext?: 'txt' | 'md' | 'png' | 'svg' | 'url' | 'sys';
  content?: string;
  createdAt: number;
  updatedAt: number;
  size: number;
}

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  snapZone?: 'left' | 'right' | 'top' | null;
  payload?: { fileId?: string; url?: string; section?: string };
}

export interface MenuItem {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  dividerAfter?: boolean;
  action?: () => void;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export interface NotificationBalloon {
  id: string;
  title: string;
  message: string;
  icon?: AppId | 'info' | 'shield' | 'sparkles';
  createdAt: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface SystemSettings {
  username: string;
  avatarId: AvatarId;
  wallpaper: WallpaperId;
  timeOfDay: TimeOfDay;
  accentTheme: AccentTheme;
  glassOpacity: number;
  soundEnabled: boolean;
  volume: number;
  crtScanlines: boolean;
  dockMagnification: boolean;
}

export interface OSAppProps {
  windowId: string;
  isFocused: boolean;
  payload?: { fileId?: string; url?: string; section?: string };
  setWindowTitle: (title: string) => void;
  setAppMenus: (menus: MenuGroup[]) => void;
}

export interface VFSActions {
  nodes: VFSNode[];
  getChildren: (parentId: string | null) => VFSNode[];
  getNode: (id: string) => VFSNode | undefined;
  createFile: (parentId: string, name: string, ext: NonNullable<VFSNode['ext']>, content: string) => VFSNode;
  createFolder: (parentId: string, name: string) => VFSNode;
  updateFile: (id: string, content: string, newName?: string) => void;
  renameNode: (id: string, newName: string) => void;
  moveNode: (id: string, targetParentId: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  emptyTrash: () => void;
  resetVFS: () => void;
}

export interface OSContextValue {
  phase: BootPhase;
  setPhase: (phase: BootPhase) => void;
  settings: SystemSettings;
  updateSettings: (patch: Partial<SystemSettings>) => void;
  windows: WindowInstance[];
  focusedWindowId: string | null;
  openApp: (appId: AppId, payload?: WindowInstance['payload']) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  updateWindowRect: (id: string, rect: Partial<Pick<WindowInstance, 'x' | 'y' | 'width' | 'height' | 'snapZone' | 'isMaximized'>>) => void;
  updateWindowTitle: (id: string, title: string) => void;
  activeMenus: MenuGroup[];
  setWindowMenus: (windowId: string, menus: MenuGroup[]) => void;
  vfs: VFSActions;
  playSound: (effect: SoundEffect) => void;
  notifications: NotificationBalloon[];
  notify: (balloon: Omit<NotificationBalloon, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  spotlightOpen: boolean;
  setSpotlightOpen: (open: boolean) => void;
}
