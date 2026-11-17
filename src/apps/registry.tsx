import React, { useCallback } from 'react';
import { SafariExplorerApp } from './browser';
import {
  AboutApp,
  ControlPanelApp,
  MediaSynthApp,
  NavigatorApp,
  PaintCanvasApp,
} from './system';
import { StickyNotesApp, WordLeafApp } from './wordleaf';
import { useOS } from '../core/osStore';
import type { AppId, MenuGroup, OSAppProps, WindowInstance } from '../core/types';

export const APP_REGISTRY: Record<AppId, React.FC<OSAppProps>> = {
  navigator: NavigatorApp,
  wordleaf: WordLeafApp,
  browser: SafariExplorerApp,
  'control-panel': ControlPanelApp,
  'media-player': MediaSynthApp,
  paint: PaintCanvasApp,
  'sticky-notes': StickyNotesApp,
  about: AboutApp,
};

export const WindowAppContent: React.FC<{
  win: WindowInstance;
  isFocused: boolean;
}> = ({ win, isFocused }) => {
  const { updateWindowTitle, setWindowMenus } = useOS();

  const setWindowTitle = useCallback(
    (title: string) => {
      updateWindowTitle(win.id, title);
    },
    [win.id, updateWindowTitle]
  );

  const setAppMenus = useCallback(
    (menus: MenuGroup[]) => {
      setWindowMenus(win.id, menus);
    },
    [win.id, setWindowMenus]
  );

  const AppComponent = APP_REGISTRY[win.appId];
  return (
    <AppComponent
      windowId={win.id}
      isFocused={isFocused}
      payload={win.payload}
      setWindowTitle={setWindowTitle}
      setAppMenus={setAppMenus}
    />
  );
};
