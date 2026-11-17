export interface DocumentStats {
  words: number;
  chars: number;
  lines: number;
  readingTimeLabel: string;
}

export function computeDocumentStats(text: string): DocumentStats {
  const normalized = text.replace(/\r\n/g, '\n');
  const trimmed = normalized.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = normalized.length;
  const lines = normalized === '' ? 1 : normalized.split('\n').length;
  const minutes = Math.ceil(words / 200);
  const readingTimeLabel =
    words === 0 ? '0 min read' : words < 120 ? '< 1 min read' : `${minutes} min read`;

  return { words, chars, lines, readingTimeLabel };
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeColorValue(val: string): string | null {
  const trimmed = val.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-zA-Z]{3,20}$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Restore only our own safe inline tags (<u> and <span style="color|background-color">)
 * after HTML-escaping user text.
 */
function parseInlineMarkdown(raw: string): string {
  // Extract safe inline HTML tags before escaping
  const placeholders: string[] = [];
  const token = (html: string) => {
    const idx = placeholders.length;
    placeholders.push(html);
    return `\u0000WLTAG${idx}\u0000`;
  };

  let working = raw
    .replace(/<u>([\s\S]*?)<\/u>/gi, (_m, inner: string) =>
      token(`<u>${parseInlineMarkdown(inner)}</u>`)
    )
    .replace(
      /<span\s+style="([^"]*)"\s*>([\s\S]*?)<\/span>/gi,
      (_m, styleAttr: string, inner: string) => {
        const safeParts: string[] = [];
        for (const decl of styleAttr.split(';')) {
          const [prop, val] = decl.split(':');
          if (!prop || !val) continue;
          const p = prop.trim().toLowerCase();
          if (p === 'color' || p === 'background-color') {
            const safeVal = sanitizeColorValue(val);
            if (safeVal) safeParts.push(`${p}:${safeVal}`);
          }
        }
        const innerHtml = parseInlineMarkdown(inner);
        if (safeParts.length === 0) return token(innerHtml);
        return token(`<span style="${safeParts.join(';')}">${innerHtml}</span>`);
      }
    );

  working = escapeHtml(working);

  // Inline code
  working = working.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  working = working.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  working = working.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  // Strikethrough
  working = working.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');
  // Italic
  working = working.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

  // Re-insert safe tag tokens
  working = working.replace(/\u0000WLTAG(\d+)\u0000/g, (_m, idxStr: string) => {
    return placeholders[Number(idxStr)] ?? '';
  });

  return working;
}

export function markdownToHtml(markdown: string): string {
  const normalized = (markdown ?? '').replace(/\r\n/g, '\n');
  if (!normalized.trim()) {
    return '<p><br></p>';
  }

  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Aligned div block saved from WordLeaf
    const alignMatch = line.match(
      /^<div\s+style="text-align:(left|center|right|justify)">([\s\S]*)<\/div>$/i
    );
    if (alignMatch) {
      const align = alignMatch[1].toLowerCase();
      const inner = parseInlineMarkdown(alignMatch[2]);
      blocks.push(`<div style="text-align:${align}">${inner || '<br>'}</div>`);
      i += 1;
      continue;
    }

    // Horizontal rule (exact --- or ***)
    if (/^\s*(?:-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push('<hr />');
      i += 1;
      continue;
    }

    // Headings
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      blocks.push(`<h3>${parseInlineMarkdown(h3[1]) || '<br>'}</h3>`);
      i += 1;
      continue;
    }
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      blocks.push(`<h2>${parseInlineMarkdown(h2[1]) || '<br>'}</h2>`);
      i += 1;
      continue;
    }
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1) {
      blocks.push(`<h1>${parseInlineMarkdown(h1[1]) || '<br>'}</h1>`);
      i += 1;
      continue;
    }

    // Blockquote
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      blocks.push(`<blockquote>${parseInlineMarkdown(quote[1]) || '<br>'}</blockquote>`);
      i += 1;
      continue;
    }

    // Checklist item
    const check = line.match(/^-\s+\[([ xX])\]\s*(.*)$/);
    if (check) {
      const checked = check[1].toLowerCase() === 'x';
      const inner = parseInlineMarkdown(check[2]);
      blocks.push(
        `<div class="wl-check-item${checked ? ' is-checked' : ''}" data-wl-check="${
          checked ? 'true' : 'false'
        }"><span class="wl-checkbox" contenteditable="false" role="checkbox" aria-checked="${
          checked ? 'true' : 'false'
        }"></span><span class="wl-check-text">${inner || '&nbsp;'}</span></div>`
      );
      i += 1;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line) && !/^-\s+\[[ xX]\]/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i]) && !/^-\s+\[[ xX]\]/.test(lines[i])) {
        const text = lines[i].replace(/^[-*]\s+/, '');
        items.push(`<li>${parseInlineMarkdown(text) || '<br>'}</li>`);
        i += 1;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s+/, '');
        items.push(`<li>${parseInlineMarkdown(text) || '<br>'}</li>`);
        i += 1;
      }
      blocks.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      blocks.push('<p><br></p>');
      i += 1;
      continue;
    }

    // Plain paragraph line
    blocks.push(`<p>${parseInlineMarkdown(line)}</p>`);
    i += 1;
  }

  return blocks.join('');
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').replace(/\u00a0/g, ' ');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (tag === 'br') return '';
  if (el.classList.contains('wl-checkbox')) return '';

  const childrenText = Array.from(el.childNodes).map(serializeInline).join('');

  if (tag === 'strong' || tag === 'b') {
    return childrenText ? `**${childrenText}**` : '';
  }
  if (tag === 'em' || tag === 'i') {
    return childrenText ? `*${childrenText}*` : '';
  }
  if (tag === 's' || tag === 'del' || tag === 'strike') {
    return childrenText ? `~~${childrenText}~~` : '';
  }
  if (tag === 'code') {
    return childrenText ? `\`${childrenText}\`` : '';
  }
  if (tag === 'u') {
    return childrenText ? `<u>${childrenText}</u>` : '';
  }

  if (tag === 'font') {
    const color = el.getAttribute('color');
    if (color && childrenText) {
      return `<span style="color:${color}">${childrenText}</span>`;
    }
    return childrenText;
  }

  if (tag === 'span') {
    if (el.classList.contains('wl-check-text')) {
      return childrenText;
    }
    const color = el.style.color;
    const bg = el.style.backgroundColor;
    const styles: string[] = [];
    if (color) styles.push(`color:${color}`);
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
      styles.push(`background-color:${bg}`);
    }
    if (styles.length > 0 && childrenText) {
      return `<span style="${styles.join(';')}">${childrenText}</span>`;
    }
    return childrenText;
  }

  return childrenText;
}

export function htmlToMarkdown(root: HTMLElement): string {
  const outLines: string[] = [];

  const pushBlock = (el: HTMLElement) => {
    const tag = el.tagName.toLowerCase();

    if (el.classList.contains('wl-check-item') || el.hasAttribute('data-wl-check')) {
      const checked = el.getAttribute('data-wl-check') === 'true' || el.classList.contains('is-checked');
      const textNode = el.querySelector('.wl-check-text');
      const text = textNode ? serializeInline(textNode).trim() : serializeInline(el).trim();
      outLines.push(`- [${checked ? 'x' : ' '}] ${text}`);
      return;
    }

    if (tag === 'hr') {
      outLines.push('---');
      return;
    }

    if (tag === 'h1') {
      outLines.push(`# ${serializeInline(el).trim()}`);
      return;
    }
    if (tag === 'h2') {
      outLines.push(`## ${serializeInline(el).trim()}`);
      return;
    }
    if (tag === 'h3') {
      outLines.push(`### ${serializeInline(el).trim()}`);
      return;
    }
    if (tag === 'blockquote') {
      const text = serializeInline(el).trim();
      outLines.push(`> ${text}`);
      return;
    }
    if (tag === 'ul') {
      for (const li of Array.from(el.children)) {
        if (li.tagName.toLowerCase() === 'li') {
          outLines.push(`- ${serializeInline(li).trim()}`);
        }
      }
      return;
    }
    if (tag === 'ol') {
      let idx = 1;
      for (const li of Array.from(el.children)) {
        if (li.tagName.toLowerCase() === 'li') {
          outLines.push(`${idx}. ${serializeInline(li).trim()}`);
          idx += 1;
        }
      }
      return;
    }

    const align = el.style?.textAlign;
    const content = serializeInline(el);
    if (align === 'center' || align === 'right' || align === 'justify') {
      outLines.push(`<div style="text-align:${align}">${content}</div>`);
      return;
    }

    outLines.push(content);
  };

  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent ?? '').replace(/\u00a0/g, ' ');
      if (text !== '') outLines.push(text);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (
        tag === 'p' ||
        tag === 'div' ||
        tag === 'h1' ||
        tag === 'h2' ||
        tag === 'h3' ||
        tag === 'blockquote' ||
        tag === 'ul' ||
        tag === 'ol' ||
        tag === 'hr'
      ) {
        pushBlock(el);
      } else {
        outLines.push(serializeInline(el));
      }
    }
  }

  // Collapse trailing empty newline artifact from contentEditable
  while (outLines.length > 1 && outLines[outLines.length - 1] === '' && outLines[outLines.length - 2] === '') {
    outLines.pop();
  }

  return outLines.join('\n');
}
