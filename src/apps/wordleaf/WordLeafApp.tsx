import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MenuGroup, OSAppProps, VFSNode } from '../../core/types';
import { useOS } from '../../core/osStore';
import { FileTypeIcon, UIGlyph } from '../../art';
import { computeDocumentStats, htmlToMarkdown, markdownToHtml } from './markdownCodec';
import './wordleaf.css';

type FontKey = 'helvetica' | 'lucida' | 'georgia' | 'trebuchet' | 'mono';
type StyleKey = 'title' | 'heading' | 'subheading' | 'body' | 'quote' | 'code';
type EditorMode = 'rich' | 'markdown' | 'split';
type DocExt = 'md' | 'txt';
type SaveFolder = 'documents' | 'desktop';

const FONT_OPTIONS: { key: FontKey; label: string; stack: string }[] = [
  {
    key: 'helvetica',
    label: 'Helvetica Neue',
    stack: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  {
    key: 'lucida',
    label: 'Lucida Grande',
    stack: '"Lucida Grande", "Lucida Sans Unicode", Tahoma, sans-serif',
  },
  {
    key: 'georgia',
    label: 'Georgia',
    stack: 'Georgia, "Times New Roman", serif',
  },
  {
    key: 'trebuchet',
    label: 'Trebuchet MS',
    stack: '"Trebuchet MS", Tahoma, sans-serif',
  },
  {
    key: 'mono',
    label: 'SF Mono',
    stack: '"SF Mono", Monaco, Menlo, Consolas, monospace',
  },
];

const STYLE_OPTIONS: { key: StyleKey; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'heading', label: 'Heading' },
  { key: 'subheading', label: 'Subheading' },
  { key: 'body', label: 'Body' },
  { key: 'quote', label: 'Quote' },
  { key: 'code', label: 'Code' },
];

const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 24, 32];
const ZOOM_LEVELS = [75, 90, 100, 125, 150];

// 6x4 classic ink palette (24 swatches)
const INK_GRID = [
  '#111111', '#3A3A3A', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#8B1E1E', '#C83A1E', '#D97706', '#24721F', '#1556C8', '#5B2C8D',
  '#B83232', '#E2502C', '#F5A43B', '#3C9A35', '#2A75E8', '#7B42BC',
  '#E07A7A', '#F09D7C', '#F8CC74', '#7BD15E', '#6AAAF7', '#B28CE2',
];

// 6x2 pastel highlight palette (including clear)
const HIGHLIGHT_GRID = [
  'transparent', '#FFF7A8', '#D7F9DB', '#D6EBFF', '#FFE0EE', '#EAE0FF',
  '#FFE6A7', '#FDE2C8', '#C6F2EC', '#E2E8F0', '#F5D0FE', '#E4E4E7',
];

const SAMPLE_DOCUMENT = `# Morning Dispatch from Halcyon Valley

Written in **WordLeaf** — combining *Windows XP WordPad* clarity with *Mac OS X Pages* restraint.

## Today's Priorities
- [x] Boot into Halcyon
- [ ] Draft project notes and save to *My Documents*
- [ ] Read an article in **Safari Explorer**

> "Good software feels like ink on a clean sheet of paper."`;

function stripDocExtension(name: string): { base: string; ext: DocExt } {
  if (/\.txt$/i.test(name)) {
    return { base: name.replace(/\.txt$/i, ''), ext: 'txt' };
  }
  return { base: name.replace(/\.md$/i, ''), ext: 'md' };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function ptToPx(pt: number): number {
  return Math.round((pt * 4) / 3);
}

export const WordLeafApp: React.FC<OSAppProps> = ({
  isFocused,
  payload,
  setWindowTitle,
  setAppMenus,
}) => {
  const { vfs, playSound, notify } = useOS();

  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<SaveFolder>('documents');
  const [docTitle, setDocTitle] = useState<string>('Untitled');
  const [fileExt, setFileExt] = useState<DocExt>('md');
  const [markdownText, setMarkdownText] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const [styleKey, setStyleKey] = useState<StyleKey>('body');
  const [fontKey, setFontKey] = useState<FontKey>('helvetica');
  const [fontSizePt, setFontSizePt] = useState<number>(12);
  const [editorMode, setEditorMode] = useState<EditorMode>('rich');
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [leftMarginPx, setLeftMarginPx] = useState<number>(96);
  const [rightMarginPx, setRightMarginPx] = useState<number>(96);
  const [zoomPct, setZoomPct] = useState<number>(100);
  const [isNarrow, setIsNarrow] = useState<boolean>(false);

  const [activeInk, setActiveInk] = useState<string>('#111111');
  const [activeHighlight, setActiveHighlight] = useState<string>('transparent');
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    block: 'p',
    align: 'left' as 'left' | 'center' | 'right' | 'justify',
  });

  // Popover menus
  const [openPopover, setOpenPopover] = useState<
    'style' | 'font' | 'size' | 'ink' | 'highlight' | 'zoom' | null
  >(null);

  // Dialog sheets
  const [openModalVisible, setOpenModalVisible] = useState<boolean>(false);
  const [openFolderFilter, setOpenFolderFilter] = useState<'all' | 'documents' | 'desktop'>('all');
  const [openSearch, setOpenSearch] = useState<string>('');
  const [selectedOpenNodeId, setSelectedOpenNodeId] = useState<string | null>(null);

  const [saveAsModalVisible, setSaveAsModalVisible] = useState<boolean>(false);
  const [saveAsName, setSaveAsName] = useState<string>('Untitled');
  const [saveAsFolder, setSaveAsFolder] = useState<SaveFolder>('documents');
  const [saveAsExt, setSaveAsExt] = useState<DocExt>('md');

  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const toolbarLeftRef = useRef<HTMLDivElement>(null);
  const toolbarRightRef = useRef<HTMLDivElement>(null);
  const singleRowNeededWidthRef = useRef<number>(880);
  const isNarrowRef = useRef<boolean>(false);
  isNarrowRef.current = isNarrow;

  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rulerTrackRef = useRef<HTMLDivElement>(null);
  const loadedFileIdRef = useRef<string | undefined>(undefined);
  const setAppMenusRef = useRef(setAppMenus);
  setAppMenusRef.current = setAppMenus;

  // Responsive overflow check: drop formatting group to 28px format bar whenever single row overflows
  useEffect(() => {
    const tb = toolbarRef.current;
    if (!tb || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const left = toolbarLeftRef.current;
      const right = toolbarRightRef.current;
      if (!tb || !left || !right) return;
      const available = tb.clientWidth;
      if (!isNarrowRef.current) {
        const needed = left.scrollWidth + right.scrollWidth + 24;
        singleRowNeededWidthRef.current = needed;
        if (available < needed) {
          setIsNarrow(true);
        }
      } else if (available >= singleRowNeededWidthRef.current + 12) {
        setIsNarrow(false);
      }
    };

    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(tb);
    return () => obs.disconnect();
  }, []);

  // Close popovers on outside pointerdown
  useEffect(() => {
    if (!openPopover) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.wl-popover-anchor')) return;
      setOpenPopover(null);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [openPopover]);

  const loadVfsNode = useCallback((node: VFSNode) => {
    const { base, ext } = stripDocExtension(node.name);
    const content = node.content ?? '';
    setCurrentFileId(node.id);
    setCurrentFolderId(node.parentId === 'desktop' ? 'desktop' : 'documents');
    setDocTitle(base);
    setFileExt(ext);
    setMarkdownText(content);
    setIsDirty(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(content);
    }
  }, []);

  useEffect(() => {
    if (payload?.fileId && payload.fileId !== loadedFileIdRef.current) {
      const node = vfs.getNode(payload.fileId);
      if (node && node.type === 'file') {
        loadedFileIdRef.current = payload.fileId;
        loadVfsNode(node);
      }
    }
  }, [payload?.fileId, vfs, loadVfsNode]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = markdownToHtml(markdownText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Window title: "filename.md — WordLeaf" (+ " — Edited" when dirty)
  useEffect(() => {
    const cleanBase = docTitle.trim() || 'Untitled';
    const fullName = `${cleanBase}.${fileExt}`;
    setWindowTitle(`${fullName} — WordLeaf${isDirty ? ' — Edited' : ''}`);
  }, [docTitle, fileExt, isDirty, setWindowTitle]);

  const syncFromRichDom = useCallback(() => {
    if (!editorRef.current) return;
    const nextMd = htmlToMarkdown(editorRef.current);
    setMarkdownText(nextMd);
    setIsDirty(true);
  }, []);

  const refreshSelectionFormatState = useCallback(() => {
    if (editorMode !== 'rich' || !editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const anchor = sel.anchorNode;
    if (!anchor || !editorRef.current.contains(anchor)) return;

    const rawBlock = (document.queryCommandValue('formatBlock') || 'p')
      .toLowerCase()
      .replace(/[<>]/g, '');
    const alignCenter = document.queryCommandState('justifyCenter');
    const alignRight = document.queryCommandState('justifyRight');
    const alignFull = document.queryCommandState('justifyFull');

    if (rawBlock === 'h1') setStyleKey('title');
    else if (rawBlock === 'h2') setStyleKey('heading');
    else if (rawBlock === 'h3') setStyleKey('subheading');
    else if (rawBlock === 'blockquote') setStyleKey('quote');
    else if (rawBlock === 'pre') setStyleKey('code');
    else setStyleKey('body');

    setFormatState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strike: document.queryCommandState('strikeThrough'),
      block: rawBlock,
      align: alignCenter ? 'center' : alignRight ? 'right' : alignFull ? 'justify' : 'left',
    });
  }, [editorMode]);

  useEffect(() => {
    const handler = () => refreshSelectionFormatState();
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [refreshSelectionFormatState]);

  const handleModeSwitch = useCallback(
    (nextMode: EditorMode) => {
      if (nextMode === editorMode) return;
      playSound('click');
      let latestMd = markdownText;
      if (editorMode === 'rich' && editorRef.current) {
        latestMd = htmlToMarkdown(editorRef.current);
        setMarkdownText(latestMd);
      }
      setEditorMode(nextMode);
      if (nextMode === 'rich') {
        requestAnimationFrame(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = markdownToHtml(latestMd);
          }
        });
      }
    },
    [editorMode, markdownText, playSound]
  );

  const getLatestMarkdown = useCallback((): string => {
    if (editorMode === 'rich' && editorRef.current) {
      return htmlToMarkdown(editorRef.current);
    }
    return markdownText;
  }, [editorMode, markdownText]);

  const deduplicateFileName = useCallback(
    (folderId: SaveFolder, baseName: string, ext: DocExt): string => {
      const existing = new Set(vfs.getChildren(folderId).map((n) => n.name.toLowerCase()));
      const candidate = `${baseName}.${ext}`;
      if (!existing.has(candidate.toLowerCase())) return baseName;
      let n = 2;
      while (existing.has(`${baseName} ${n}.${ext}`.toLowerCase())) {
        n += 1;
      }
      return `${baseName} ${n}`;
    },
    [vfs]
  );

  const handleNewDocument = useCallback(() => {
    playSound('click');
    loadedFileIdRef.current = undefined;
    setCurrentFileId(null);
    setCurrentFolderId('documents');
    setDocTitle('Untitled');
    setFileExt('md');
    setMarkdownText('');
    setIsDirty(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = '<p><br></p>';
      editorRef.current.focus();
    }
  }, [playSound]);

  const handleSave = useCallback(() => {
    const latestContent = getLatestMarkdown();
    setMarkdownText(latestContent);
    const cleanBase = docTitle.trim().replace(/\.(md|txt)$/i, '') || 'Untitled';

    const existingNode = currentFileId ? vfs.getNode(currentFileId) : undefined;
    if (existingNode) {
      const targetName = `${cleanBase}.${fileExt}`;
      vfs.updateFile(existingNode.id, latestContent, targetName);
      setDocTitle(cleanBase);
      setIsDirty(false);
      playSound('click');
      return;
    }

    const finalBase = deduplicateFileName(currentFolderId, cleanBase, fileExt);
    const created = vfs.createFile(currentFolderId, finalBase, fileExt, latestContent);
    loadedFileIdRef.current = created.id;
    setCurrentFileId(created.id);
    setDocTitle(finalBase);
    setIsDirty(false);
    playSound('click');
    notify({
      title: 'Document Saved',
      message: `Saved "${created.name}" to ${
        currentFolderId === 'desktop' ? 'Desktop' : 'My Documents'
      }.`,
      icon: 'wordleaf',
    });
  }, [
    currentFileId,
    currentFolderId,
    deduplicateFileName,
    docTitle,
    fileExt,
    getLatestMarkdown,
    notify,
    playSound,
    vfs,
  ]);

  const openSaveAsModal = useCallback(() => {
    playSound('click');
    setSaveAsName(docTitle.trim() || 'Untitled');
    setSaveAsFolder(currentFolderId);
    setSaveAsExt(fileExt);
    setSaveAsModalVisible(true);
  }, [currentFolderId, docTitle, fileExt, playSound]);

  const handleConfirmSaveAs = useCallback(() => {
    const latestContent = getLatestMarkdown();
    setMarkdownText(latestContent);
    const cleanBase = saveAsName.trim().replace(/\.(md|txt)$/i, '') || 'Untitled';
    const created = vfs.createFile(saveAsFolder, cleanBase, saveAsExt, latestContent);
    loadedFileIdRef.current = created.id;
    setCurrentFileId(created.id);
    setCurrentFolderId(saveAsFolder);
    setDocTitle(cleanBase);
    setFileExt(saveAsExt);
    setIsDirty(false);
    setSaveAsModalVisible(false);
    playSound('click');
    notify({
      title: 'Document Saved',
      message: `Saved "${created.name}" to ${
        saveAsFolder === 'desktop' ? 'Desktop' : 'My Documents'
      }.`,
      icon: 'wordleaf',
    });
  }, [getLatestMarkdown, notify, playSound, saveAsExt, saveAsFolder, saveAsName, vfs]);

  const handleDownloadToHost = useCallback(() => {
    const latestContent = getLatestMarkdown();
    const cleanBase = docTitle.trim() || 'Untitled';
    const blob = new Blob([latestContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanBase}.${fileExt}`;
    a.click();
    URL.revokeObjectURL(url);
    playSound('click');
  }, [docTitle, fileExt, getLatestMarkdown, playSound]);

  const handlePrint = useCallback(() => {
    playSound('click');
    window.print();
  }, [playSound]);

  const handleInsertSample = useCallback(() => {
    playSound('click');
    setMarkdownText(SAMPLE_DOCUMENT);
    if (editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(SAMPLE_DOCUMENT);
    }
    setIsDirty(true);
    if (!currentFileId && docTitle === 'Untitled') {
      setDocTitle('Halcyon Dispatch');
    }
  }, [currentFileId, docTitle, playSound]);

  const handleClearDocument = useCallback(() => {
    playSound('click');
    setMarkdownText('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '<p><br></p>';
      editorRef.current.focus();
    }
    setIsDirty(true);
  }, [playSound]);

  // Formatting helpers
  const wrapMarkdownSelection = useCallback((prefix: string, suffix = '', linePrefix = false) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    let nextVal = val;
    let nextStart = start;
    let nextEnd = end;

    if (linePrefix) {
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      nextVal = val.slice(0, lineStart) + prefix + val.slice(lineStart);
      nextStart = start + prefix.length;
      nextEnd = end + prefix.length;
    } else {
      const selected = val.slice(start, end) || 'text';
      nextVal = val.slice(0, start) + prefix + selected + suffix + val.slice(end);
      nextStart = start + prefix.length;
      nextEnd = start + prefix.length + selected.length;
    }

    setMarkdownText(nextVal);
    setIsDirty(true);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(nextStart, nextEnd);
    });
  }, []);

  const execRichCommand = useCallback(
    (cmd: string, value?: string) => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      document.execCommand(cmd, false, value);
      syncFromRichDom();
      refreshSelectionFormatState();
    },
    [refreshSelectionFormatState, syncFromRichDom]
  );

  const applyStyle = useCallback(
    (next: StyleKey) => {
      playSound('click');
      setStyleKey(next);
      setOpenPopover(null);
      if (editorMode !== 'rich') {
        if (next === 'title') wrapMarkdownSelection('# ', '', true);
        else if (next === 'heading') wrapMarkdownSelection('## ', '', true);
        else if (next === 'subheading') wrapMarkdownSelection('### ', '', true);
        else if (next === 'quote') wrapMarkdownSelection('> ', '', true);
        else if (next === 'code') wrapMarkdownSelection('`', '`');
        return;
      }

      if (next === 'title') execRichCommand('formatBlock', 'H1');
      else if (next === 'heading') execRichCommand('formatBlock', 'H2');
      else if (next === 'subheading') execRichCommand('formatBlock', 'H3');
      else if (next === 'quote') execRichCommand('formatBlock', 'BLOCKQUOTE');
      else if (next === 'code') {
        if (editorRef.current) {
          editorRef.current.focus();
          const sel = window.getSelection()?.toString() || 'code';
          document.execCommand('insertHTML', false, `<code>${sel}</code>`);
          syncFromRichDom();
        }
      } else {
        execRichCommand('formatBlock', 'P');
      }
    },
    [editorMode, execRichCommand, playSound, syncFromRichDom, wrapMarkdownSelection]
  );

  const applyFormat = useCallback(
    (
      action:
        | 'bold'
        | 'italic'
        | 'underline'
        | 'strike'
        | 'bullet'
        | 'number'
        | 'checklist'
        | 'align-left'
        | 'align-center'
        | 'align-right'
        | 'align-justify'
    ) => {
      playSound('click');
      if (editorMode !== 'rich') {
        switch (action) {
          case 'bold':
            wrapMarkdownSelection('**', '**');
            break;
          case 'italic':
            wrapMarkdownSelection('*', '*');
            break;
          case 'underline':
            wrapMarkdownSelection('<u>', '</u>');
            break;
          case 'strike':
            wrapMarkdownSelection('~~', '~~');
            break;
          case 'bullet':
            wrapMarkdownSelection('- ', '', true);
            break;
          case 'number':
            wrapMarkdownSelection('1. ', '', true);
            break;
          case 'checklist':
            wrapMarkdownSelection('- [ ] ', '', true);
            break;
          default:
            break;
        }
        return;
      }

      switch (action) {
        case 'bold':
          execRichCommand('bold');
          break;
        case 'italic':
          execRichCommand('italic');
          break;
        case 'underline':
          execRichCommand('underline');
          break;
        case 'strike':
          execRichCommand('strikeThrough');
          break;
        case 'bullet':
          execRichCommand('insertUnorderedList');
          break;
        case 'number':
          execRichCommand('insertOrderedList');
          break;
        case 'checklist':
          if (editorRef.current) {
            editorRef.current.focus();
            const html =
              '<div class="wl-check-item" data-wl-check="false"><span class="wl-checkbox" contenteditable="false" role="checkbox" aria-checked="false"></span><span class="wl-check-text">New task</span></div>';
            document.execCommand('insertHTML', false, html);
            syncFromRichDom();
          }
          break;
        case 'align-left':
          execRichCommand('justifyLeft');
          break;
        case 'align-center':
          execRichCommand('justifyCenter');
          break;
        case 'align-right':
          execRichCommand('justifyRight');
          break;
        case 'align-justify':
          execRichCommand('justifyFull');
          break;
      }
    },
    [editorMode, execRichCommand, playSound, syncFromRichDom, wrapMarkdownSelection]
  );

  const applyInkColor = useCallback(
    (color: string) => {
      playSound('click');
      setActiveInk(color);
      setOpenPopover(null);
      if (editorMode === 'rich') {
        execRichCommand('foreColor', color);
      } else {
        wrapMarkdownSelection(`<span style="color:${color}">`, '</span>');
      }
    },
    [editorMode, execRichCommand, playSound, wrapMarkdownSelection]
  );

  const applyHighlightColor = useCallback(
    (color: string) => {
      playSound('click');
      setActiveHighlight(color);
      setOpenPopover(null);
      if (editorMode === 'rich') {
        execRichCommand('hiliteColor', color === 'transparent' ? 'transparent' : color);
      } else if (color !== 'transparent') {
        wrapMarkdownSelection(`<span style="background-color:${color}">`, '</span>');
      }
    },
    [editorMode, execRichCommand, playSound, wrapMarkdownSelection]
  );

  const handleInsertDateTime = useCallback(() => {
    playSound('click');
    const stamp = new Date().toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    if (editorMode === 'rich' && editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, stamp);
      syncFromRichDom();
    } else {
      wrapMarkdownSelection(stamp, '');
    }
  }, [editorMode, playSound, syncFromRichDom, wrapMarkdownSelection]);

  const handleSelectAll = useCallback(() => {
    if (editorMode === 'rich' && editorRef.current) {
      editorRef.current.focus();
      document.execCommand('selectAll');
    } else if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editorMode]);

  // Drag ruler triangle margin markers
  const startMarginDrag = useCallback((side: 'left' | 'right', e: React.PointerEvent) => {
    e.preventDefault();
    const track = rulerTrackRef.current;
    if (!track) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const updateFromClientX = (clientX: number) => {
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio =
        side === 'left'
          ? (clientX - rect.left) / rect.width
          : (rect.right - clientX) / rect.width;
      const px = Math.round(Math.max(24, Math.min(180, ratio * 816)));
      if (side === 'left') setLeftMarginPx(px);
      else setRightMarginPx(px);
    };

    updateFromClientX(e.clientX);
    const onMove = (ev: PointerEvent) => updateFromClientX(ev.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isFocused) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        if (e.shiftKey) openSaveAsModal();
        else handleSave();
      } else if (key === 'n') {
        e.preventDefault();
        handleNewDocument();
      } else if (key === 'o') {
        e.preventDefault();
        setOpenModalVisible(true);
      } else if (key === '=' || key === '+') {
        e.preventDefault();
        setZoomPct((z) => Math.min(150, z + 25));
      } else if (key === '-') {
        e.preventDefault();
        setZoomPct((z) => Math.max(75, z - 25));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNewDocument, handleSave, isFocused, openSaveAsModal]);

  // Menu bar integration
  const menuActionsRef = useRef({
    handleNewDocument,
    openBrowser: () => setOpenModalVisible(true),
    handleSave,
    openSaveAsModal,
    handleDownloadToHost,
    handlePrint,
    handleInsertSample,
    handleSelectAll,
    handleInsertDateTime,
    handleClearDocument,
    applyFormat,
    applyStyle,
    toggleRuler: () => setShowRuler((r) => !r),
    setDocMode: () => handleModeSwitch('rich'),
    setMdMode: () => handleModeSwitch('markdown'),
    setSplitMode: () => handleModeSwitch('split'),
    zoomIn: () => setZoomPct((z) => Math.min(150, z + 25)),
    zoomOut: () => setZoomPct((z) => Math.max(75, z - 25)),
  });
  menuActionsRef.current = {
    handleNewDocument,
    openBrowser: () => setOpenModalVisible(true),
    handleSave,
    openSaveAsModal,
    handleDownloadToHost,
    handlePrint,
    handleInsertSample,
    handleSelectAll,
    handleInsertDateTime,
    handleClearDocument,
    applyFormat,
    applyStyle,
    toggleRuler: () => setShowRuler((r) => !r),
    setDocMode: () => handleModeSwitch('rich'),
    setMdMode: () => handleModeSwitch('markdown'),
    setSplitMode: () => handleModeSwitch('split'),
    zoomIn: () => setZoomPct((z) => Math.min(150, z + 25)),
    zoomOut: () => setZoomPct((z) => Math.max(75, z - 25)),
  };

  useEffect(() => {
    const menus: MenuGroup[] = [
      {
        label: 'File',
        items: [
          { label: 'New', shortcut: '⌘N', action: () => menuActionsRef.current.handleNewDocument() },
          {
            label: 'Open…',
            shortcut: '⌘O',
            dividerAfter: true,
            action: () => menuActionsRef.current.openBrowser(),
          },
          { label: 'Save', shortcut: '⌘S', action: () => menuActionsRef.current.handleSave() },
          {
            label: 'Save As…',
            shortcut: '⇧⌘S',
            dividerAfter: true,
            action: () => menuActionsRef.current.openSaveAsModal(),
          },
          {
            label: 'Export Markdown…',
            action: () => menuActionsRef.current.handleDownloadToHost(),
          },
          {
            label: 'Insert Sample Document',
            dividerAfter: true,
            action: () => menuActionsRef.current.handleInsertSample(),
          },
          { label: 'Print…', shortcut: '⌘P', action: () => menuActionsRef.current.handlePrint() },
        ],
      },
      {
        label: 'Edit',
        items: [
          { label: 'Select All', shortcut: '⌘A', action: () => menuActionsRef.current.handleSelectAll() },
          {
            label: 'Insert Date and Time',
            dividerAfter: true,
            action: () => menuActionsRef.current.handleInsertDateTime(),
          },
          { label: 'Clear Document', action: () => menuActionsRef.current.handleClearDocument() },
        ],
      },
      {
        label: 'Format',
        items: [
          { label: 'Bold', shortcut: '⌘B', action: () => menuActionsRef.current.applyFormat('bold') },
          { label: 'Italic', shortcut: '⌘I', action: () => menuActionsRef.current.applyFormat('italic') },
          {
            label: 'Underline',
            shortcut: '⌘U',
            dividerAfter: true,
            action: () => menuActionsRef.current.applyFormat('underline'),
          },
          { label: 'Title', action: () => menuActionsRef.current.applyStyle('title') },
          { label: 'Heading', action: () => menuActionsRef.current.applyStyle('heading') },
          {
            label: 'Body',
            dividerAfter: true,
            action: () => menuActionsRef.current.applyStyle('body'),
          },
          { label: 'Bulleted List', action: () => menuActionsRef.current.applyFormat('bullet') },
          { label: 'Numbered List', action: () => menuActionsRef.current.applyFormat('number') },
          { label: 'Checklist', action: () => menuActionsRef.current.applyFormat('checklist') },
        ],
      },
      {
        label: 'View',
        items: [
          {
            label: showRuler ? 'Hide Ruler' : 'Show Ruler',
            dividerAfter: true,
            action: () => menuActionsRef.current.toggleRuler(),
          },
          { label: 'Document', action: () => menuActionsRef.current.setDocMode() },
          { label: 'Markdown', action: () => menuActionsRef.current.setMdMode() },
          {
            label: 'Split View',
            dividerAfter: true,
            action: () => menuActionsRef.current.setSplitMode(),
          },
          { label: 'Zoom In', shortcut: '⌘+', action: () => menuActionsRef.current.zoomIn() },
          { label: 'Zoom Out', shortcut: '⌘-', action: () => menuActionsRef.current.zoomOut() },
        ],
      },
    ];
    setAppMenusRef.current(menus);
  }, [isFocused, showRuler]);

  const handleRichEditorClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const box = target.closest('.wl-checkbox') as HTMLElement | null;
      if (!box) return;
      e.preventDefault();
      const item = box.closest('.wl-check-item') as HTMLElement | null;
      if (!item) return;
      const currentlyChecked =
        item.getAttribute('data-wl-check') === 'true' || item.classList.contains('is-checked');
      const next = !currentlyChecked;
      item.setAttribute('data-wl-check', next ? 'true' : 'false');
      item.classList.toggle('is-checked', next);
      box.setAttribute('aria-checked', next ? 'true' : 'false');
      playSound('click');
      syncFromRichDom();
    },
    [playSound, syncFromRichDom]
  );

  const handleRichKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
        syncFromRichDom();
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        const sel = window.getSelection();
        const anchor = sel?.anchorNode;
        const el = anchor instanceof Element ? anchor : anchor?.parentElement;
        const checkItem = el?.closest('.wl-check-item') as HTMLElement | null;
        if (checkItem && editorRef.current?.contains(checkItem)) {
          e.preventDefault();
          const newPara = document.createElement('p');
          newPara.innerHTML = '<br>';
          checkItem.insertAdjacentElement('afterend', newPara);
          const range = document.createRange();
          range.setStart(newPara, 0);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
          syncFromRichDom();
        }
      }
    },
    [syncFromRichDom]
  );

  const readableVfsFiles = useMemo(() => {
    const query = openSearch.trim().toLowerCase();
    return vfs.nodes
      .filter((n) => {
        if (n.type !== 'file') return false;
        if (n.ext !== 'md' && n.ext !== 'txt') return false;
        if (n.parentId === 'trash' || n.parentId === 'system') return false;
        if (openFolderFilter === 'documents' && n.parentId !== 'documents') return false;
        if (openFolderFilter === 'desktop' && n.parentId !== 'desktop') return false;
        if (query && !n.name.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [openFolderFilter, openSearch, vfs.nodes]);

  const activeFont = FONT_OPTIONS.find((f) => f.key === fontKey) ?? FONT_OPTIONS[0];
  const activeStyle = STYLE_OPTIONS.find((s) => s.key === styleKey) ?? STYLE_OPTIONS[3];
  const stats = useMemo(() => computeDocumentStats(markdownText), [markdownText]);
  const fontSizePx = ptToPx(fontSizePt);

  const formatControls = (
    <>
      {/* Style Popup */}
      <div className="wl-popover-anchor">
        <button
          type="button"
          className="hc-popup wl-popup-btn"
          style={{ width: 92 }}
          onClick={() => setOpenPopover((p) => (p === 'style' ? null : 'style'))}
          title="Paragraph Style"
          aria-label="Paragraph Style"
        >
          <span className="wl-popup-label">{activeStyle.label}</span>
          <UIGlyph name="chevron-double" size={12} />
        </button>
        {openPopover === 'style' && (
          <div className="hc-menu wl-popup-menu">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`wl-menu-item ${styleKey === opt.key ? 'is-selected' : ''}`}
                onClick={() => applyStyle(opt.key)}
              >
                <span>{opt.label}</span>
                {styleKey === opt.key && <UIGlyph name="check" size={12} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Popup */}
      <div className="wl-popover-anchor">
        <button
          type="button"
          className="hc-popup wl-popup-btn"
          style={{ width: 120 }}
          onClick={() => setOpenPopover((p) => (p === 'font' ? null : 'font'))}
          title="Font Family"
          aria-label="Font Family"
        >
          <span className="wl-popup-label">{activeFont.label}</span>
          <UIGlyph name="chevron-double" size={12} />
        </button>
        {openPopover === 'font' && (
          <div className="hc-menu wl-popup-menu" style={{ minWidth: 150 }}>
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`wl-menu-item ${fontKey === opt.key ? 'is-selected' : ''}`}
                onClick={() => {
                  playSound('click');
                  setFontKey(opt.key);
                  setOpenPopover(null);
                }}
              >
                <span>{opt.label}</span>
                {fontKey === opt.key && <UIGlyph name="check" size={12} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Size Popup */}
      <div className="wl-popover-anchor">
        <button
          type="button"
          className="hc-popup wl-popup-btn"
          style={{ width: 52 }}
          onClick={() => setOpenPopover((p) => (p === 'size' ? null : 'size'))}
          title="Font Size"
          aria-label="Font Size"
        >
          <span className="wl-popup-label" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fontSizePt}
          </span>
          <UIGlyph name="chevron-double" size={12} />
        </button>
        {openPopover === 'size' && (
          <div className="hc-menu wl-popup-menu" style={{ minWidth: 72 }}>
            {FONT_SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                className={`wl-menu-item ${fontSizePt === sz ? 'is-selected' : ''}`}
                onClick={() => {
                  playSound('click');
                  setFontSizePt(sz);
                  setOpenPopover(null);
                }}
              >
                <span>{sz} pt</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bold / Italic / Underline / Strike */}
      <div className="hc-seg wl-seg-icons">
        <button
          type="button"
          aria-pressed={formatState.bold}
          className={formatState.bold ? 'is-active' : ''}
          onClick={() => applyFormat('bold')}
          title="Bold (⌘B)"
          aria-label="Bold"
        >
          <UIGlyph name="bold" size={14} />
        </button>
        <button
          type="button"
          aria-pressed={formatState.italic}
          className={formatState.italic ? 'is-active' : ''}
          onClick={() => applyFormat('italic')}
          title="Italic (⌘I)"
          aria-label="Italic"
        >
          <UIGlyph name="italic" size={14} />
        </button>
        <button
          type="button"
          aria-pressed={formatState.underline}
          className={formatState.underline ? 'is-active' : ''}
          onClick={() => applyFormat('underline')}
          title="Underline (⌘U)"
          aria-label="Underline"
        >
          <UIGlyph name="underline" size={14} />
        </button>
        <button
          type="button"
          aria-pressed={formatState.strike}
          className={formatState.strike ? 'is-active' : ''}
          onClick={() => applyFormat('strike')}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
          <UIGlyph name="strike" size={14} />
        </button>
      </div>

      {/* Align L / C / R / J */}
      <div className="hc-seg wl-seg-icons">
        <button
          type="button"
          aria-pressed={formatState.align === 'left'}
          className={formatState.align === 'left' ? 'is-active' : ''}
          onClick={() => applyFormat('align-left')}
          title="Align Left"
          aria-label="Align Left"
        >
          <UIGlyph name="align-left" size={14} />
        </button>
        <button
          type="button"
          aria-pressed={formatState.align === 'center'}
          className={formatState.align === 'center' ? 'is-active' : ''}
          onClick={() => applyFormat('align-center')}
          title="Align Center"
          aria-label="Align Center"
        >
          <UIGlyph name="align-center" size={14} />
        </button>
        <button
          type="button"
          aria-pressed={formatState.align === 'right'}
          className={formatState.align === 'right' ? 'is-active' : ''}
          onClick={() => applyFormat('align-right')}
          title="Align Right"
          aria-label="Align Right"
        >
          <UIGlyph name="align-right" size={14} />
        </button>
        <button
          type="button"
          aria-pressed={formatState.align === 'justify'}
          className={formatState.align === 'justify' ? 'is-active' : ''}
          onClick={() => applyFormat('align-justify')}
          title="Justify"
          aria-label="Justify"
        >
          <UIGlyph name="align-justify" size={14} />
        </button>
      </div>

      {/* Lists & Checklist */}
      <button
        type="button"
        className="hc-tool"
        onClick={() => applyFormat('bullet')}
        title="Bulleted List"
        aria-label="Bulleted List"
      >
        <UIGlyph name="list-bullet" size={16} />
      </button>
      <button
        type="button"
        className="hc-tool"
        onClick={() => applyFormat('number')}
        title="Numbered List"
        aria-label="Numbered List"
      >
        <UIGlyph name="list-number" size={16} />
      </button>
      <button
        type="button"
        className="hc-tool"
        onClick={() => applyFormat('checklist')}
        title="Insert Checklist Item"
        aria-label="Insert Checklist Item"
      >
        <UIGlyph name="check" size={15} />
      </button>

      {/* Text Colour Well */}
      <div className="wl-popover-anchor">
        <button
          type="button"
          className="hc-btn wl-color-well-btn"
          onClick={() => setOpenPopover((p) => (p === 'ink' ? null : 'ink'))}
          title="Text Colour"
          aria-label="Text Colour"
        >
          <span className="wl-color-well-chip" style={{ backgroundColor: activeInk }} />
        </button>
        {openPopover === 'ink' && (
          <div className="hc-menu wl-swatch-popover">
            <div className="wl-swatch-grid">
              {INK_GRID.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={`wl-swatch-cell ${activeInk === hex ? 'is-active' : ''}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => applyInkColor(hex)}
                  aria-label={`Ink ${hex}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Highlight Colour Well */}
      <div className="wl-popover-anchor">
        <button
          type="button"
          className="hc-btn wl-highlight-well-btn"
          onClick={() => setOpenPopover((p) => (p === 'highlight' ? null : 'highlight'))}
          title="Highlight Colour"
          aria-label="Highlight Colour"
        >
          <span style={{ fontSize: 10, fontWeight: 700, lineHeight: '11px' }}>A</span>
          <span
            className="wl-highlight-bar"
            style={{
              backgroundColor: activeHighlight === 'transparent' ? '#FFF7A8' : activeHighlight,
            }}
          />
        </button>
        {openPopover === 'highlight' && (
          <div className="hc-menu wl-swatch-popover">
            <div className="wl-swatch-grid">
              {HIGHLIGHT_GRID.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={`wl-swatch-cell ${hex === 'transparent' ? 'wl-swatch-none' : ''} ${
                    activeHighlight === hex ? 'is-active' : ''
                  }`}
                  style={hex === 'transparent' ? undefined : { backgroundColor: hex }}
                  onClick={() => applyHighlightColor(hex)}
                  aria-label={hex === 'transparent' ? 'Clear highlight' : `Highlight ${hex}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  const scaledPageWidth = Math.round((816 * zoomPct) / 100);
  const leftMarginPct = (leftMarginPx / 816) * 100;
  const rightMarginPct = (rightMarginPx / 816) * 100;

  const locationText = currentFileId
    ? `${currentFolderId === 'desktop' ? 'Desktop' : 'My Documents'} / ${
        docTitle.trim() || 'Untitled'
      }.${fileExt}`
    : 'Unsaved Draft';

  return (
    <div ref={rootRef} className="wl-root">
      {/* 34px Single-Row Toolbar Shelf */}
      <div ref={toolbarRef} className="hc-toolbar wl-toolbar">
        <div ref={toolbarLeftRef} className="wl-toolbar-left">
          <button
            type="button"
            className="hc-tool"
            onClick={handleNewDocument}
            title="New Document (⌘N)"
            aria-label="New Document"
          >
            <UIGlyph name="new-doc" size={18} />
          </button>
          <button
            type="button"
            className="hc-tool"
            onClick={() => {
              playSound('click');
              setOpenModalVisible(true);
            }}
            title="Open… (⌘O)"
            aria-label="Open Document"
          >
            <UIGlyph name="open-folder" size={18} />
          </button>
          <button
            type="button"
            className="hc-tool"
            onClick={handleSave}
            title="Save (⌘S)"
            aria-label="Save Document"
          >
            <UIGlyph name="save-disk" size={18} />
          </button>
          <button
            type="button"
            className="hc-tool"
            onClick={handlePrint}
            title="Print…"
            aria-label="Print Document"
          >
            <UIGlyph name="print" size={18} />
          </button>

          {!isNarrow && (
            <>
              <span className="hc-toolbar-sep" />
              {formatControls}
            </>
          )}
        </div>

        <div ref={toolbarRightRef} className="wl-toolbar-right">
          <div className="hc-seg" aria-label="Editor View">
            <button
              type="button"
              className={editorMode === 'rich' ? 'is-active' : ''}
              aria-pressed={editorMode === 'rich'}
              onClick={() => handleModeSwitch('rich')}
            >
              Document
            </button>
            <button
              type="button"
              className={editorMode === 'markdown' ? 'is-active' : ''}
              aria-pressed={editorMode === 'markdown'}
              onClick={() => handleModeSwitch('markdown')}
            >
              Markdown
            </button>
          </div>
        </div>
      </div>

      {/* Narrow (< 780px) Format Bar */}
      {isNarrow && <div className="wl-format-bar">{formatControls}</div>}

      {/* 22px Page Ruler */}
      {showRuler && editorMode !== 'split' && (
        <div className="wl-ruler-bar">
          <div
            ref={rulerTrackRef}
            className="wl-ruler-track"
            style={{ width: scaledPageWidth }}
          >
            <div
              className="wl-ruler-margin-shade"
              style={{ left: 0, width: `${leftMarginPct}%` }}
            />
            <div
              className="wl-ruler-margin-shade"
              style={{ right: 0, width: `${rightMarginPct}%` }}
            />

            <div className="wl-ruler-ticks">
              {Array.from({ length: 8 }).map((_, inch) => (
                <div key={inch} className="wl-ruler-inch">
                  <span className="wl-ruler-num">{inch === 0 ? '' : inch}</span>
                  <span className="wl-ruler-tick" style={{ left: '12.5%', height: 3 }} />
                  <span className="wl-ruler-tick" style={{ left: '25%', height: 4 }} />
                  <span className="wl-ruler-tick" style={{ left: '37.5%', height: 3 }} />
                  <span className="wl-ruler-tick" style={{ left: '50%', height: 5 }} />
                  <span className="wl-ruler-tick" style={{ left: '62.5%', height: 3 }} />
                  <span className="wl-ruler-tick" style={{ left: '75%', height: 4 }} />
                  <span className="wl-ruler-tick" style={{ left: '87.5%', height: 3 }} />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="wl-ruler-triangle"
              style={{ left: `${leftMarginPct}%` }}
              onPointerDown={(e) => startMarginDrag('left', e)}
              title="Left Margin"
              aria-label="Left Margin"
            >
              <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true">
                <polygon points="4.5,0.5 8.5,7.5 0.5,7.5" fill="#5A5A5A" stroke="#FFFFFF" strokeWidth="0.7" />
              </svg>
            </button>
            <button
              type="button"
              className="wl-ruler-triangle"
              style={{ left: `${100 - rightMarginPct}%` }}
              onPointerDown={(e) => startMarginDrag('right', e)}
              title="Right Margin"
              aria-label="Right Margin"
            >
              <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true">
                <polygon points="4.5,0.5 8.5,7.5 0.5,7.5" fill="#5A5A5A" stroke="#FFFFFF" strokeWidth="0.7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Desk & 8.5in Paper Sheet */}
      <div className="wl-workspace">
        {editorMode === 'split' ? (
          <div className="wl-split-container">
            <div className="wl-split-pane">
              <div className="wl-split-heading">Markdown</div>
              <textarea
                ref={textareaRef}
                className="wl-markdown-textarea"
                aria-label="Markdown Source Editor"
                value={markdownText}
                onChange={(e) => {
                  setMarkdownText(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Start typing..."
              />
            </div>
            <div className="wl-split-pane">
              <div className="wl-split-heading">Document</div>
              <div
                className="wl-editor-surface selectable-text"
                style={{ fontFamily: activeFont.stack, fontSize: `${fontSizePx}px` }}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(markdownText) }}
              />
            </div>
          </div>
        ) : (
          <div
            className="wl-page-frame"
            style={{
              width: scaledPageWidth,
              height: Math.round((1056 * zoomPct) / 100),
            }}
          >
            <div
              className="wl-page-sheet"
              style={{
                padding: `64px ${rightMarginPx}px 72px ${leftMarginPx}px`,
                transform: `scale(${zoomPct / 100})`,
                transformOrigin: 'top left',
              }}
            >
              {editorMode === 'rich' ? (
                <div
                  ref={editorRef}
                  className={`wl-editor-surface ${markdownText.trim() === '' ? 'is-empty' : ''}`}
                  data-placeholder="Start typing..."
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="WordLeaf Document Editor"
                  style={{ fontFamily: activeFont.stack, fontSize: `${fontSizePx}px` }}
                  onInput={syncFromRichDom}
                  onClick={handleRichEditorClick}
                  onKeyDown={handleRichKeyDown}
                  onKeyUp={refreshSelectionFormatState}
                  onMouseUp={refreshSelectionFormatState}
                />
              ) : (
                <textarea
                  ref={textareaRef}
                  className="wl-markdown-textarea"
                  aria-label="WordLeaf Markdown Editor"
                  style={{ fontSize: `${fontSizePx}px` }}
                  value={markdownText}
                  onChange={(e) => {
                    setMarkdownText(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Start typing..."
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 22px Sunken Etched Status Bar */}
      <div className="hc-statusbar wl-statusbar">
        <div className="wl-status-left">
          <span className="wl-status-text">Page 1 of 1</span>
          <span className="wl-status-sep" />
          <span className="wl-status-text">
            {stats.words} {stats.words === 1 ? 'word' : 'words'}
          </span>
          <span className="wl-status-sep" />
          <span className="wl-status-text">
            {stats.chars} {stats.chars === 1 ? 'character' : 'characters'}
          </span>
          <span className="wl-status-sep" />
          <span className="wl-status-text" title={locationText}>
            {locationText}
          </span>
        </div>

        <div className="wl-status-right">
          <button
            type="button"
            className="hc-btn hc-btn--sm"
            style={{ minWidth: 20, padding: '0 4px' }}
            onClick={() => setZoomPct((z) => Math.max(75, z - 25))}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <UIGlyph name="minus" size={10} />
          </button>

          <div className="wl-popover-anchor">
            <button
              type="button"
              className="hc-popup wl-popup-btn"
              style={{ height: 18, width: 58, fontSize: 11 }}
              onClick={() => setOpenPopover((p) => (p === 'zoom' ? null : 'zoom'))}
              aria-label="Zoom Level"
            >
              <span>{zoomPct}%</span>
              <UIGlyph name="chevron-double" size={10} />
            </button>
            {openPopover === 'zoom' && (
              <div className="hc-menu wl-popup-menu wl-popup-menu--right wl-popup-menu--up" style={{ minWidth: 72 }}>
                {ZOOM_LEVELS.map((z) => (
                  <button
                    key={z}
                    type="button"
                    className={`wl-menu-item ${zoomPct === z ? 'is-selected' : ''}`}
                    onClick={() => {
                      setZoomPct(z);
                      setOpenPopover(null);
                    }}
                  >
                    <span>{z}%</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="hc-btn hc-btn--sm"
            style={{ minWidth: 20, padding: '0 4px' }}
            onClick={() => setZoomPct((z) => Math.min(150, z + 25))}
            title="Zoom In"
            aria-label="Zoom In"
          >
            <UIGlyph name="plus" size={10} />
          </button>
        </div>
      </div>

      {/* Opaque Linen Open Document Sheet */}
      {openModalVisible && (
        <div className="wl-dialog-backdrop" onClick={() => setOpenModalVisible(false)}>
          <div className="wl-dialog-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="wl-dialog-head">
              <span>Open Document</span>
              <button
                type="button"
                className="hc-btn hc-btn--sm"
                style={{ minWidth: 20, padding: '0 4px' }}
                onClick={() => setOpenModalVisible(false)}
                aria-label="Close Open Dialog"
              >
                <UIGlyph name="close" size={10} />
              </button>
            </div>
            <div className="wl-dialog-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div className="hc-seg">
                  {(['all', 'documents', 'desktop'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={openFolderFilter === tab ? 'is-active' : ''}
                      aria-pressed={openFolderFilter === tab}
                      onClick={() => setOpenFolderFilter(tab)}
                    >
                      {tab === 'all' ? 'All' : tab === 'documents' ? 'My Documents' : 'Desktop'}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative', width: 170 }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'inline-flex',
                      pointerEvents: 'none',
                    }}
                  >
                    <UIGlyph name="search" size={13} />
                  </span>
                  <input
                    type="text"
                    className="hc-search"
                    value={openSearch}
                    onChange={(e) => setOpenSearch(e.target.value)}
                    placeholder="Search"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="wl-dialog-list">
                {readableVfsFiles.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)' }}>
                    No documents found.
                  </div>
                ) : (
                  readableVfsFiles.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      className={`wl-dialog-row ${
                        selectedOpenNodeId === node.id ? 'is-selected' : ''
                      }`}
                      onClick={() => setSelectedOpenNodeId(node.id)}
                      onDoubleClick={() => {
                        playSound('open');
                        loadedFileIdRef.current = node.id;
                        loadVfsNode(node);
                        setOpenModalVisible(false);
                      }}
                    >
                      <FileTypeIcon ext={node.ext} size={16} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {node.name}
                      </span>
                      <span style={{ fontSize: 11, opacity: 0.75 }}>
                        {node.parentId === 'desktop' ? 'Desktop' : 'My Documents'}
                      </span>
                      <span style={{ fontSize: 11, opacity: 0.75, fontVariantNumeric: 'tabular-nums' }}>
                        {formatBytes(node.size)}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="wl-dialog-footer">
                <button
                  type="button"
                  className="hc-btn"
                  onClick={() => setOpenModalVisible(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="hc-btn hc-btn--default"
                  disabled={!selectedOpenNodeId}
                  onClick={() => {
                    const node = selectedOpenNodeId ? vfs.getNode(selectedOpenNodeId) : undefined;
                    if (node) {
                      playSound('open');
                      loadedFileIdRef.current = node.id;
                      loadVfsNode(node);
                      setOpenModalVisible(false);
                    }
                  }}
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opaque Linen Save As Sheet */}
      {saveAsModalVisible && (
        <div className="wl-dialog-backdrop" onClick={() => setSaveAsModalVisible(false)}>
          <div
            className="wl-dialog-sheet"
            style={{ maxWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wl-dialog-head">
              <span>Save As</span>
              <button
                type="button"
                className="hc-btn hc-btn--sm"
                style={{ minWidth: 20, padding: '0 4px' }}
                onClick={() => setSaveAsModalVisible(false)}
                aria-label="Close Save As Dialog"
              >
                <UIGlyph name="close" size={10} />
              </button>
            </div>
            <div className="wl-dialog-body">
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span>Save As:</span>
                <input
                  type="text"
                  className="hc-field"
                  value={saveAsName}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  autoFocus
                />
              </label>

              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>Where:</span>
                  <select
                    className="hc-field"
                    value={saveAsFolder}
                    onChange={(e) => setSaveAsFolder(e.target.value as SaveFolder)}
                  >
                    <option value="documents">My Documents</option>
                    <option value="desktop">Desktop</option>
                  </select>
                </label>

                <label style={{ width: 130, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>Format:</span>
                  <select
                    className="hc-field"
                    value={saveAsExt}
                    onChange={(e) => setSaveAsExt(e.target.value as DocExt)}
                  >
                    <option value="md">Markdown (.md)</option>
                    <option value="txt">Plain Text (.txt)</option>
                  </select>
                </label>
              </div>

              <div className="wl-dialog-footer">
                <button
                  type="button"
                  className="hc-btn"
                  onClick={() => setSaveAsModalVisible(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="hc-btn hc-btn--default"
                  onClick={handleConfirmSaveAs}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
