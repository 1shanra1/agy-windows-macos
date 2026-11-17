import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon, HalcyonMark, UIGlyph } from '../../art';
import { useOS } from '../../core/osStore';
import { MenuGroup, OSAppProps } from '../../core/types';
import {
  BrowserBookmark,
  DEFAULT_BOOKMARKS,
  HalcyonPortalPage,
  LunaGlassMuseumPage,
  SafeNetBlockedPage,
  SafeNetPolicyPage,
  WikiSearchResultsPage,
} from './intranetPages';
import {
  IntranetRoute,
  WikiArticle,
  WikiSearchResult,
  WikiSite,
  autocompleteWiki,
  extractUrlFromShortcutContent,
  fetchRandomWikiTarget,
  fetchWikiArticle,
  parseBrowserInput,
  searchWiki,
} from './wikiClient';

const BOOKMARKS_STORAGE_KEY = 'halcyon_browser_bookmarks_v1';

type TabViewState =
  | { kind: 'intranet'; route: IntranetRoute }
  | { kind: 'article'; article: WikiArticle; fragment?: string }
  | { kind: 'search'; query: string; site: WikiSite; lang: string; results: WikiSearchResult[]; error?: string }
  | { kind: 'blocked'; url: string; domain: string; suggestedQuery: string; reason: string }
  | { kind: 'error'; url: string; message: string };

interface BrowserTab {
  id: string;
  history: string[];
  historyIndex: number;
  title: string;
  isLoading: boolean;
  view: TabViewState;
}

function makeTabId(): string {
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadSavedBookmarks(): BrowserBookmark[] {
  if (typeof window === 'undefined') return DEFAULT_BOOKMARKS;
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return DEFAULT_BOOKMARKS;
    const custom = JSON.parse(raw) as BrowserBookmark[];
    if (!Array.isArray(custom)) return DEFAULT_BOOKMARKS;
    const builtinIds = new Set(DEFAULT_BOOKMARKS.map((b) => b.id));
    const mergedCustom = custom.filter((b) => b && b.id && !builtinIds.has(b.id));
    return [...DEFAULT_BOOKMARKS, ...mergedCustom];
  } catch {
    return DEFAULT_BOOKMARKS;
  }
}

function createInitialTab(initialUrl = 'halcyon://home'): BrowserTab {
  return {
    id: makeTabId(),
    history: [initialUrl],
    historyIndex: 0,
    title: 'Halcyon Library',
    isLoading: false,
    view: { kind: 'intranet', route: 'home' },
  };
}

function routeTitle(route: IntranetRoute): string {
  if (route === 'museum') return 'Halcyon Design Museum';
  if (route === 'safenet') return 'Halcyon Library Policy';
  return 'Halcyon Library';
}

export const SafariExplorerApp: React.FC<OSAppProps> = ({
  isFocused,
  payload,
  setWindowTitle,
  setAppMenus,
}) => {
  const { vfs, playSound, notify, openApp } = useOS();

  const [tabs, setTabs] = useState<BrowserTab[]>(() => [createInitialTab('halcyon://home')]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id);
  const [addressInput, setAddressInput] = useState<string>('halcyon://home');
  const [isAddressFocused, setIsAddressFocused] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [acResults, setAcResults] = useState<WikiSearchResult[]>([]);
  const [showAcDropdown, setShowAcDropdown] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<BrowserBookmark[]>(loadSavedBookmarks);
  const [showOutline, setShowOutline] = useState<boolean>(false);
  const [largeReaderText, setLargeReaderText] = useState<boolean>(false);
  const [activeSectionAnchor, setActiveSectionAnchor] = useState<string | null>(null);
  const [trustPopoverOpen, setTrustPopoverOpen] = useState<boolean>(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  // Safari in-field page-load progress (0..100, null when hidden)
  const [loadProgress, setLoadProgress] = useState<number | null>(null);

  // Find in Page state
  const [findOpen, setFindOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [findMatches, setFindMatches] = useState<number>(0);
  const [findActiveIdx, setFindActiveIdx] = useState<number>(0);

  // Session statistics for halcyon://safenet
  const [stats, setStats] = useState({ articlesRead: 0, blockedCount: 0, clippedCount: 0 });

  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const articleBodyRef = useRef<HTMLDivElement | null>(null);
  const navTokenRef = useRef<Record<string, number>>({});
  const handledPayloadRef = useRef<string>('');
  const progressTimerRef = useRef<number | null>(null);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  const currentUrl = activeTab.history[activeTab.historyIndex] || 'halcyon://home';

  // Animate Safari blue progress inside address bar while loading
  useEffect(() => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    if (activeTab.isLoading) {
      setLoadProgress(18);
      progressTimerRef.current = window.setInterval(() => {
        setLoadProgress((prev) => {
          if (prev === null) return 22;
          if (prev >= 86) return 86;
          return prev + Math.max(3, Math.round((88 - prev) * 0.18));
        });
      }, 120);
      return () => {
        if (progressTimerRef.current !== null) {
          window.clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
      };
    }

    setLoadProgress((prev) => {
      if (prev === null) return null;
      return 100;
    });
    const fadeTimer = window.setTimeout(() => {
      setLoadProgress(null);
    }, 260);
    return () => window.clearTimeout(fadeTimer);
  }, [activeTab.isLoading]);

  // Persist custom bookmarks
  useEffect(() => {
    try {
      const custom = bookmarks.filter((b) => !b.builtin);
      window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(custom));
    } catch {
      // Ignore storage quota issues
    }
  }, [bookmarks]);

  // Sync address bar when active tab changes
  useEffect(() => {
    if (!isAddressFocused) {
      setAddressInput(currentUrl);
    }
  }, [currentUrl, isAddressFocused, activeTabId]);

  // Update OS window title
  useEffect(() => {
    setWindowTitle(`${activeTab.title} — Safari Explorer`);
  }, [activeTab.title, setWindowTitle]);

  const updateTab = useCallback((tabId: string, updater: (prev: BrowserTab) => BrowserTab) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? updater(t) : t)));
  }, []);

  const loadDestinationIntoTab = useCallback(
    async (
      tabId: string,
      rawDestination: string,
      mode: 'push' | 'replace' | 'history-jump' = 'push',
      targetHistoryIdx?: number
    ) => {
      const token = (navTokenRef.current[tabId] || 0) + 1;
      navTokenRef.current[tabId] = token;

      const parsed = parseBrowserInput(rawDestination);
      const nextUrl =
        parsed.kind === 'intranet'
          ? parsed.url
          : parsed.kind === 'wiki'
          ? parsed.canonicalUrl + (parsed.fragment ? `#${parsed.fragment}` : '')
          : parsed.kind === 'wiki-search'
          ? rawDestination.trim()
          : parsed.inputUrl;

      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== tabId) return tab;
          let history = tab.history;
          let historyIndex = tab.historyIndex;

          if (mode === 'push') {
            const sliced = tab.history.slice(0, tab.historyIndex + 1);
            if (sliced[sliced.length - 1] !== nextUrl) {
              history = [...sliced, nextUrl];
              historyIndex = history.length - 1;
            } else {
              history = sliced;
              historyIndex = sliced.length - 1;
            }
          } else if (mode === 'replace') {
            history = [...tab.history];
            history[historyIndex] = nextUrl;
          } else if (mode === 'history-jump' && typeof targetHistoryIdx === 'number') {
            historyIndex = Math.max(0, Math.min(tab.history.length - 1, targetHistoryIdx));
          }

          if (parsed.kind === 'intranet') {
            return {
              ...tab,
              history,
              historyIndex,
              title: routeTitle(parsed.route),
              isLoading: false,
              view: { kind: 'intranet', route: parsed.route },
            };
          }

          if (parsed.kind === 'blocked') {
            return {
              ...tab,
              history,
              historyIndex,
              title: parsed.domain,
              isLoading: false,
              view: {
                kind: 'blocked',
                url: parsed.inputUrl,
                domain: parsed.domain,
                suggestedQuery: parsed.suggestedQuery,
                reason: parsed.reason,
              },
            };
          }

          return {
            ...tab,
            history,
            historyIndex,
            title:
              parsed.kind === 'wiki'
                ? parsed.page.replace(/_/g, ' ')
                : `Search: ${parsed.query}`,
            isLoading: true,
          };
        })
      );

      setTrustPopoverOpen(false);
      setShowAcDropdown(false);

      if (parsed.kind === 'intranet') {
        viewportRef.current?.scrollTo({ top: 0 });
        return;
      }

      if (parsed.kind === 'blocked') {
        playSound('error');
        setStats((s) => ({ ...s, blockedCount: s.blockedCount + 1 }));
        viewportRef.current?.scrollTo({ top: 0 });
        return;
      }

      if (parsed.kind === 'wiki') {
        try {
          const article = await fetchWikiArticle(parsed.page, parsed.site, parsed.lang);
          if (navTokenRef.current[tabId] !== token) return;
          updateTab(tabId, (t) => ({
            ...t,
            title: article.title,
            isLoading: false,
            view: { kind: 'article', article, fragment: parsed.fragment },
          }));
          setStats((s) => ({ ...s, articlesRead: s.articlesRead + 1 }));
          setActiveSectionAnchor(null);
          window.requestAnimationFrame(() => {
            if (parsed.fragment && articleBodyRef.current) {
              const target = articleBodyRef.current.querySelector<HTMLElement>(
                `[id="${CSS.escape(parsed.fragment)}"]`
              );
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
              }
            }
            viewportRef.current?.scrollTo({ top: 0 });
          });
        } catch (err) {
          if (navTokenRef.current[tabId] !== token) return;
          updateTab(tabId, (t) => ({
            ...t,
            title: 'Page unavailable',
            isLoading: false,
            view: {
              kind: 'error',
              url: parsed.canonicalUrl,
              message: err instanceof Error ? err.message : 'Could not fetch Wikipedia article.',
            },
          }));
        }
        return;
      }

      if (parsed.kind === 'wiki-search') {
        try {
          const results = await searchWiki(parsed.query, parsed.site, parsed.lang);
          if (navTokenRef.current[tabId] !== token) return;
          updateTab(tabId, (t) => ({
            ...t,
            title: `Search: ${parsed.query}`,
            isLoading: false,
            view: {
              kind: 'search',
              query: parsed.query,
              site: parsed.site,
              lang: parsed.lang,
              results,
            },
          }));
          viewportRef.current?.scrollTo({ top: 0 });
        } catch (err) {
          if (navTokenRef.current[tabId] !== token) return;
          updateTab(tabId, (t) => ({
            ...t,
            title: `Search: ${parsed.query}`,
            isLoading: false,
            view: {
              kind: 'search',
              query: parsed.query,
              site: parsed.site,
              lang: parsed.lang,
              results: [],
              error: err instanceof Error ? err.message : 'Search failed',
            },
          }));
        }
      }
    },
    [playSound, updateTab]
  );

  // Handle initial or updated launch payload (url or VFS .url fileId)
  useEffect(() => {
    const sig = `${payload?.fileId || ''}|${payload?.url || ''}|${payload?.section || ''}`;
    if (sig === '||' || sig === handledPayloadRef.current) return;
    handledPayloadRef.current = sig;

    let targetUrl: string | undefined = payload?.url;
    if (payload?.fileId) {
      const node = vfs.getNode(payload.fileId);
      if (node?.content) {
        targetUrl = extractUrlFromShortcutContent(node.content);
      }
    }
    if (targetUrl) {
      void loadDestinationIntoTab(activeTab.id, targetUrl, 'replace');
    }
  }, [payload, vfs, activeTab.id, loadDestinationIntoTab]);

  const navigateActive = useCallback(
    (dest: string) => {
      playSound('click');
      setIsAddressFocused(false);
      setSearchFocused(false);
      void loadDestinationIntoTab(activeTab.id, dest, 'push');
    },
    [activeTab.id, loadDestinationIntoTab, playSound]
  );

  const handleBack = useCallback(() => {
    if (activeTab.historyIndex <= 0) return;
    playSound('click');
    const nextIdx = activeTab.historyIndex - 1;
    void loadDestinationIntoTab(activeTab.id, activeTab.history[nextIdx], 'history-jump', nextIdx);
  }, [activeTab, loadDestinationIntoTab, playSound]);

  const handleForward = useCallback(() => {
    if (activeTab.historyIndex >= activeTab.history.length - 1) return;
    playSound('click');
    const nextIdx = activeTab.historyIndex + 1;
    void loadDestinationIntoTab(activeTab.id, activeTab.history[nextIdx], 'history-jump', nextIdx);
  }, [activeTab, loadDestinationIntoTab, playSound]);

  const handleReloadOrStop = useCallback(() => {
    playSound('click');
    if (activeTab.isLoading) {
      navTokenRef.current[activeTab.id] = (navTokenRef.current[activeTab.id] || 0) + 1;
      updateTab(activeTab.id, (t) => ({ ...t, isLoading: false }));
      return;
    }
    void loadDestinationIntoTab(activeTab.id, currentUrl, 'replace');
  }, [activeTab.id, activeTab.isLoading, currentUrl, loadDestinationIntoTab, playSound, updateTab]);

  const handleRandomArticle = useCallback(async () => {
    playSound('click');
    updateTab(activeTab.id, (t) => ({ ...t, isLoading: true }));
    const randomTarget = await fetchRandomWikiTarget('wikipedia', 'en');
    void loadDestinationIntoTab(activeTab.id, randomTarget.url, 'push');
  }, [activeTab.id, loadDestinationIntoTab, playSound, updateTab]);

  const handleNewTab = useCallback(
    (url = 'halcyon://home') => {
      playSound('click');
      const newTab = createInitialTab(url);
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      if (url !== 'halcyon://home') {
        void loadDestinationIntoTab(newTab.id, url, 'replace');
      }
    },
    [loadDestinationIntoTab, playSound]
  );

  const handleCloseTab = useCallback(
    (tabId: string) => {
      playSound('click');
      setTabs((prev) => {
        if (prev.length === 1) {
          const fresh = createInitialTab('halcyon://home');
          setActiveTabId(fresh.id);
          return [fresh];
        }
        const idx = prev.findIndex((t) => t.id === tabId);
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === activeTabId) {
          const fallback = next[Math.max(0, idx - 1)] || next[0];
          setActiveTabId(fallback.id);
        }
        return next;
      });
    },
    [activeTabId, playSound]
  );

  const isCurrentBookmarked = useMemo(
    () => bookmarks.some((b) => b.url === currentUrl),
    [bookmarks, currentUrl]
  );

  const handleToggleBookmark = useCallback(() => {
    if (isCurrentBookmarked) {
      const existing = bookmarks.find((b) => b.url === currentUrl);
      if (existing?.builtin) return;
      playSound('click');
      setBookmarks((prev) => prev.filter((b) => b.url !== currentUrl));
      return;
    }
    playSound('balloon');
    const newBm: BrowserBookmark = {
      id: `bm-user-${Date.now().toString(36)}`,
      label: activeTab.title.slice(0, 26),
      url: currentUrl,
      builtin: false,
    };
    setBookmarks((prev) => [...prev, newBm]);
    notify({
      title: 'Bookmark added',
      message: `Added “${newBm.label}” to the bookmarks bar.`,
      icon: 'browser',
    });
  }, [activeTab.title, bookmarks, currentUrl, isCurrentBookmarked, notify, playSound]);

  const handleClipToDocuments = useCallback(() => {
    if (activeTab.view.kind !== 'article') return;
    const { article } = activeTab.view;
    const safeTitle = article.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 48).trim() || 'Wikipedia Article';
    const fileName = `${safeTitle} (Wikipedia).md`;
    const tocMarkdown =
      article.sections.length > 0
        ? `\n## Key Sections\n${article.sections
            .slice(0, 12)
            .map((s) => `- ${s.number} ${s.line}`)
            .join('\n')}\n`
        : '';

    const mdContent = [
      `# ${article.title}`,
      '',
      `> Source: ${article.url}`,
      `> Saved: ${new Date().toLocaleString()}`,
      '',
      article.description ? `**${article.description}**\n` : '',
      '## Summary',
      '',
      article.extract || article.title,
      tocMarkdown,
    ]
      .filter(Boolean)
      .join('\n');

    const created = vfs.createFile('documents', fileName, 'md', mdContent);
    playSound('balloon');
    setStats((s) => ({ ...s, clippedCount: s.clippedCount + 1 }));
    notify({
      title: 'Saved to My Documents',
      message: `Saved “${created.name}” to My Documents.`,
      icon: 'browser',
      actionLabel: 'Open in WordLeaf',
      onAction: () => openApp('wordleaf', { fileId: created.id }),
    });
  }, [activeTab.view, notify, openApp, playSound, vfs]);

  // Toolbar Wikipedia search autocomplete
  useEffect(() => {
    if (!searchFocused) return;
    const q = searchInput.trim();
    if (q.length < 2) {
      setAcResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      const res = await autocompleteWiki(q, 'wikipedia', 'en', ctrl.signal);
      if (!ctrl.signal.aborted) {
        setAcResults(res);
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [searchInput, searchFocused]);

  // Find in Page highlighting within articleBodyRef
  const clearFindHighlights = useCallback(() => {
    const root = articleBodyRef.current;
    if (!root) return;
    const marks = root.querySelectorAll('mark.hg-find-mark');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    });
  }, []);

  const applyFindHighlights = useCallback(
    (query: string) => {
      clearFindHighlights();
      const root = articleBodyRef.current;
      const q = query.trim();
      if (!root || !q) {
        setFindMatches(0);
        setFindActiveIdx(0);
        return;
      }
      const lowerQ = q.toLowerCase();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let current: Node | null = walker.nextNode();
      while (current) {
        if (current.nodeValue && current.nodeValue.toLowerCase().includes(lowerQ)) {
          textNodes.push(current as Text);
        }
        current = walker.nextNode();
      }

      let count = 0;
      textNodes.forEach((node) => {
        const text = node.nodeValue || '';
        const lowerText = text.toLowerCase();
        let lastIndex = 0;
        let idx = lowerText.indexOf(lowerQ);
        if (idx === -1 || !node.parentNode) return;
        const frag = document.createDocumentFragment();
        while (idx !== -1) {
          if (idx > lastIndex) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex, idx)));
          }
          const mark = document.createElement('mark');
          mark.className = 'hg-find-mark';
          mark.dataset.findIdx = String(count);
          mark.textContent = text.slice(idx, idx + q.length);
          frag.appendChild(mark);
          count += 1;
          lastIndex = idx + q.length;
          idx = lowerText.indexOf(lowerQ, lastIndex);
        }
        if (lastIndex < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        node.parentNode.replaceChild(frag, node);
      });

      setFindMatches(count);
      setFindActiveIdx(0);
      if (count > 0) {
        const first = root.querySelector<HTMLElement>('mark.hg-find-mark[data-find-idx="0"]');
        if (first) {
          first.classList.add('active');
          first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [clearFindHighlights]
  );

  useEffect(() => {
    if (!findOpen) {
      clearFindHighlights();
      setFindMatches(0);
      return;
    }
    applyFindHighlights(findQuery);
  }, [findOpen, findQuery, activeTab.view, applyFindHighlights, clearFindHighlights]);

  const jumpFindMatch = useCallback(
    (delta: 1 | -1) => {
      if (findMatches === 0 || !articleBodyRef.current) return;
      const next = (findActiveIdx + delta + findMatches) % findMatches;
      articleBodyRef.current
        .querySelectorAll('mark.hg-find-mark.active')
        .forEach((m) => m.classList.remove('active'));
      const target = articleBodyRef.current.querySelector<HTMLElement>(
        `mark.hg-find-mark[data-find-idx="${next}"]`
      );
      if (target) {
        target.classList.add('active');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setFindActiveIdx(next);
    },
    [findActiveIdx, findMatches]
  );

  // Keyboard shortcuts when window is focused
  useEffect(() => {
    if (!isFocused) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'l') {
        e.preventDefault();
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
      } else if (key === 'f') {
        e.preventDefault();
        setFindOpen(true);
        window.setTimeout(() => findInputRef.current?.focus(), 20);
      } else if (key === 't') {
        e.preventDefault();
        handleNewTab('halcyon://home');
      } else if (key === 'w') {
        e.preventDefault();
        handleCloseTab(activeTab.id);
      } else if (key === 'r') {
        e.preventDefault();
        handleReloadOrStop();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab.id, handleCloseTab, handleNewTab, handleReloadOrStop, isFocused]);

  // Register Menu Bar menus
  useEffect(() => {
    if (!isFocused) return;
    const canBack = activeTab.historyIndex > 0;
    const canForward = activeTab.historyIndex < activeTab.history.length - 1;
    const isArticle = activeTab.view.kind === 'article';

    const menus: MenuGroup[] = [
      {
        label: 'File',
        items: [
          { label: 'New Tab', shortcut: '⌘T', action: () => handleNewTab('halcyon://home') },
          { label: 'Close Tab', shortcut: '⌘W', dividerAfter: true, action: () => handleCloseTab(activeTab.id) },
          {
            label: 'Save to My Documents…',
            disabled: !isArticle,
            action: handleClipToDocuments,
          },
          {
            label: 'Library Policy…',
            action: () => navigateActive('halcyon://safenet'),
          },
        ],
      },
      {
        label: 'Edit',
        items: [
          {
            label: 'Open Location…',
            shortcut: '⌘L',
            action: () => {
              addressInputRef.current?.focus();
              addressInputRef.current?.select();
            },
          },
          {
            label: 'Find on Page…',
            shortcut: '⌘F',
            action: () => {
              setFindOpen(true);
              window.setTimeout(() => findInputRef.current?.focus(), 20);
            },
          },
        ],
      },
      {
        label: 'View',
        items: [
          {
            label: showOutline ? 'Hide Contents Sidebar' : 'Show Contents Sidebar',
            disabled: !isArticle,
            action: () => setShowOutline((v) => !v),
          },
          { label: 'Reload Page', shortcut: '⌘R', dividerAfter: true, action: handleReloadOrStop },
          { label: 'Halcyon Library', action: () => navigateActive('halcyon://home') },
          { label: 'Halcyon Design Museum', action: () => navigateActive('halcyon://museum') },
        ],
      },
      {
        label: 'History',
        items: [
          { label: 'Back', disabled: !canBack, action: handleBack },
          { label: 'Forward', disabled: !canForward, dividerAfter: true, action: handleForward },
          { label: 'Random Article', action: () => void handleRandomArticle() },
        ],
      },
      {
        label: 'Bookmarks',
        items: [
          {
            label: isCurrentBookmarked ? 'Current Page Bookmarked' : 'Add Bookmark…',
            dividerAfter: true,
            action: handleToggleBookmark,
          },
          ...DEFAULT_BOOKMARKS.map((bm) => ({
            label: bm.label,
            action: () => navigateActive(bm.url),
          })),
        ],
      },
    ];

    setAppMenus(menus);
  }, [
    activeTab.historyIndex,
    activeTab.history.length,
    activeTab.id,
    activeTab.view.kind,
    handleBack,
    handleClipToDocuments,
    handleCloseTab,
    handleForward,
    handleNewTab,
    handleRandomArticle,
    handleReloadOrStop,
    handleToggleBookmark,
    isCurrentBookmarked,
    isFocused,
    navigateActive,
    setAppMenus,
    showOutline,
  ]);

  // Intercept clicks on Wikipedia / Wiktionary links
  const handleArticleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;
    e.preventDefault();

    const fragment = anchor.getAttribute('data-halcyon-anchor');
    if (fragment && articleBodyRef.current) {
      const target = articleBodyRef.current.querySelector<HTMLElement>(`[id="${CSS.escape(fragment)}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const navTarget = anchor.getAttribute('data-halcyon-nav') || anchor.getAttribute('href');
    if (navTarget) {
      navigateActive(navTarget);
    }
  };

  const handleArticleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) {
      if (hoveredHref) setHoveredHref(null);
      return;
    }
    const target = anchor.getAttribute('data-halcyon-nav') || anchor.getAttribute('href');
    setHoveredHref(target);
  };

  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;
  const isArticle = activeTab.view.kind === 'article';
  const articleSections = activeTab.view.kind === 'article' ? activeTab.view.article.sections : [];

  const trustDescription =
    activeTab.view.kind === 'article'
      ? `Halcyon Library — This page is from ${activeTab.view.article.site === 'wiktionary' ? 'Wiktionary' : 'Wikipedia'}.`
      : activeTab.view.kind === 'blocked'
      ? 'Halcyon Library — External websites are not permitted.'
      : 'Halcyon Library — Built-in library page.';

  return (
    <div className="se-root">
      <style>{SAFARI_EXPLORER_V2_STYLES}</style>

      {/* 1. Unified 34px Toolbar (.hc-toolbar) directly under Luna titlebar */}
      <div className="hc-toolbar se-toolbar">
        {/* Back / Forward 2-segment .hc-seg (52x22) */}
        <div className="hc-seg se-nav-seg">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={handleBack}
            title="Back"
            aria-label="Back"
          >
            <UIGlyph name="back" size={14} tone={canGoBack ? 'dark' : 'auto'} />
          </button>
          <button
            type="button"
            disabled={!canGoForward}
            onClick={handleForward}
            title="Forward"
            aria-label="Forward"
          >
            <UIGlyph name="forward" size={14} tone={canGoForward ? 'dark' : 'auto'} />
          </button>
        </div>

        {/* Reload / Stop */}
        <button
          type="button"
          className="hc-tool"
          onClick={handleReloadOrStop}
          title={activeTab.isLoading ? 'Stop loading' : 'Reload page'}
          aria-label={activeTab.isLoading ? 'Stop loading' : 'Reload page'}
        >
          <UIGlyph name={activeTab.isLoading ? 'stop' : 'reload'} size={14} tone="dark" />
        </button>

        {/* Smart Address Field (.hc-field) with in-field progress & grey shield */}
        <div className="se-address-box">
          <form
            className="hc-field se-address-field"
            onSubmit={(e) => {
              e.preventDefault();
              navigateActive(addressInput);
            }}
          >
            {loadProgress !== null && (
              <div
                className="se-address-progress"
                style={{
                  width: `${loadProgress}%`,
                  opacity: loadProgress === 100 ? 0 : 1,
                }}
              />
            )}

            <button
              type="button"
              className="se-field-btn"
              onClick={() => setTrustPopoverOpen((v) => !v)}
              title="Page library status"
              aria-label="Page library status"
            >
              <UIGlyph name="shield" size={14} tone="dark" />
            </button>

            <span className="se-field-favicon" aria-hidden="true">
              {activeTab.view.kind === 'intranet' ? (
                <HalcyonMark size={14} variant="color" />
              ) : (
                <AppIcon appId="browser" size={14} />
              )}
            </span>

            <input
              ref={addressInputRef}
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onFocus={(e) => {
                setIsAddressFocused(true);
                e.currentTarget.select();
              }}
              onBlur={() => setIsAddressFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setAddressInput(currentUrl);
                  e.currentTarget.blur();
                }
              }}
              className="se-address-input"
              aria-label="Address"
            />

            <button
              type="button"
              className="se-field-btn"
              onClick={handleToggleBookmark}
              title={isCurrentBookmarked ? 'Bookmarked' : 'Add Bookmark'}
              aria-label="Bookmark"
            >
              <UIGlyph name="star" size={13} tone={isCurrentBookmarked ? 'auto' : 'dark'} />
            </button>
          </form>

          {trustPopoverOpen && (
            <div
              className="hc-menu se-trust-popover"
              onMouseLeave={() => setTrustPopoverOpen(false)}
            >
              <div style={{ padding: '6px 12px', fontSize: 12, color: 'var(--text)' }}>
                {trustDescription}
              </div>
              <div className="hc-menu-sep" />
              <button
                type="button"
                className="hc-menu-item se-menu-btn"
                onClick={() => {
                  setTrustPopoverOpen(false);
                  navigateActive('halcyon://safenet');
                }}
              >
                View Library Policy…
              </button>
            </div>
          )}
        </div>

        {/* Wikipedia Search Field (.hc-search, 180px) */}
        <div className="se-search-wrap">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!searchInput.trim()) return;
              setShowAcDropdown(false);
              navigateActive(searchInput.trim());
            }}
          >
            <span className="se-search-icon" aria-hidden="true">
              <UIGlyph name="search" size={14} tone="dark" />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowAcDropdown(true);
              }}
              onFocus={() => {
                setSearchFocused(true);
                setShowAcDropdown(true);
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setSearchFocused(false);
                  setShowAcDropdown(false);
                }, 170);
              }}
              placeholder="Wikipedia"
              className="hc-field hc-search"
              style={{ width: 180 }}
              aria-label="Search Wikipedia"
            />
          </form>

          {showAcDropdown && searchFocused && acResults.length > 0 && (
            <div className="hc-menu se-search-ac">
              {acResults.map((res) => (
                <button
                  key={res.url}
                  type="button"
                  className="hc-menu-item se-menu-btn"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchInput(res.title);
                    navigateActive(res.url);
                  }}
                >
                  <span>{res.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Toolbar Tools: Outline Sidebar, Save to Documents, Reader Text Size */}
        <div className="se-right-tools">
          <button
            type="button"
            className={`hc-tool ${showOutline && isArticle ? 'is-active' : ''}`}
            disabled={!isArticle || articleSections.length === 0}
            onClick={() => setShowOutline((v) => !v)}
            title="Toggle Contents Sidebar"
            aria-label="Contents Sidebar"
          >
            <UIGlyph name="sidebar" size={15} tone="dark" />
          </button>

          <button
            type="button"
            className="hc-tool"
            disabled={!isArticle}
            onClick={handleClipToDocuments}
            title="Save to My Documents"
            aria-label="Save to My Documents"
          >
            <UIGlyph name="share" size={15} tone="dark" />
          </button>

          <button
            type="button"
            className={`hc-tool ${largeReaderText ? 'is-active' : ''}`}
            disabled={!isArticle}
            onClick={() => {
              playSound('click');
              setLargeReaderText((v) => !v);
            }}
            title="Reader Text Size"
            aria-label="Reader Text Size"
            style={{ fontFamily: 'Georgia, serif', fontSize: 12, fontWeight: 700 }}
          >
            Aa
          </button>
        </div>
      </div>

      {/* 2. Bookmarks Bar (22px, --linen bg, text-only items) */}
      <div className="se-bookmarks-bar">
        <button
          type="button"
          className="se-bm-item se-bm-home"
          onClick={() => navigateActive('halcyon://home')}
          title="Halcyon Library"
          aria-label="Halcyon Library"
        >
          <UIGlyph name="home" size={12} tone="dark" />
          <span>Library</span>
        </button>

        <div className="se-bm-list">
          {bookmarks.map((bm) => (
            <button
              key={bm.id}
              type="button"
              className="se-bm-item"
              onClick={() => navigateActive(bm.url)}
            >
              {bm.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="se-bm-item"
          onClick={() => void handleRandomArticle()}
        >
          Random Article
        </button>
      </div>

      {/* 3. Safari 4 Tab Strip (24px, ONLY visible when 2 or more tabs exist) */}
      {tabs.length >= 2 && (
        <div className="se-tab-strip">
          <div className="se-tab-list">
            {tabs.map((tab) => {
              const active = tab.id === activeTab.id;
              return (
                <div
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  className={`se-tab ${active ? 'active' : ''}`}
                  onClick={() => {
                    playSound('click');
                    setActiveTabId(tab.id);
                  }}
                >
                  <span className="se-tab-label">{tab.title}</span>
                  <button
                    type="button"
                    className="se-tab-close"
                    title="Close Tab"
                    aria-label="Close Tab"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(tab.id);
                    }}
                  >
                    <UIGlyph name="close" size={10} tone="dark" />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="hc-tool se-tab-add"
            title="New Tab"
            aria-label="New Tab"
            onClick={() => handleNewTab('halcyon://home')}
          >
            <UIGlyph name="plus" size={12} tone="dark" />
          </button>
        </div>
      )}

      {/* Optional Find Bar */}
      {findOpen && (
        <div className="se-find-bar">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span className="se-search-icon" aria-hidden="true">
              <UIGlyph name="search" size={13} tone="dark" />
            </span>
            <input
              ref={findInputRef}
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  jumpFindMatch(e.shiftKey ? -1 : 1);
                } else if (e.key === 'Escape') {
                  setFindOpen(false);
                }
              }}
              placeholder="Find on page"
              className="hc-field hc-search"
              style={{ width: 200 }}
            />
          </div>
          <span className="se-find-count">
            {findMatches > 0 ? `${findActiveIdx + 1} of ${findMatches}` : findQuery ? 'Not found' : ''}
          </span>
          <div className="hc-seg">
            <button type="button" onClick={() => jumpFindMatch(-1)} aria-label="Previous match">
              <UIGlyph name="up" size={12} tone="dark" />
            </button>
            <button type="button" onClick={() => jumpFindMatch(1)} aria-label="Next match">
              <UIGlyph name="down" size={12} tone="dark" />
            </button>
          </div>
          <button
            type="button"
            className="hc-btn hc-btn--sm"
            onClick={() => setFindOpen(false)}
          >
            Done
          </button>
        </div>
      )}

      {/* 4. Main Content Shell (Optional .hc-sourcelist Outline + #FFFFFF Viewport) */}
      <div className="se-body-shell">
        {isArticle && showOutline && articleSections.length > 0 && (
          <aside className="hc-sourcelist se-outline-sidebar">
            <div className="hc-sourcelist-group">Contents</div>
            <div className="se-outline-list">
              <button
                type="button"
                className={`hc-sourcelist-row se-outline-row ${activeSectionAnchor === null ? 'is-selected' : ''}`}
                onClick={() => {
                  setActiveSectionAnchor(null);
                  viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Introduction
              </button>
              {articleSections.map((sec) => (
                <button
                  key={`${sec.index}-${sec.anchor}`}
                  type="button"
                  className={`hc-sourcelist-row se-outline-row level-${sec.level} ${
                    activeSectionAnchor === sec.anchor ? 'is-selected' : ''
                  }`}
                  onClick={() => {
                    setActiveSectionAnchor(sec.anchor);
                    const el = articleBodyRef.current?.querySelector<HTMLElement>(
                      `[id="${CSS.escape(sec.anchor)}"]`
                    );
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {sec.number} {sec.line}
                </button>
              ))}
            </div>
          </aside>
        )}

        <div className="se-viewport" ref={viewportRef}>
          {activeTab.view.kind === 'intranet' && activeTab.view.route === 'home' && (
            <HalcyonPortalPage
              onNavigate={navigateActive}
              onRandomArticle={() => void handleRandomArticle()}
              bookmarks={bookmarks}
            />
          )}

          {activeTab.view.kind === 'intranet' && activeTab.view.route === 'museum' && (
            <LunaGlassMuseumPage onNavigate={navigateActive} />
          )}

          {activeTab.view.kind === 'intranet' && activeTab.view.route === 'safenet' && (
            <SafeNetPolicyPage onNavigate={navigateActive} stats={stats} />
          )}

          {activeTab.view.kind === 'blocked' && (
            <SafeNetBlockedPage
              blockedUrl={activeTab.view.url}
              domain={activeTab.view.domain}
              suggestedQuery={activeTab.view.suggestedQuery}
              reason={activeTab.view.reason}
              canGoBack={canGoBack}
              onSearchWikipedia={(q) => navigateActive(q)}
              onGoHome={() => navigateActive('halcyon://home')}
              onGoBack={handleBack}
            />
          )}

          {activeTab.view.kind === 'search' && (
            <WikiSearchResultsPage
              query={activeTab.view.query}
              site={activeTab.view.site}
              results={activeTab.view.results}
              error={activeTab.view.error}
              onNavigate={navigateActive}
              onSwitchSite={(nextSite) =>
                navigateActive(
                  nextSite === 'wiktionary'
                    ? `wikt:${activeTab.view.kind === 'search' ? activeTab.view.query : ''}`
                    : `wiki:${activeTab.view.kind === 'search' ? activeTab.view.query : ''}`
                )
              }
            />
          )}

          {activeTab.view.kind === 'error' && (
            <div className="wiki hg-wiki-page">
              <h1>Page unavailable</h1>
              <p>{activeTab.view.message}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="hc-btn hc-btn--default"
                  onClick={() => navigateActive('halcyon://home')}
                >
                  Halcyon Library
                </button>
                <button type="button" className="hc-btn" onClick={handleReloadOrStop}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {activeTab.view.kind === 'article' && (
            <article className={`wiki hg-wiki-page ${largeReaderText ? 'se-wiki-large' : ''}`}>
              <h1>{activeTab.view.article.title}</h1>
              <div className="se-wiki-tagline">
                {activeTab.view.article.site === 'wiktionary'
                  ? 'From Wiktionary, the free dictionary'
                  : 'From Wikipedia, the free encyclopedia'}
              </div>
              {activeTab.view.article.description && (
                <div className="se-wiki-shortdesc">{activeTab.view.article.description}</div>
              )}
              <div
                ref={articleBodyRef}
                className="se-wiki-body"
                onClick={handleArticleClick}
                onMouseOver={handleArticleMouseOver}
                onMouseLeave={() => setHoveredHref(null)}
                dangerouslySetInnerHTML={{ __html: activeTab.view.article.html }}
              />
            </article>
          )}
        </div>
      </div>

      {/* Safari bottom-left floating link preview strip */}
      {hoveredHref && <div className="se-hover-status">{hoveredHref}</div>}
    </div>
  );
};

// ============================================================================
// V2 Aqua-Luna + Vector 2010 Stylesheet
// ============================================================================

const SAFARI_EXPLORER_V2_STYLES = `
.se-root {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--linen, #EEECE4);
  color: var(--text, #1D1D1F);
  font-family: var(--font-ui, "Lucida Grande", "Lucida Sans Unicode", Tahoma, sans-serif);
  font-size: 12px;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

.se-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  user-select: none;
}

.se-nav-seg {
  width: 52px;
  flex-shrink: 0;
}
.se-nav-seg > button {
  width: 26px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.se-address-box {
  position: relative;
  flex: 1;
  min-width: 160px;
}

.se-address-field {
  position: relative;
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: 22px;
  padding: 0 5px;
  overflow: hidden;
}

.se-address-progress {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(180deg, #C9DDF8 0%, #9CC1F1 100%);
  transition: width 120ms linear, opacity 220ms ease;
  pointer-events: none;
  z-index: 0;
}

.se-field-btn {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.se-field-favicon {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.se-address-input {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  color: var(--text, #1D1D1F);
  padding: 0;
}

.se-trust-popover {
  position: absolute;
  top: 26px;
  left: 0;
  min-width: 280px;
  z-index: 60;
}

.se-search-wrap {
  position: relative;
  flex-shrink: 0;
}
.se-search-icon {
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  pointer-events: none;
  z-index: 1;
}
.se-search-ac {
  position: absolute;
  top: 26px;
  right: 0;
  width: 240px;
  z-index: 60;
}

.se-right-tools {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

/* Bookmarks Bar (22px) */
.se-bookmarks-bar {
  display: flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  gap: 4px;
  background: var(--linen, #EEECE4);
  border-bottom: 1px solid #B8B5AA;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
  user-select: none;
}
.se-bm-list {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.se-bm-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 18px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text, #1D1D1F);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}
.se-bm-item:hover {
  background: rgba(0, 0, 0, 0.07);
}
.se-bm-home {
  font-weight: 700;
}

/* Safari 4 Tab Strip (24px, shown only when tabs >= 2) */
.se-tab-strip {
  display: flex;
  align-items: flex-end;
  height: 24px;
  padding: 2px 6px 0 6px;
  gap: 2px;
  background: #B8BABE;
  border-bottom: 1px solid #96989C;
  flex-shrink: 0;
  user-select: none;
}
.se-tab-list {
  display: flex;
  align-items: flex-end;
  flex: 1;
  min-width: 0;
  gap: 2px;
  height: 100%;
}
.se-tab {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  max-width: 220px;
  min-width: 80px;
  height: 22px;
  padding: 0 22px 0 10px;
  border-radius: 5px 5px 0 0;
  background: #C8C9CC;
  border: 1px solid #9E9FA3;
  border-bottom: none;
  box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.10);
  color: #3A3A3A;
  font-size: 11px;
  cursor: pointer;
}
.se-tab.active {
  background: linear-gradient(180deg, var(--linen-hi, #F8F7F3) 0%, var(--linen, #EEECE4) 100%);
  color: var(--text, #1D1D1F);
  font-weight: 700;
  box-shadow: inset 0 1px 0 #FFFFFF;
}
.se-tab-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.se-tab-close {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: transparent;
  opacity: 0;
  cursor: pointer;
}
.se-tab:hover .se-tab-close,
.se-tab.active .se-tab-close {
  opacity: 0.7;
}
.se-tab-close:hover {
  opacity: 1 !important;
  background: rgba(0, 0, 0, 0.12);
}
.se-tab-add {
  height: 20px;
  width: 22px;
  margin-bottom: 1px;
}

/* Find Bar */
.se-find-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 10px;
  background: var(--linen, #EEECE4);
  border-bottom: 1px solid #B8B5AA;
  flex-shrink: 0;
}
.se-find-count {
  font-size: 11px;
  color: var(--text-2, #4A4A4A);
  font-variant-numeric: tabular-nums;
}

/* Body Shell */
.se-body-shell {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
  background: var(--paper, #FFFFFF);
}

.se-outline-sidebar {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}
.se-outline-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.se-outline-row {
  width: calc(100% - 12px);
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}
.se-outline-row.level-3 {
  padding-left: 16px;
  font-size: 11px;
}
.se-menu-btn {
  width: calc(100% - 8px);
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
}

.se-viewport {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  background: var(--paper, #FFFFFF);
  position: relative;
}

/* Bottom-left hover link strip (Safari style) */
.se-hover-status {
  position: absolute;
  bottom: 0;
  left: 0;
  max-width: 75%;
  height: 20px;
  line-height: 20px;
  padding: 0 8px;
  background: var(--linen, #EEECE4);
  border-top: 1px solid #B8B5AA;
  border-right: 1px solid #B8B5AA;
  border-radius: 0 4px 0 0;
  font-size: 11px;
  color: var(--text, #1D1D1F);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  z-index: 40;
}

/* ============================================================================
   Vector 2010 Wikipedia Skin (§9.3)
   ============================================================================ */
.hg-wiki-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 24px 36px;
}

.wiki {
  font: 14px/1.6 -apple-system, "Helvetica Neue", Arial, sans-serif;
  color: #202122;
}
.wiki.se-wiki-large {
  font-size: 16px;
}
.wiki h1 {
  font: 28px/1.3 Georgia, "Linux Libertine", "Times New Roman", serif;
  border-bottom: 1px solid #a2a9b1;
  margin: 0 0 0.25em;
  padding-bottom: 2px;
  color: #000000;
}
.wiki h2 {
  font: 21px/1.3 Georgia, "Linux Libertine", serif;
  border-bottom: 1px solid #a2a9b1;
  margin: 1em 0 0.25em;
  color: #000000;
}
.wiki h3 {
  font: 600 16px/1.6 inherit;
  margin: 0.3em 0 0;
  color: #000000;
}
.wiki a {
  color: #0645ad;
  text-decoration: none;
}
.wiki a:hover {
  text-decoration: underline;
}
.wiki p {
  margin: 0.5em 0;
}
.wiki .infobox,
.wiki .sidebar,
.wiki table.vertical-navbox,
.wiki .side-box {
  float: right;
  clear: right;
  width: 22em;
  max-width: 100%;
  margin: 0 0 1em 1em;
  font-size: 88%;
  line-height: 1.5;
  border: 1px solid #a2a9b1;
  background: #f8f9fa;
  padding: 0.2em;
  border-spacing: 3px;
}
.wiki .infobox-above,
.wiki .infobox-title,
.wiki .sidebar-title {
  font-size: 125%;
  font-weight: bold;
  text-align: center;
  background: none;
  color: #202122;
}
.wiki .infobox th,
.wiki .infobox td {
  vertical-align: top;
  text-align: left;
  padding: 0.2em 0.4em;
}
.wiki .infobox img,
.wiki .thumb img {
  max-width: 100%;
  height: auto;
}
.wiki .thumb.tright,
.wiki figure.mw-default-size,
.wiki figure[typeof~="mw:File/Thumb"] {
  float: right;
  clear: right;
  margin: 0.5em 0 1.3em 1.4em;
  border: 1px solid #c8ccd1;
  background: #f8f9fa;
  padding: 3px;
  font-size: 88%;
}
.wiki .thumb.tleft,
.wiki figure.mw-halign-left {
  float: left;
  clear: left;
  margin: 0.5em 1.4em 1.3em 0;
  border: 1px solid #c8ccd1;
  background: #f8f9fa;
  padding: 3px;
  font-size: 88%;
}
.wiki ul {
  list-style: disc;
  margin: 0.3em 0 0 1.6em;
  padding: 0;
  text-align: left;
}
.wiki ol {
  margin: 0.3em 0 0 1.6em;
  padding: 0;
  text-align: left;
}
.wiki .navbox,
.wiki .ambox,
.wiki .mw-editsection,
.wiki .metadata,
.wiki .noprint,
.wiki .reflist .mw-cite-backlink,
.wiki .hatnote.navigation-not-searchable {
  display: none;
}
.wiki .hatnote {
  font-style: italic;
  padding-left: 1.6em;
  margin-bottom: 0.5em;
  color: #202122;
}
.wiki table.wikitable {
  border: 1px solid #a2a9b1;
  border-collapse: collapse;
  background: #f8f9fa;
  margin: 1em 0;
}
.wiki .wikitable th,
.wiki .wikitable td {
  border: 1px solid #a2a9b1;
  padding: 0.2em 0.4em;
}
.wiki .wikitable th {
  background: #eaecf0;
}

.se-wiki-tagline {
  font-size: 12px;
  color: #54595d;
  margin-bottom: 8px;
}
.se-wiki-shortdesc {
  font-size: 13px;
  color: #54595d;
  margin-bottom: 10px;
}
.se-wiki-body {
  display: flow-root;
}
.se-wiki-body mark.hg-find-mark {
  background: #FDE047;
  color: #000000;
}
.se-wiki-body mark.hg-find-mark.active {
  background: #F59E0B;
}

/* ============================================================================
   Intranet Pages & Mac Alert Sheet
   ============================================================================ */
.hg-lib-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  margin-bottom: 14px;
  border-bottom: 1px solid #a2a9b1;
}
.hg-lib-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.hg-lib-sub {
  font-size: 12px;
  color: #54595d;
}
.hg-lib-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.hg-sep-pipe {
  color: #a2a9b1;
  margin: 0 4px;
}
.hg-text-link {
  border: none;
  background: transparent;
  padding: 0;
  color: #0645ad;
  font: inherit;
  cursor: pointer;
  text-align: left;
}
.hg-text-link:hover {
  text-decoration: underline;
}

.hg-lib-search-box {
  background: #f8f9fa;
  border: 1px solid #c8ccd1;
  padding: 12px;
  margin-bottom: 16px;
}
.hg-lib-search-form {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hg-lib-field-wrap {
  position: relative;
  flex: 1;
  max-width: 420px;
}
.hg-field-glyph-left {
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  pointer-events: none;
}
.hg-lib-ac {
  position: absolute;
  top: 26px;
  left: 0;
  right: 0;
  z-index: 50;
}
.hg-lib-hint {
  margin-top: 6px;
  font-size: 11px;
  color: #54595d;
}

.hg-lib-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.hg-portal-box {
  background: #f8f9fa;
  border: 1px solid #c8ccd1;
}
.hg-portal-box-head {
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 700;
  color: #1D1D1F;
  border-bottom: 1px solid #a3b0bf;
}
.hg-portal-box-list {
  margin: 8px 10px 10px 24px !important;
  font-size: 13px;
  line-height: 1.65;
}

.hg-lib-bookmarks {
  font-size: 12px;
  color: #202122;
  padding-top: 10px;
  border-top: 1px solid #eaecf0;
}

/* Museum */
.hg-museum-cols {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.hg-museum-p {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text, #1D1D1F);
  margin: 8px 0 0;
}
.hg-specimen-bar {
  height: 24px;
  line-height: 24px;
  padding: 0 8px;
  border-radius: 6px 6px 0 0;
  font-size: 12px;
  font-weight: 700;
}
.hg-specimen-bar.xp {
  background: linear-gradient(180deg, #6AAAF7 0%, #2A75E8 48%, #1556C8 100%);
  color: #FFFFFF;
}
.hg-specimen-bar.mac {
  background: linear-gradient(180deg, #E4E5E7 0%, #BFC2C6 100%);
  color: #2B2B2B;
  font-weight: 400;
}
.hg-specimen-bar.halcyon {
  background: linear-gradient(180deg, #6AAAF7 0%, #1D66DB 50%, #1556C8 100%);
  color: #FFFFFF;
}

/* Search results */
.hg-search-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hg-search-title {
  font-size: 15px;
  font-weight: 700;
}
.hg-search-url {
  font-size: 11px;
  color: #006621;
}
.hg-search-snippet {
  font-size: 13px;
  color: #202122;
}

/* Gatekeeper Mac Alert Sheet (§9.3) */
.hg-sheet-backdrop {
  position: relative;
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.hg-mac-sheet {
  width: 440px;
  background: var(--linen, #EEECE4);
  border-radius: 0 0 8px 8px;
  box-shadow: var(--shadow-sheet, 0 0 0 1px rgba(0,0,0,.22), 0 12px 36px rgba(0,0,0,.28));
  padding: 20px;
  animation: hgSheetDrop 220ms cubic-bezier(.2,.8,.2,1) forwards;
}
@keyframes hgSheetDrop {
  from { transform: translateY(-100%); opacity: 0.9; }
  to { transform: translateY(0); opacity: 1; }
}
.hg-sheet-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.hg-sheet-icon-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}
.hg-sheet-caution {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.hg-sheet-copy {
  flex: 1;
  min-width: 0;
}
.hg-sheet-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text, #1D1D1F);
  margin-bottom: 6px;
  word-break: break-word;
}
.hg-sheet-body {
  font-size: 11px;
  line-height: 1.45;
  color: var(--text-2, #4A4A4A);
}
.hg-sheet-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
`;
