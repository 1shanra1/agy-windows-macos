export type WikiSite = 'wikipedia' | 'wiktionary';

export interface WikiSection {
  index: string;
  line: string;
  level: string;
  anchor: string;
  number: string;
}

export interface WikiArticle {
  title: string;
  pageTitle: string;
  site: WikiSite;
  lang: string;
  url: string;
  extract: string;
  description?: string;
  thumbnailUrl?: string;
  html: string;
  sections: WikiSection[];
  isOfflineFallback?: boolean;
  fetchedAt: number;
}

export interface WikiSearchResult {
  title: string;
  description: string;
  url: string;
  site: WikiSite;
  lang: string;
}

export type IntranetRoute = 'home' | 'museum' | 'safenet';

export type ParsedDestination =
  | { kind: 'intranet'; url: string; route: IntranetRoute }
  | { kind: 'wiki'; site: WikiSite; lang: string; page: string; canonicalUrl: string; fragment?: string }
  | { kind: 'wiki-search'; query: string; site: WikiSite; lang: string }
  | { kind: 'blocked'; inputUrl: string; domain: string; suggestedQuery: string; reason: string };

export const SAFENET_ALLOWED_DOMAINS = [
  '*.wikipedia.org',
  '*.wiktionary.org',
  'halcyon://home',
  'halcyon://museum',
  'halcyon://safenet',
] as const;

export function isAllowedWikiHostname(rawHost: string): { allowed: boolean; site?: WikiSite; lang: string } {
  const host = rawHost.trim().toLowerCase().replace(/\.$/, '');
  if (host === 'wikipedia.org' || host.endsWith('.wikipedia.org')) {
    const sub = host === 'wikipedia.org' ? '' : host.slice(0, -'.wikipedia.org'.length);
    const parts = sub.split('.').filter(Boolean);
    const first = parts[0];
    const lang = !first || first === 'www' || first === 'm' ? 'en' : first;
    return { allowed: true, site: 'wikipedia', lang };
  }
  if (host === 'wiktionary.org' || host.endsWith('.wiktionary.org')) {
    const sub = host === 'wiktionary.org' ? '' : host.slice(0, -'.wiktionary.org'.length);
    const parts = sub.split('.').filter(Boolean);
    const first = parts[0];
    const lang = !first || first === 'www' || first === 'm' ? 'en' : first;
    return { allowed: true, site: 'wiktionary', lang };
  }
  return { allowed: false, lang: 'en' };
}

function buildSuggestedQueryFromUrl(rawUrl: string, hostname: string): string {
  const knownMap: Record<string, string> = {
    'google.com': 'Google',
    'youtube.com': 'YouTube',
    'twitter.com': 'Twitter',
    'x.com': 'Twitter',
    'reddit.com': 'Reddit',
    'nytimes.com': 'The New York Times',
    'github.com': 'GitHub',
    'facebook.com': 'Facebook',
    'instagram.com': 'Instagram',
    'apple.com': 'Apple Inc.',
    'microsoft.com': 'Microsoft',
    'amazon.com': 'Amazon (company)',
    'netflix.com': 'Netflix',
    'spotify.com': 'Spotify',
    'bbc.com': 'BBC',
    'cnn.com': 'CNN',
    'example.com': 'Example.com',
  };
  const cleanHost = hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
  if (knownMap[cleanHost]) return knownMap[cleanHost];

  const base = cleanHost.split('.')[0];
  if (base && base !== 'localhost' && !/^\d+$/.test(base)) {
    return base.charAt(0).toUpperCase() + base.slice(1);
  }
  const stripped = rawUrl.replace(/^[a-zA-Z]+:\/\//, '').split(/[/?#]/)[0];
  return stripped || 'World Wide Web';
}

function looksLikeDomainOrUrl(input: string): boolean {
  if (/\s/.test(input)) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input)) return true;
  if (/^localhost(:\d+)?(\/|$)/i.test(input)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(input)) return true;
  // Matches example.com, sub.domain.org/path, etc. (avoids "Windows 3.1" since spaces are already rejected)
  if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?([/?#].*)?$/.test(input)) return true;
  return false;
}

export function parseBrowserInput(rawInput: string): ParsedDestination {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { kind: 'intranet', url: 'halcyon://home', route: 'home' };
  }

  // Handle internal halcyon:// protocol
  if (/^halcyon:\/\//i.test(trimmed)) {
    const rest = trimmed.slice('halcyon://'.length).toLowerCase().replace(/\/+$/, '');
    if (rest === 'museum' || rest.startsWith('museum/')) {
      return { kind: 'intranet', url: 'halcyon://museum', route: 'museum' };
    }
    if (rest === 'safenet' || rest.startsWith('safenet/')) {
      return { kind: 'intranet', url: 'halcyon://safenet', route: 'safenet' };
    }
    return { kind: 'intranet', url: 'halcyon://home', route: 'home' };
  }

  // Handle explicit wiki:/wikt: search shortcuts
  if (/^wikt(ionary)?:/i.test(trimmed)) {
    const q = trimmed.replace(/^wikt(ionary)?:/i, '').trim();
    return { kind: 'wiki-search', query: q || 'halcyon', site: 'wiktionary', lang: 'en' };
  }
  if (/^wiki(pedia)?:/i.test(trimmed)) {
    const q = trimmed.replace(/^wiki(pedia)?:/i, '').trim();
    return { kind: 'wiki-search', query: q || 'Wikipedia', site: 'wikipedia', lang: 'en' };
  }

  if (looksLikeDomainOrUrl(trimmed)) {
    const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
    let parsed: URL;
    try {
      parsed = new URL(withScheme);
    } catch {
      return {
        kind: 'blocked',
        inputUrl: trimmed,
        domain: trimmed,
        suggestedQuery: trimmed.replace(/[^a-zA-Z0-9 ]/g, ' ').trim() || 'Internet',
        reason: 'Malformed or unsupported destination URI blocked by SafeNet Gatekeeper.',
      };
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        kind: 'blocked',
        inputUrl: trimmed,
        domain: parsed.protocol.replace(':', '') || 'unknown',
        suggestedQuery: 'Uniform Resource Identifier',
        reason: `Protocol "${parsed.protocol}" is disabled in Halcyon OS SafeNet mode.`,
      };
    }

    const hostCheck = isAllowedWikiHostname(parsed.hostname);
    if (!hostCheck.allowed || !hostCheck.site) {
      return {
        kind: 'blocked',
        inputUrl: trimmed,
        domain: parsed.hostname,
        suggestedQuery: buildSuggestedQueryFromUrl(trimmed, parsed.hostname),
        reason:
          'Halcyon only opens pages from Wikipedia and the Halcyon Library. You can search Wikipedia for this topic instead.',
      };
    }

    const site = hostCheck.site;
    const lang = hostCheck.lang;
    const fragment = parsed.hash ? decodeURIComponent(parsed.hash.slice(1)) : undefined;

    // Handle /w/index.php?title=... or ?search=...
    if (parsed.pathname.startsWith('/w/index.php')) {
      const titleParam = parsed.searchParams.get('title');
      const searchParam = parsed.searchParams.get('search');
      if (searchParam) {
        return { kind: 'wiki-search', query: searchParam, site, lang };
      }
      if (titleParam) {
        const page = titleParam.replace(/ /g, '_');
        return {
          kind: 'wiki',
          site,
          lang,
          page,
          canonicalUrl: `https://${lang}.${site}.org/wiki/${encodeURIComponent(page).replace(/%2F/g, '/')}`,
          fragment,
        };
      }
    }

    // Handle /wiki/<Page>
    if (parsed.pathname.startsWith('/wiki/')) {
      const rawPage = parsed.pathname.slice('/wiki/'.length);
      let decodedPage = rawPage;
      try {
        decodedPage = decodeURIComponent(rawPage);
      } catch {
        decodedPage = rawPage;
      }
      const page = decodedPage.replace(/ /g, '_') || (site === 'wiktionary' ? 'Wiktionary:Main_Page' : 'Wikipedia');
      return {
        kind: 'wiki',
        site,
        lang,
        page,
        canonicalUrl: `https://${lang}.${site}.org/wiki/${encodeURIComponent(page).replace(/%2F/g, '/')}`,
        fragment,
      };
    }

    // Root domain visit e.g. https://en.wikipedia.org or wikipedia.org
    const defaultPage = site === 'wiktionary' ? 'halcyon' : 'Wikipedia';
    return {
      kind: 'wiki',
      site,
      lang,
      page: defaultPage,
      canonicalUrl: `https://${lang}.${site}.org/wiki/${defaultPage}`,
      fragment,
    };
  }

  // Plain words -> search Wikipedia
  return { kind: 'wiki-search', query: trimmed, site: 'wikipedia', lang: 'en' };
}

export function extractUrlFromShortcutContent(content: string): string {
  const trimmed = content.trim();
  const match = trimmed.match(/^URL\s*=\s*(.+)$/im);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}

function resolveWikimediaUrl(raw: string, lang: string, site: WikiSite): string {
  if (!raw) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `https://${lang}.${site}.org${raw}`;
  return raw;
}

function rewriteSrcset(srcset: string, lang: string, site: WikiSite): string {
  return srcset
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(/\s+/);
      if (!parts[0]) return entry;
      parts[0] = resolveWikimediaUrl(parts[0], lang, site);
      return parts.join(' ');
    })
    .join(', ');
}

export function sanitizeWikiHtml(rawHtml: string, lang: string, site: WikiSite): { html: string; fallbackExtract: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="halcyon-wiki-root">${rawHtml}</div>`, 'text/html');
  const root = doc.getElementById('halcyon-wiki-root');
  if (!root) {
    return { html: '', fallbackExtract: '' };
  }

  const removeSelectors = [
    'script',
    'style',
    'link',
    'noscript',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    '.mw-editsection',
    '.navbox',
    '.sistersitebox',
    '.ambox',
    '.mbox-small',
    '.authority-control',
    '.metadata',
    '.noprint',
    '.mw-empty-elt',
    '.shortdescription',
  ];

  root.querySelectorAll(removeSelectors.join(',')).forEach((el) => el.remove());

  const allElements = root.querySelectorAll('*');
  allElements.forEach((el) => {
    // Remove inline event handlers and unsafe style/attribute vectors
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === 'href' || name === 'src' || name === 'action') && /^(javascript|vbscript|data:text\/html)/i.test(val)) {
        el.removeAttribute(attr.name);
      }
    });

    if (
      el.classList.contains('infobox') ||
      el.classList.contains('sidebar') ||
      el.classList.contains('vertical-navbox') ||
      el.classList.contains('side-box')
    ) {
      el.removeAttribute('width');
      if ('style' in el && (el as HTMLElement).style) {
        (el as HTMLElement).style.removeProperty('width');
      }
    }

    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src');
      if (src) {
        el.setAttribute('src', resolveWikimediaUrl(src, lang, site));
      }
      const srcset = el.getAttribute('srcset');
      if (srcset) {
        el.setAttribute('srcset', rewriteSrcset(srcset, lang, site));
      }
      el.setAttribute('loading', 'lazy');
      el.removeAttribute('decoding');
    }

    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      if (!href) return;

      if (href.startsWith('#')) {
        el.setAttribute('data-halcyon-anchor', href.slice(1));
        return;
      }

      if (href.startsWith('/wiki/') || href.startsWith('/w/index.php')) {
        const fullUrl = `https://${lang}.${site}.org${href}`;
        el.setAttribute('href', fullUrl);
        el.setAttribute('data-halcyon-nav', fullUrl);
        return;
      }

      if (href.startsWith('//')) {
        const fullUrl = `https:${href}`;
        el.setAttribute('href', fullUrl);
        el.setAttribute('data-halcyon-nav', fullUrl);
        return;
      }

      if (/^https?:\/\//i.test(href)) {
        el.setAttribute('data-halcyon-nav', href);
        return;
      }
    }
  });

  // Extract clean summary text from first 2 substantial paragraphs
  const paragraphs = Array.from(root.querySelectorAll('p'))
    .map((p) => (p.textContent || '').replace(/\[\d+\]/g, '').trim())
    .filter((text) => text.length > 40);
  const fallbackExtract = paragraphs.slice(0, 2).join('\n\n');

  return {
    html: root.innerHTML,
    fallbackExtract,
  };
}

export async function autocompleteWiki(
  query: string,
  site: WikiSite = 'wikipedia',
  lang = 'en',
  signal?: AbortSignal
): Promise<WikiSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const endpoint = `https://${lang}.${site}.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      q
    )}&limit=7&namespace=0&format=json&origin=*`;
    const res = await fetch(endpoint, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as [string, string[], string[], string[]];
    const titles = data[1] || [];
    const descs = data[2] || [];
    const urls = data[3] || [];
    return titles.map((title, idx) => ({
      title,
      description: descs[idx] || `${site === 'wiktionary' ? 'Wiktionary' : 'Wikipedia'} entry`,
      url: urls[idx] || `https://${lang}.${site}.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      site,
      lang,
    }));
  } catch (err) {
    if ((err as Error).name === 'AbortError') return [];
    return searchOfflineFallbacks(q, site, lang);
  }
}

export async function searchWiki(
  query: string,
  site: WikiSite = 'wikipedia',
  lang = 'en'
): Promise<WikiSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const endpoint = `https://${lang}.${site}.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      q
    )}&srlimit=10&format=json&origin=*`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      query?: {
        search?: Array<{ title: string; snippet: string }>;
      };
    };
    const items = data.query?.search || [];
    if (items.length === 0) {
      return searchOfflineFallbacks(q, site, lang);
    }
    return items.map((item) => {
      const cleanSnippet = item.snippet.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
      return {
        title: item.title,
        description: cleanSnippet,
        url: `https://${lang}.${site}.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
        site,
        lang,
      };
    });
  } catch {
    return searchOfflineFallbacks(q, site, lang);
  }
}

export async function fetchWikiArticle(
  page: string,
  site: WikiSite = 'wikipedia',
  lang = 'en'
): Promise<WikiArticle> {
  const normalizedPage = page.trim().replace(/ /g, '_') || 'Wikipedia';

  try {
    const parseUrl = `https://${lang}.${site}.org/w/api.php?action=parse&page=${encodeURIComponent(
      normalizedPage
    )}&prop=text|sections|displaytitle&redirects=1&format=json&origin=*`;
    const summaryUrl = `https://${lang}.${site}.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedPage)}`;

    const [parseRes, summarySettled] = await Promise.all([
      fetch(parseUrl),
      fetch(summaryUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    if (!parseRes.ok) {
      throw new Error(`HTTP ${parseRes.status}`);
    }

    const parseJson = (await parseRes.json()) as {
      error?: { code?: string; info?: string };
      parse?: {
        title: string;
        displaytitle?: string;
        text?: { '*'?: string };
        sections?: Array<{ index: string; line: string; level: string; anchor: string; number: string }>;
      };
    };

    if (parseJson.error || !parseJson.parse?.text?.['*']) {
      const fallback = findOfflineFallback(normalizedPage);
      if (fallback) return fallback;
      throw new Error(parseJson.error?.info || `Article "${normalizedPage.replace(/_/g, ' ')}" was not found.`);
    }

    const rawHtml = parseJson.parse.text['*'];
    const { html, fallbackExtract } = sanitizeWikiHtml(rawHtml, lang, site);

    const summaryData = summarySettled as {
      title?: string;
      description?: string;
      extract?: string;
      thumbnail?: { source?: string };
    } | null;

    const plainDisplayTitle = (parseJson.parse.displaytitle || parseJson.parse.title).replace(/<[^>]+>/g, '');
    const pageTitle = parseJson.parse.title.replace(/ /g, '_');

    const sections: WikiSection[] = (parseJson.parse.sections || [])
      .filter((s) => s.level === '2' || s.level === '3')
      .map((s) => ({
        index: s.index,
        line: s.line.replace(/<[^>]+>/g, ''),
        level: s.level,
        anchor: s.anchor,
        number: s.number,
      }));

    return {
      title: plainDisplayTitle,
      pageTitle,
      site,
      lang,
      url: `https://${lang}.${site}.org/wiki/${encodeURIComponent(pageTitle).replace(/%2F/g, '/')}`,
      extract: summaryData?.extract || fallbackExtract || plainDisplayTitle,
      description: summaryData?.description,
      thumbnailUrl: summaryData?.thumbnail?.source,
      html,
      sections,
      isOfflineFallback: false,
      fetchedAt: Date.now(),
    };
  } catch (err) {
    const fallback = findOfflineFallback(normalizedPage);
    if (fallback) return fallback;
    throw err;
  }
}

export async function fetchRandomWikiTarget(
  site: WikiSite = 'wikipedia',
  lang = 'en'
): Promise<{ url: string; title: string }> {
  try {
    const endpoint = `https://${lang}.${site}.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      query?: { random?: Array<{ id: number; title: string }> };
    };
    const item = data.query?.random?.[0];
    if (!item?.title) throw new Error('Empty random result');
    const slug = encodeURIComponent(item.title.replace(/ /g, '_')).replace(/%2F/g, '/');
    return {
      url: `https://${lang}.${site}.org/wiki/${slug}`,
      title: item.title,
    };
  } catch {
    const pool = OFFLINE_FALLBACK_ARTICLES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { url: pick.url, title: pick.title };
  }
}

// ============================================================================
// Offline-Resilient Curated Encyclopedia Fallback Articles
// ============================================================================

const OFFLINE_FALLBACK_ARTICLES: WikiArticle[] = [
  {
    title: 'Windows XP',
    pageTitle: 'Windows_XP',
    site: 'wikipedia',
    lang: 'en',
    url: 'https://en.wikipedia.org/wiki/Windows_XP',
    description: 'Operating system developed by Microsoft (2001)',
    extract:
      'Windows XP is a major release of Microsoft\'s Windows NT operating system. Released to manufacturing in August 2001 and to retail in October 2001, it unified Microsoft\'s consumer and enterprise lines around the Windows NT kernel and introduced the iconic Luna visual style and Bliss desktop wallpaper.',
    sections: [
      { index: '1', line: 'Luna visual style & interface', level: '2', anchor: 'Luna_visual_style', number: '1' },
      { index: '2', line: 'Bliss wallpaper', level: '2', anchor: 'Bliss_wallpaper', number: '2' },
      { index: '3', line: 'Legacy and design influence', level: '2', anchor: 'Legacy', number: '3' },
    ],
    html: `
      <table class="infobox">
        <tbody>
          <tr><th colspan="2">Windows XP</th></tr>
          <tr><th>Developer</th><td>Microsoft</td></tr>
          <tr><th>Release date</th><td>October 25, 2001</td></tr>
          <tr><th>Default UI</th><td><a href="https://en.wikipedia.org/wiki/Luna_(theme)" data-halcyon-nav="https://en.wikipedia.org/wiki/Luna_(theme)">Luna</a></td></tr>
          <tr><th>Default wallpaper</th><td><a href="https://en.wikipedia.org/wiki/Bliss_(photograph)" data-halcyon-nav="https://en.wikipedia.org/wiki/Bliss_(photograph)">Bliss</a></td></tr>
        </tbody>
      </table>
      <p><b>Windows XP</b> is a major release of Microsoft's Windows NT operating system, launched on October 25, 2001. It was the first consumer-oriented Windows built on the NT kernel, pairing vastly improved stability with a welcoming, sunlit graphical user interface.</p>
      <h2 id="Luna_visual_style">Luna visual style &amp; interface</h2>
      <p>Windows XP replaced the muted grey bevels of Windows 95 and Windows 2000 with <b>Luna</b>: rounded cerulean window titlebars, a vibrant emerald-green <i>Start</i> button, and a two-column Start menu. Its glossy 3D icons and task panes became a defining touchstone of early-2000s optimism.</p>
      <h2 id="Bliss_wallpaper">Bliss wallpaper</h2>
      <p>Its default desktop background, <a href="https://en.wikipedia.org/wiki/Bliss_(photograph)" data-halcyon-nav="https://en.wikipedia.org/wiki/Bliss_(photograph)">Bliss</a>, is a photograph of rolling green hills and cirrus clouds in California's Los Carneros wine region captured by Charles O'Rear in 1996. Today it is often cited as one of the most widely viewed photographs in history.</p>
      <h2 id="Legacy">Legacy and design influence</h2>
      <p>Alongside Apple's <a href="https://en.wikipedia.org/wiki/Aqua_(user_interface)" data-halcyon-nav="https://en.wikipedia.org/wiki/Aqua_(user_interface)">Aqua</a> interface in <a href="https://en.wikipedia.org/wiki/MacOS" data-halcyon-nav="https://en.wikipedia.org/wiki/MacOS">macOS</a>, Windows XP popularized tactile depth, vibrant color gradients, and playful desktop metaphors that inspired the LunaGlass aesthetic of Halcyon OS.</p>
    `,
    isOfflineFallback: true,
    fetchedAt: Date.now(),
  },
  {
    title: 'macOS',
    pageTitle: 'macOS',
    site: 'wikipedia',
    lang: 'en',
    url: 'https://en.wikipedia.org/wiki/macOS',
    description: 'Unix-based desktop operating system developed by Apple',
    extract:
      'macOS is a Unix operating system developed and marketed by Apple since 2001. Known for its translucent vibrancy materials, top global menu bar, floating application Dock, and precision typography, macOS evolved from Mac OS X Aqua into modern Sonoma and Sequoia.',
    sections: [
      { index: '1', line: 'From Aqua to Sonoma', level: '2', anchor: 'From_Aqua_to_Sonoma', number: '1' },
      { index: '2', line: 'Desktop architecture', level: '2', anchor: 'Desktop_architecture', number: '2' },
    ],
    html: `
      <table class="infobox">
        <tbody>
          <tr><th colspan="2">macOS</th></tr>
          <tr><th>Developer</th><td>Apple Inc.</td></tr>
          <tr><th>Initial release</th><td>March 24, 2001 (Mac OS X 10.0)</td></tr>
          <tr><th>UI heritage</th><td><a href="https://en.wikipedia.org/wiki/Aqua_(user_interface)" data-halcyon-nav="https://en.wikipedia.org/wiki/Aqua_(user_interface)">Aqua</a> &amp; Vibrancy Glass</td></tr>
          <tr><th>Recent editions</th><td>Sonoma, Sequoia</td></tr>
        </tbody>
      </table>
      <p><b>macOS</b> (originally Mac OS X, later OS X) is Apple's desktop operating system for Macintosh computers. Built on the Darwin Unix core, it pairs technical reliability with meticulous industrial and graphical design.</p>
      <h2 id="From_Aqua_to_Sonoma">From Aqua to Sonoma</h2>
      <p>Introduced alongside <a href="https://en.wikipedia.org/wiki/Windows_XP" data-halcyon-nav="https://en.wikipedia.org/wiki/Windows_XP">Windows XP</a> in 2001, Mac OS X debuted the <a href="https://en.wikipedia.org/wiki/Aqua_(user_interface)" data-halcyon-nav="https://en.wikipedia.org/wiki/Aqua_(user_interface)">Aqua</a> design language featuring translucent gel buttons and drop shadows. Modern releases such as macOS Sonoma refine those ideas into frosted liquid glass, squircle app icons, and sweeping Northern California landscapes.</p>
      <h2 id="Desktop_architecture">Desktop architecture</h2>
      <p>Signature elements include the persistent top menu bar with active application menus, the centered translucent Dock with hover magnification, Spotlight instant search, and Finder's multi-view file navigation.</p>
    `,
    isOfflineFallback: true,
    fetchedAt: Date.now(),
  },
  {
    title: 'Bliss (photograph)',
    pageTitle: 'Bliss_(photograph)',
    site: 'wikipedia',
    lang: 'en',
    url: 'https://en.wikipedia.org/wiki/Bliss_(photograph)',
    description: '1996 photograph by Charles O\'Rear, default wallpaper of Windows XP',
    extract:
      'Bliss is the name of the default computer wallpaper of Microsoft\'s Windows XP operating system. It is a virtually unedited photograph of a rolling green hill and blue sky with stratocumulus and cirrus clouds in the Los Carneros American Viticultural Area of Sonoma County, California.',
    sections: [
      { index: '1', line: 'Capture in Sonoma County', level: '2', anchor: 'Capture_in_Sonoma_County', number: '1' },
      { index: '2', line: 'Adoption in Windows XP', level: '2', anchor: 'Adoption_in_Windows_XP', number: '2' },
    ],
    html: `
      <table class="infobox">
        <tbody>
          <tr><th colspan="2">Bliss</th></tr>
          <tr><th>Photographer</th><td>Charles O'Rear</td></tr>
          <tr><th>Date</th><td>January 1996</td></tr>
          <tr><th>Location</th><td>Sonoma County, California</td></tr>
          <tr><th>Subject</th><td>Los Carneros rolling hillside</td></tr>
        </tbody>
      </table>
      <p><b>Bliss</b> is the default wallpaper of <a href="https://en.wikipedia.org/wiki/Windows_XP" data-halcyon-nav="https://en.wikipedia.org/wiki/Windows_XP">Windows XP</a>. Photographer Charles O'Rear took the medium-format Mamiya RZ67 shot on Fuji Velvia film in January 1996 along Highway 12/121 in Sonoma County, California.</p>
      <h2 id="Capture_in_Sonoma_County">Capture in Sonoma County</h2>
      <p>Because a phylloxera infestation had temporarily cleared the vineyard vines a few years earlier, the hillside was covered in lush, uninterrupted winter grass beneath crisp blue skies and delicate high clouds.</p>
      <h2 id="Adoption_in_Windows_XP">Adoption in Windows XP</h2>
      <p>Microsoft licensed the photograph in 2000 for its upcoming Windows XP launch. Remarkably, Sonoma County is the very same California wine country celebrated decades later in Apple's <a href="https://en.wikipedia.org/wiki/MacOS" data-halcyon-nav="https://en.wikipedia.org/wiki/MacOS">macOS Sonoma</a> — making Bliss the poetic geographic bridge behind Halcyon OS.</p>
    `,
    isOfflineFallback: true,
    fetchedAt: Date.now(),
  },
  {
    title: 'Aqua (user interface)',
    pageTitle: 'Aqua_(user_interface)',
    site: 'wikipedia',
    lang: 'en',
    url: 'https://en.wikipedia.org/wiki/Aqua_(user_interface)',
    description: 'Graphical user interface design language of macOS',
    extract:
      'Aqua is the graphical user interface, design language, and visual theme of Apple\'s macOS operating system. Originally unveiled at Macworld San Francisco in January 2000, it introduced water-inspired translucency, specular highlights, and fluid motion.',
    sections: [
      { index: '1', line: 'Design principles', level: '2', anchor: 'Design_principles', number: '1' },
      { index: '2', line: 'Evolution', level: '2', anchor: 'Evolution', number: '2' },
    ],
    html: `
      <table class="infobox">
        <tbody>
          <tr><th colspan="2">Aqua</th></tr>
          <tr><th>Creator</th><td>Apple Inc.</td></tr>
          <tr><th>Unveiled</th><td>January 5, 2000</td></tr>
          <tr><th>System</th><td><a href="https://en.wikipedia.org/wiki/MacOS" data-halcyon-nav="https://en.wikipedia.org/wiki/MacOS">macOS</a></td></tr>
        </tbody>
      </table>
      <p><b>Aqua</b> is the graphical user interface and design language of <a href="https://en.wikipedia.org/wiki/MacOS" data-halcyon-nav="https://en.wikipedia.org/wiki/MacOS">macOS</a>. Its name derives from its signature water-droplet controls, soft ambient shadows, and luminous blue highlights.</p>
      <h2 id="Design_principles">Design principles</h2>
      <p>When Steve Jobs unveiled Aqua in 2000, he famously remarked that the buttons looked so good "you'll want to lick them." Traffic-light window controls (red close, yellow minimize, green zoom) and translucent sheet dialogs became enduring hallmarks of Apple software.</p>
      <h2 id="Evolution">Evolution</h2>
      <p>Over two decades, Aqua evolved from glossy pinstripes and brushed metal into modern macOS vibrancy — layered frosted glass panels that refract the desktop wallpaper behind them while maintaining razor-sharp typography.</p>
    `,
    isOfflineFallback: true,
    fetchedAt: Date.now(),
  },
  {
    title: 'Alan Turing',
    pageTitle: 'Alan_Turing',
    site: 'wikipedia',
    lang: 'en',
    url: 'https://en.wikipedia.org/wiki/Alan_Turing',
    description: 'English mathematician and computer scientist (1912–1954)',
    extract:
      'Alan Mathison Turing OBE FRS was an English mathematician, computer scientist, logician, cryptanalyst, philosopher, and theoretical biologist. He was highly influential in the development of theoretical computer science, formalizing computation with the Turing machine.',
    sections: [
      { index: '1', line: 'Turing machine & computation', level: '2', anchor: 'Turing_machine', number: '1' },
      { index: '2', line: 'Bletchley Park & legacy', level: '2', anchor: 'Legacy', number: '2' },
    ],
    html: `
      <table class="infobox">
        <tbody>
          <tr><th colspan="2">Alan Turing</th></tr>
          <tr><th>Born</th><td>23 June 1912, London</td></tr>
          <tr><th>Died</th><td>7 June 1954, Wilmslow</td></tr>
          <tr><th>Known for</th><td>Turing machine, Turing test, Cryptanalysis of the Enigma</td></tr>
        </tbody>
      </table>
      <p><b>Alan Mathison Turing</b> (1912–1954) was a pioneering mathematician and computer scientist widely considered the father of theoretical computer science and artificial intelligence.</p>
      <h2 id="Turing_machine">Turing machine &amp; computation</h2>
      <p>In his landmark 1936 paper <i>On Computable Numbers</i>, Turing defined an abstract tape-reading device — now called the Turing machine — demonstrating that a single universal machine could simulate any algorithmic computation, laying the conceptual blueprint for all modern stored-program computers.</p>
      <h2 id="Legacy">Bletchley Park &amp; legacy</h2>
      <p>During the Second World War, Turing led Hut 8 at Bletchley Park, designing electro-mechanical Bombe machines to decipher German naval Enigma traffic. After the war, he authored the design for the Automatic Computing Engine (ACE) and proposed the famous Turing test for machine intelligence.</p>
    `,
    isOfflineFallback: true,
    fetchedAt: Date.now(),
  },
];

function findOfflineFallback(page: string): WikiArticle | null {
  const clean = page.toLowerCase().replace(/_/g, ' ').trim();
  const aliasMap: Record<string, string> = {
    'bliss (image)': 'bliss (photograph)',
    'bliss': 'bliss (photograph)',
    'aqua': 'aqua (user interface)',
    'mac os x': 'macos',
    'os x': 'macos',
  };
  const target = aliasMap[clean] || clean;
  return (
    OFFLINE_FALLBACK_ARTICLES.find(
      (a) =>
        a.title.toLowerCase() === target ||
        a.pageTitle.toLowerCase().replace(/_/g, ' ') === target
    ) || null
  );
}

function searchOfflineFallbacks(query: string, site: WikiSite, lang: string): WikiSearchResult[] {
  const q = query.toLowerCase().trim();
  const matches = OFFLINE_FALLBACK_ARTICLES.filter(
    (a) => a.title.toLowerCase().includes(q) || a.extract.toLowerCase().includes(q)
  );
  const list = matches.length > 0 ? matches : OFFLINE_FALLBACK_ARTICLES;
  return list.map((a) => ({
    title: a.title,
    description: a.description || a.extract.slice(0, 140),
    url: a.url,
    site,
    lang,
  }));
}
