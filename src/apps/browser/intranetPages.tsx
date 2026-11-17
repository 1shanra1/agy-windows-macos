import React, { useEffect, useRef, useState } from 'react';
import { AppIcon, HalcyonMark, UIGlyph } from '../../art';
import {
  SAFENET_ALLOWED_DOMAINS,
  WikiSearchResult,
  WikiSite,
  autocompleteWiki,
} from './wikiClient';

export interface BrowserBookmark {
  id: string;
  label: string;
  url: string;
  builtin?: boolean;
}

export const DEFAULT_BOOKMARKS: BrowserBookmark[] = [
  { id: 'bm-bliss', label: 'Bliss (Photograph)', url: 'https://en.wikipedia.org/wiki/Bliss_(photograph)', builtin: true },
  { id: 'bm-xp', label: 'Windows XP', url: 'https://en.wikipedia.org/wiki/Windows_XP', builtin: true },
  { id: 'bm-macos', label: 'macOS', url: 'https://en.wikipedia.org/wiki/macOS', builtin: true },
  { id: 'bm-gui', label: 'Graphical User Interface', url: 'https://en.wikipedia.org/wiki/Graphical_user_interface', builtin: true },
  { id: 'bm-museum', label: 'Design Museum', url: 'halcyon://museum', builtin: true },
];

interface TopicBox {
  id: string;
  title: string;
  headerBg: string;
  borderColor: string;
  articles: Array<{ label: string; url: string }>;
}

const PORTAL_TOPICS: TopicBox[] = [
  {
    id: 'pioneers',
    title: 'Computing pioneers',
    headerBg: '#CEDFF2',
    borderColor: '#A3B0BF',
    articles: [
      { label: 'Alan Turing', url: 'https://en.wikipedia.org/wiki/Alan_Turing' },
      { label: 'Ada Lovelace', url: 'https://en.wikipedia.org/wiki/Ada_Lovelace' },
      { label: 'Douglas Engelbart', url: 'https://en.wikipedia.org/wiki/Douglas_Engelbart' },
      { label: 'Grace Hopper', url: 'https://en.wikipedia.org/wiki/Grace_Hopper' },
      { label: 'Graphical user interface', url: 'https://en.wikipedia.org/wiki/Graphical_user_interface' },
    ],
  },
  {
    id: 'os-history',
    title: 'Operating systems and craft',
    headerBg: '#CEF2E0',
    borderColor: '#A3BFB1',
    articles: [
      { label: 'Windows XP', url: 'https://en.wikipedia.org/wiki/Windows_XP' },
      { label: 'Bliss (photograph)', url: 'https://en.wikipedia.org/wiki/Bliss_(photograph)' },
      { label: 'Luna (theme)', url: 'https://en.wikipedia.org/wiki/Luna_(theme)' },
      { label: 'macOS', url: 'https://en.wikipedia.org/wiki/macOS' },
      { label: 'Aqua (user interface)', url: 'https://en.wikipedia.org/wiki/Aqua_(user_interface)' },
    ],
  },
  {
    id: 'science',
    title: 'Science and astronomy',
    headerBg: '#DDCEF2',
    borderColor: '#AFA3BF',
    articles: [
      { label: 'Voyager Golden Record', url: 'https://en.wikipedia.org/wiki/Voyager_Golden_Record' },
      { label: 'James Webb Space Telescope', url: 'https://en.wikipedia.org/wiki/James_Webb_Space_Telescope' },
      { label: 'Quantum mechanics', url: 'https://en.wikipedia.org/wiki/Quantum_mechanics' },
      { label: 'Carl Sagan', url: 'https://en.wikipedia.org/wiki/Carl_Sagan' },
    ],
  },
  {
    id: 'culture',
    title: 'Architecture and music',
    headerBg: '#F2DFCE',
    borderColor: '#BFB0A3',
    articles: [
      { label: 'Fallingwater', url: 'https://en.wikipedia.org/wiki/Fallingwater' },
      { label: 'Bauhaus', url: 'https://en.wikipedia.org/wiki/Bauhaus' },
      { label: 'Synthesizer', url: 'https://en.wikipedia.org/wiki/Synthesizer' },
      { label: 'Circle of fifths', url: 'https://en.wikipedia.org/wiki/Circle_of_fifths' },
      { label: 'Wendy Carlos', url: 'https://en.wikipedia.org/wiki/Wendy_Carlos' },
    ],
  },
];

// ============================================================================
// 1. halcyon://home — Halcyon Library
// ============================================================================

export const HalcyonPortalPage: React.FC<{
  onNavigate: (urlOrQuery: string) => void;
  onRandomArticle: () => void;
  bookmarks: BrowserBookmark[];
}> = ({ onNavigate, onRandomArticle, bookmarks }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<WikiSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const res = await autocompleteWiki(trimmed, 'wikipedia', 'en', ctrl.signal);
      if (!ctrl.signal.aborted) {
        setSuggestions(res);
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    onNavigate(query.trim());
  };

  return (
    <div className="wiki hg-wiki-page">
      <div className="hg-lib-header">
        <div className="hg-lib-title-row">
          <HalcyonMark size={30} variant="color" />
          <div>
            <h1 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Halcyon Library</h1>
            <div className="hg-lib-sub">Encyclopedia and dictionary gateway</div>
          </div>
        </div>
        <div className="hg-lib-nav">
          <button type="button" className="hg-text-link" onClick={() => onNavigate('halcyon://museum')}>
            Design Museum
          </button>
          <span className="hg-sep-pipe">|</span>
          <button type="button" className="hg-text-link" onClick={() => onNavigate('halcyon://safenet')}>
            Library Policy
          </button>
          <span className="hg-sep-pipe">|</span>
          <button type="button" className="hg-text-link" onClick={onRandomArticle}>
            Random article
          </button>
        </div>
      </div>

      <div className="hg-lib-search-box">
        <form onSubmit={handleSubmit} className="hg-lib-search-form">
          <div className="hg-lib-field-wrap">
            <span className="hg-field-glyph-left">
              <UIGlyph name="search" size={14} tone="dark" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 180)}
              placeholder="Search Wikipedia or enter a wikipedia.org address"
              className="hc-field hc-search"
              style={{ width: '100%', height: 24 }}
              aria-label="Search Wikipedia"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="hc-menu hg-lib-ac">
                {suggestions.map((item) => (
                  <button
                    key={item.url}
                    type="button"
                    className="hc-menu-item se-menu-btn"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowSuggestions(false);
                      onNavigate(item.url);
                    }}
                  >
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="hc-btn hc-btn--default">
            Search
          </button>
          <button type="button" className="hc-btn" onClick={onRandomArticle}>
            Random Article
          </button>
        </form>
        <div className="hg-lib-hint">
          Prefix <code>wikt:</code> to search Wiktionary, or visit any <code>wikipedia.org</code> page.
        </div>
      </div>

      <div className="hg-lib-grid">
        {PORTAL_TOPICS.map((box) => (
          <div
            key={box.id}
            className="hg-portal-box"
            style={{ borderColor: box.borderColor }}
          >
            <div
              className="hg-portal-box-head"
              style={{ backgroundColor: box.headerBg, borderBottomColor: box.borderColor }}
            >
              {box.title}
            </div>
            <ul className="hg-portal-box-list">
              {box.articles.map((art) => (
                <li key={art.url}>
                  <button
                    type="button"
                    className="hg-text-link"
                    onClick={() => onNavigate(art.url)}
                  >
                    {art.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="hg-lib-bookmarks">
        <strong>Saved bookmarks:</strong>{' '}
        {bookmarks.map((bm, idx) => (
          <React.Fragment key={bm.id}>
            {idx > 0 && <span className="hg-sep-pipe">·</span>}
            <button type="button" className="hg-text-link" onClick={() => onNavigate(bm.url)}>
              {bm.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 2. halcyon://museum — Halcyon Design Museum
// ============================================================================

const MUSEUM_SWATCHES = [
  {
    name: 'Luna Blue',
    hex: '#2A75E8',
    origin: 'Windows XP Luna titlebar',
    desc: 'Active window crowns and primary default gel buttons.',
  },
  {
    name: 'Luna Linen',
    hex: '#EEECE4',
    origin: 'Windows XP dialog face',
    desc: 'Opaque toolbar shelves, Control Panel surfaces, and alert sheets.',
  },
  {
    name: 'Aqua Selection',
    hex: '#3875D7',
    origin: 'Mac OS X Aqua highlight',
    desc: 'Selected list rows, active menu items, and focus rings.',
  },
  {
    name: 'Meadow Emerald',
    hex: '#3C9A35',
    origin: 'Windows XP Start emblem',
    desc: 'Reserved exclusively for the Start emblem and XP Back/Go jewels.',
  },
];

export const LunaGlassMuseumPage: React.FC<{
  onNavigate: (url: string) => void;
}> = ({ onNavigate }) => {
  const [exhibit, setExhibit] = useState<'chrome' | 'materials' | 'landscape'>('chrome');
  const [selectedSwatch, setSelectedSwatch] = useState(0);

  return (
    <div className="wiki hg-wiki-page">
      <div className="hg-lib-header">
        <div>
          <h1 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Halcyon Design Museum</h1>
          <div className="hg-lib-sub">Comparative study of Windows XP Luna and Mac OS X Aqua</div>
        </div>
        <div className="hc-seg">
          <button
            type="button"
            className={exhibit === 'chrome' ? 'is-active' : ''}
            onClick={() => setExhibit('chrome')}
          >
            Window Chrome
          </button>
          <button
            type="button"
            className={exhibit === 'materials' ? 'is-active' : ''}
            onClick={() => setExhibit('materials')}
          >
            Materials
          </button>
          <button
            type="button"
            className={exhibit === 'landscape' ? 'is-active' : ''}
            onClick={() => setExhibit('landscape')}
          >
            Sonoma &amp; Bliss
          </button>
        </div>
      </div>

      {exhibit === 'chrome' && (
        <div className="hg-museum-cols">
          <div className="hc-groupbox">
            <div className="hc-groupbox-legend">Windows XP Luna (2001)</div>
            <div className="hg-specimen-bar xp">
              <span>My Computer</span>
            </div>
            <p className="hg-museum-p">
              Curved upper shoulders, glossy multi-stop cerulean titlebars, Trebuchet MS bold drop-shadowed titles, and warm beige dialog linen.
            </p>
          </div>

          <div className="hc-groupbox">
            <div className="hc-groupbox-legend">Mac OS X Aqua (2001–2007)</div>
            <div className="hg-specimen-bar mac">
              <span>Finder</span>
            </div>
            <p className="hg-museum-p">
              Left-side traffic light controls, brushed-metal media frames, Lucida Grande chrome typography, and translucent Menu Bar.
            </p>
          </div>

          <div className="hc-groupbox">
            <div className="hc-groupbox-legend">Halcyon Synthesis</div>
            <div className="hg-specimen-bar halcyon">
              <span>Safari Explorer</span>
            </div>
            <p className="hg-museum-p">
              Opaque machined windows framed by Luna blue crowns, unified 34px toolbars, traffic lights, and a single Horizon glass shelf.
            </p>
          </div>
        </div>
      )}

      {exhibit === 'materials' && (
        <div className="hc-groupbox">
          <div className="hc-groupbox-legend">Core Surface Palette</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {MUSEUM_SWATCHES.map((sw, idx) => (
              <button
                key={sw.name}
                type="button"
                className={`hc-btn ${selectedSwatch === idx ? 'hc-btn--default' : ''}`}
                onClick={() => setSelectedSwatch(idx)}
              >
                {sw.name}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 4,
                background: MUSEUM_SWATCHES[selectedSwatch].hex,
                border: '1px solid rgba(0,0,0,0.28)',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{MUSEUM_SWATCHES[selectedSwatch].name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', margin: '2px 0 4px' }}>
                {MUSEUM_SWATCHES[selectedSwatch].origin} · <code>{MUSEUM_SWATCHES[selectedSwatch].hex}</code>
              </div>
              <div style={{ fontSize: 12 }}>{MUSEUM_SWATCHES[selectedSwatch].desc}</div>
            </div>
          </div>
        </div>
      )}

      {exhibit === 'landscape' && (
        <div className="hc-groupbox">
          <div className="hc-groupbox-legend">Sonoma County Heritage</div>
          <p className="hg-museum-p">
            In January 1996, Charles O&apos;Rear photographed a green hillside along Highway 12/121 in <b>Sonoma County, California</b> for what became Windows XP&apos;s <i>Bliss</i> wallpaper. Decades later, Apple named macOS 14 <b>Sonoma</b> after the very same California valley.
          </p>
        </div>
      )}

      <div className="hg-lib-bookmarks" style={{ marginTop: 16 }}>
        <strong>Related Wikipedia articles:</strong>{' '}
        <button type="button" className="hg-text-link" onClick={() => onNavigate('https://en.wikipedia.org/wiki/Windows_XP')}>
          Windows XP
        </button>
        <span className="hg-sep-pipe">·</span>
        <button type="button" className="hg-text-link" onClick={() => onNavigate('https://en.wikipedia.org/wiki/Bliss_(photograph)')}>
          Bliss (photograph)
        </button>
        <span className="hg-sep-pipe">·</span>
        <button type="button" className="hg-text-link" onClick={() => onNavigate('https://en.wikipedia.org/wiki/Aqua_(user_interface)')}>
          Aqua (user interface)
        </button>
        <span className="hg-sep-pipe">·</span>
        <button type="button" className="hg-text-link" onClick={() => onNavigate('https://en.wikipedia.org/wiki/macOS')}>
          macOS
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 3. halcyon://safenet — Halcyon Library Policy
// ============================================================================

export const SafeNetPolicyPage: React.FC<{
  onNavigate: (url: string) => void;
  stats: { articlesRead: number; blockedCount: number; clippedCount: number };
}> = ({ onNavigate, stats }) => {
  return (
    <div className="wiki hg-wiki-page">
      <div className="hg-lib-header">
        <div>
          <h1 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Halcyon Library Policy</h1>
          <div className="hg-lib-sub">Allowed encyclopedic origins and session statistics</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="hc-groupbox">
          <div className="hc-groupbox-legend">Permitted Origins</div>
          <div className="hc-list" style={{ border: '1px solid #B8B5AA', borderRadius: 2 }}>
            {SAFENET_ALLOWED_DOMAINS.map((domain) => (
              <div
                key={domain}
                className="hc-list-row"
                style={{ justifyContent: 'space-between' }}
              >
                <code>{domain}</code>
                <span style={{ color: '#24721F', fontSize: 11 }}>Allowed</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hc-groupbox">
          <div className="hc-groupbox-legend">Session Statistics</div>
          <div style={{ fontSize: 12, lineHeight: 1.8, fontVariantNumeric: 'tabular-nums' }}>
            <div>Articles loaded: <strong>{stats.articlesRead}</strong></div>
            <div>Blocked external requests: <strong>{stats.blockedCount}</strong></div>
            <div>Saved to Documents: <strong>{stats.clippedCount}</strong></div>
          </div>
        </div>
      </div>

      <div className="hc-groupbox">
        <div className="hc-groupbox-legend">Verify Gatekeeper Behavior</div>
        <p className="hg-museum-p" style={{ marginTop: 0 }}>
          External destinations outside Wikipedia, Wiktionary, and Halcyon Library pages display a confirmation sheet offering a Wikipedia search instead.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="hc-btn" onClick={() => onNavigate('https://google.com')}>
            Open google.com
          </button>
          <button type="button" className="hc-btn" onClick={() => onNavigate('https://youtube.com')}>
            Open youtube.com
          </button>
          <button type="button" className="hc-btn" onClick={() => onNavigate('https://nytimes.com')}>
            Open nytimes.com
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. Gatekeeper — Mac Alert Sheet (§9.3)
// ============================================================================

export const SafeNetBlockedPage: React.FC<{
  blockedUrl: string;
  domain: string;
  suggestedQuery: string;
  reason: string;
  canGoBack: boolean;
  onSearchWikipedia: (query: string) => void;
  onGoHome: () => void;
  onGoBack: () => void;
}> = ({
  domain,
  suggestedQuery,
  canGoBack,
  onSearchWikipedia,
  onGoHome,
  onGoBack,
}) => {
  return (
    <div className="hg-sheet-backdrop">
      <div className="hg-mac-sheet" role="alertdialog" aria-labelledby="hg-sheet-title">
        <div className="hg-sheet-row">
          <div className="hg-sheet-icon-wrap">
            <AppIcon appId="browser" size={64} />
            <span className="hg-sheet-caution" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path
                  d="M12.14 2.75a1 1 0 0 1 1.72 0l10.22 17.5a1 1 0 0 1-.86 1.5H2.78a1 1 0 0 1-.86-1.5L12.14 2.75z"
                  fill="#F5B53B"
                  stroke="#A87008"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 4.35L3.82 20.1h18.36L13 4.35z"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <rect x="12.05" y="9" width="1.9" height="6.4" rx="0.95" fill="#1D1D1F" />
                <circle cx="13" cy="17.85" r="1.1" fill="#1D1D1F" />
              </svg>
            </span>
          </div>
          <div className="hg-sheet-copy">
            <div id="hg-sheet-title" className="hg-sheet-title">
              Halcyon can’t open the page “{domain}”.
            </div>
            <div className="hg-sheet-body">
              Halcyon only opens pages from Wikipedia and the Halcyon Library. You can search Wikipedia for this topic instead.
            </div>
          </div>
        </div>
        <div className="hg-sheet-actions">
          <button
            type="button"
            className="hc-btn"
            onClick={canGoBack ? onGoBack : onGoHome}
          >
            Go Back
          </button>
          <button
            type="button"
            className="hc-btn hc-btn--default"
            onClick={() => onSearchWikipedia(suggestedQuery)}
          >
            Search Wikipedia
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. Wikipedia / Wiktionary Search Results Page
// ============================================================================

export const WikiSearchResultsPage: React.FC<{
  query: string;
  site: WikiSite;
  results: WikiSearchResult[];
  error?: string;
  onNavigate: (url: string) => void;
  onSwitchSite: (site: WikiSite) => void;
}> = ({ query, site, results, error, onNavigate, onSwitchSite }) => {
  return (
    <div className="wiki hg-wiki-page">
      <div className="hg-lib-header">
        <div>
          <h1 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>
            Search results for “{query}”
          </h1>
          <div className="hg-lib-sub">
            {site === 'wiktionary' ? 'Wiktionary' : 'Wikipedia'}
          </div>
        </div>
        <div className="hc-seg">
          <button
            type="button"
            className={site === 'wikipedia' ? 'is-active' : ''}
            onClick={() => onSwitchSite('wikipedia')}
          >
            Wikipedia
          </button>
          <button
            type="button"
            className={site === 'wiktionary' ? 'is-active' : ''}
            onClick={() => onSwitchSite('wiktionary')}
          >
            Wiktionary
          </button>
        </div>
      </div>

      {error && (
        <div className="hatnote">
          Live search unavailable ({error}). Showing offline matches.
        </div>
      )}

      {results.length === 0 ? (
        <p>No entries found for “{query}”.</p>
      ) : (
        <div className="hg-search-results">
          {results.map((item) => (
            <div key={item.url} className="hg-search-item">
              <div>
                <button
                  type="button"
                  className="hg-text-link hg-search-title"
                  onClick={() => onNavigate(item.url)}
                >
                  {item.title}
                </button>
              </div>
              <div className="hg-search-url">{item.url}</div>
              <div className="hg-search-snippet">{item.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
