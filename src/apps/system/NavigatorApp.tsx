import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { OSAppProps, VFSNode } from '../../core/types';
import { useOS } from '../../core/osStore';
import { FileTypeIcon, UIGlyph } from '../../art';

type ViewMode = 'icons' | 'list' | 'columns';
type SortKey = 'name' | 'updatedAt' | 'kind' | 'size';

const PROTECTED_ROOT_IDS = new Set([
  'desktop',
  'documents',
  'pictures',
  'music',
  'system',
  'trash',
]);

const ROOT_DISPLAY_NAMES: Record<string, string> = {
  desktop: 'Desktop',
  documents: 'My Documents',
  pictures: 'My Pictures',
  music: 'My Music',
  system: 'System Vault',
  trash: 'Trash',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getKindLabel(node: VFSNode): string {
  if (node.type === 'folder') {
    return node.id === 'trash' ? 'Trash' : 'Folder';
  }
  switch (node.ext) {
    case 'md':
      return 'Markdown Document';
    case 'txt':
      return 'Plain Text';
    case 'png':
      return 'PNG Image';
    case 'svg':
      return 'SVG Vector';
    case 'url':
      return 'Web Shortcut';
    case 'sys':
      return 'System File';
    default:
      return 'Document';
  }
}

interface TaskCardProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const TaskCard: React.FC<TaskCardProps> = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="hc-taskcard">
      <div
        role="button"
        tabIndex={0}
        className="hc-taskcard-head"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v);
        }}
      >
        <span>{title}</span>
        <span className="hc-taskcard-jewel">
          <span
            style={{
              display: 'inline-flex',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 180ms ease',
            }}
          >
            <UIGlyph name="chevron-down" size={10} tone="dark" />
          </span>
        </span>
      </div>
      <div
        style={{
          maxHeight: open ? 260 : 0,
          overflow: 'hidden',
          transition: 'max-height 180ms ease',
        }}
      >
        <div className="hc-taskcard-body">{children}</div>
      </div>
    </div>
  );
};

export const NavigatorApp: React.FC<OSAppProps> = ({
  isFocused,
  payload,
  setWindowTitle,
  setAppMenus,
}) => {
  const { vfs, openApp, playSound, notify } = useOS();

  const resolveInitialLocation = (): { folderId: string | null; selectedId: string | null } => {
    if (payload?.section) {
      if (payload.section === 'root' || payload.section === 'computer') {
        return { folderId: null, selectedId: null };
      }
      const secNode = vfs.getNode(payload.section);
      if (secNode && secNode.type === 'folder') {
        return { folderId: secNode.id, selectedId: null };
      }
    }
    if (payload?.fileId) {
      const target = vfs.getNode(payload.fileId);
      if (target) {
        if (target.type === 'folder') {
          return { folderId: target.id, selectedId: null };
        }
        return { folderId: target.parentId, selectedId: target.id };
      }
    }
    return { folderId: null, selectedId: null };
  };

  const initial = resolveInitialLocation();
  const [history, setHistory] = useState<(string | null)[]>([initial.folderId]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(initial.selectedId);
  const [viewMode, setViewMode] = useState<ViewMode>('icons');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const currentFolderId = history[historyIdx] ?? null;

  useEffect(() => {
    if (payload?.section || payload?.fileId) {
      const next = resolveInitialLocation();
      setHistory([next.folderId]);
      setHistoryIdx(0);
      setSelectedId(next.selectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload?.section, payload?.fileId]);

  const currentFolder = currentFolderId ? vfs.getNode(currentFolderId) : undefined;
  const isTrashView = currentFolderId === 'trash';

  const navigateTo = (folderId: string | null, nextSelected: string | null = null) => {
    if (folderId === currentFolderId && nextSelected === selectedId) return;
    playSound('click');
    setRenamingId(null);
    setSelectedId(nextSelected);
    setSearchQuery('');
    if (folderId === currentFolderId) return;
    const nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push(folderId);
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
  };

  const goBack = () => {
    if (historyIdx > 0) {
      playSound('click');
      setHistoryIdx((i) => i - 1);
      setSelectedId(null);
      setRenamingId(null);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      playSound('click');
      setHistoryIdx((i) => i + 1);
      setSelectedId(null);
      setRenamingId(null);
    }
  };

  const goUp = () => {
    if (currentFolderId === null) return;
    const parent = currentFolder?.parentId ?? null;
    navigateTo(parent);
  };

  useEffect(() => {
    const label =
      currentFolderId === null
        ? 'My Computer'
        : ROOT_DISPLAY_NAMES[currentFolderId] ?? currentFolder?.name ?? 'Navigator';
    setWindowTitle(label);
  }, [currentFolderId, currentFolder?.name, setWindowTitle]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const children = useMemo(() => {
    const list = vfs.getChildren(currentFolderId);
    const q = searchQuery.trim().toLowerCase();
    const filtered = q ? list.filter((n) => n.name.toLowerCase().includes(q)) : list;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name' && a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      let cmp = 0;
      switch (sortKey) {
        case 'updatedAt':
          cmp = a.updatedAt - b.updatedAt;
          break;
        case 'kind':
          cmp = getKindLabel(a).localeCompare(getKindLabel(b));
          break;
        case 'size':
          cmp = a.size - b.size;
          break;
        case 'name':
        default:
          cmp = (ROOT_DISPLAY_NAMES[a.id] ?? a.name).localeCompare(
            ROOT_DISPLAY_NAMES[b.id] ?? b.name
          );
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [vfs, currentFolderId, searchQuery, sortKey, sortAsc]);

  const trashItems = useMemo(() => vfs.getChildren('trash'), [vfs]);
  const isTrashEmpty = trashItems.length === 0;

  const selectedNode = useMemo(
    () => (selectedId ? vfs.getNode(selectedId) : undefined),
    [vfs, selectedId]
  );

  const breadcrumbs = useMemo(() => {
    const chain: { id: string | null; label: string }[] = [];
    let cursor: string | null = currentFolderId;
    const guard = new Set<string>();
    while (cursor && !guard.has(cursor)) {
      guard.add(cursor);
      const node = vfs.getNode(cursor);
      if (!node) break;
      chain.unshift({
        id: node.id,
        label: ROOT_DISPLAY_NAMES[node.id] ?? node.name,
      });
      cursor = node.parentId;
    }
    chain.unshift({ id: null, label: 'My Computer' });
    return chain;
  }, [vfs, currentFolderId]);

  const getUniqueName = (parentId: string, base: string, ext?: string) => {
    const existing = new Set(vfs.getChildren(parentId).map((n) => n.name.toLowerCase()));
    const candidate = ext ? `${base}.${ext}` : base;
    if (!existing.has(candidate.toLowerCase())) return candidate;
    let idx = 2;
    while (idx < 99) {
      const next = ext ? `${base} (${idx}).${ext}` : `${base} (${idx})`;
      if (!existing.has(next.toLowerCase())) return next;
      idx += 1;
    }
    return candidate;
  };

  const handleCreateFolder = () => {
    const targetParent = currentFolderId && !isTrashView ? currentFolderId : 'documents';
    if (targetParent !== currentFolderId) navigateTo(targetParent);
    const name = getUniqueName(targetParent, 'New Folder');
    const created = vfs.createFolder(targetParent, name);
    playSound('open');
    setSelectedId(created.id);
    setRenamingId(created.id);
    setRenameDraft(created.name);
  };

  const handleCreateTextDoc = () => {
    const targetParent = currentFolderId && !isTrashView ? currentFolderId : 'documents';
    if (targetParent !== currentFolderId) navigateTo(targetParent);
    const name = getUniqueName(targetParent, 'New Text Document', 'txt');
    const created = vfs.createFile(targetParent, name, 'txt', 'New document\n');
    playSound('open');
    setSelectedId(created.id);
    setRenamingId(created.id);
    setRenameDraft(created.name);
  };

  const startRename = (node: VFSNode) => {
    if (PROTECTED_ROOT_IDS.has(node.id)) return;
    setRenamingId(node.id);
    setRenameDraft(node.name);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const trimmed = renameDraft.trim();
    if (trimmed && !PROTECTED_ROOT_IDS.has(renamingId)) {
      vfs.renameNode(renamingId, trimmed);
      playSound('click');
    }
    setRenamingId(null);
  };

  const handleMoveToTrash = (node: VFSNode) => {
    if (PROTECTED_ROOT_IDS.has(node.id)) return;
    vfs.moveToTrash(node.id);
    playSound('trash');
    if (selectedId === node.id) setSelectedId(null);
  };

  const handleRestore = (node: VFSNode) => {
    vfs.restoreFromTrash(node.id);
    playSound('click');
    setSelectedId(null);
    notify({
      title: 'Item Restored',
      message: `"${node.name}" was restored from Trash.`,
      icon: 'navigator',
    });
  };

  const handleEmptyTrash = () => {
    if (isTrashEmpty) return;
    vfs.emptyTrash();
    playSound('trash');
    setSelectedId(null);
    notify({
      title: 'Trash Emptied',
      message: 'All trashed items have been permanently removed.',
      icon: 'info',
    });
  };

  const openNode = (node: VFSNode) => {
    if (node.type === 'folder') {
      navigateTo(node.id);
      return;
    }
    if (node.parentId === 'trash') {
      notify({
        title: 'Item in Trash',
        message: 'Restore this item before opening it.',
        icon: 'info',
      });
      playSound('error');
      return;
    }
    switch (node.ext) {
      case 'txt':
      case 'md':
        playSound('open');
        openApp('wordleaf', { fileId: node.id });
        break;
      case 'url':
        playSound('open');
        openApp('browser', { fileId: node.id, url: node.content });
        break;
      case 'png':
      case 'svg':
        playSound('open');
        openApp('paint', { fileId: node.id });
        break;
      case 'sys':
        playSound('balloon');
        notify({
          title: node.name,
          message: `System file (${formatBytes(node.size)}).`,
          icon: 'shield',
        });
        break;
      default:
        playSound('open');
        openApp('wordleaf', { fileId: node.id });
        break;
    }
  };

  useEffect(() => {
    if (!isFocused) return;
    setAppMenus([
      {
        label: 'File',
        items: [
          { label: 'New Folder', shortcut: '⇧⌘N', action: handleCreateFolder },
          { label: 'New Text Document', action: handleCreateTextDoc, dividerAfter: true },
          {
            label: 'Open',
            disabled: !selectedNode,
            action: () => selectedNode && openNode(selectedNode),
          },
          {
            label: 'Rename',
            disabled: !selectedNode || PROTECTED_ROOT_IDS.has(selectedNode.id),
            action: () => selectedNode && startRename(selectedNode),
          },
          {
            label: isTrashView ? 'Restore Item' : 'Move to Trash',
            disabled: !selectedNode || PROTECTED_ROOT_IDS.has(selectedNode.id),
            action: () =>
              selectedNode &&
              (isTrashView ? handleRestore(selectedNode) : handleMoveToTrash(selectedNode)),
          },
        ],
      },
      {
        label: 'View',
        items: [
          { label: 'Icons', action: () => setViewMode('icons') },
          { label: 'List', action: () => setViewMode('list') },
          { label: 'Columns', action: () => setViewMode('columns') },
        ],
      },
      {
        label: 'Go',
        items: [
          { label: 'My Computer', action: () => navigateTo(null) },
          { label: 'Desktop', action: () => navigateTo('desktop') },
          { label: 'My Documents', action: () => navigateTo('documents') },
          { label: 'My Pictures', action: () => navigateTo('pictures') },
          { label: 'My Music', action: () => navigateTo('music') },
          { label: 'Trash', action: () => navigateTo('trash') },
        ],
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, currentFolderId, selectedNode, isTrashView]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const totalBytes = useMemo(
    () => vfs.nodes.reduce((sum, n) => sum + (n.size || 0), 0),
    [vfs.nodes]
  );
  const availGb = Math.max(0.1, 12.4 - totalBytes / (1024 * 1024 * 1024)).toFixed(1);

  const renderNodeName = (node: VFSNode, center = false) => {
    const displayName = ROOT_DISPLAY_NAMES[node.id] ?? node.name;
    if (renamingId === node.id) {
      return (
        <input
          ref={renameInputRef}
          className="hc-field"
          value={renameDraft}
          onChange={(e) => setRenameDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setRenamingId(null);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            height: 18,
            fontSize: 11,
            textAlign: center ? 'center' : 'left',
          }}
        />
      );
    }
    return <span>{displayName}</span>;
  };

  const renderMyComputerHome = () => {
    const primaryFolders = ['desktop', 'documents', 'pictures', 'music', 'system']
      .map((id) => vfs.getNode(id))
      .filter((n): n is VFSNode => Boolean(n));
    const trashNode = vfs.getNode('trash');

    return (
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Group 1: Files Stored on This Computer */}
        <section>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text)',
              paddingBottom: 4,
              marginBottom: 8,
              borderBottom: '1px solid #B0C4DE',
            }}
          >
            Files Stored on This Computer
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {primaryFolders.map((folder) => {
              const isSelected = selectedId === folder.id;
              return (
                <div
                  key={folder.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(folder.id);
                  }}
                  onDoubleClick={() => navigateTo(folder.id)}
                  style={{
                    width: 170,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 6px',
                    cursor: 'pointer',
                  }}
                >
                  <FileTypeIcon isFolder folderId={folder.id} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '1px 4px',
                        borderRadius: 2,
                        background: isSelected ? 'var(--select)' : 'transparent',
                        color: isSelected ? '#FFFFFF' : 'var(--text)',
                        fontSize: 11,
                        fontWeight: 400,
                      }}
                    >
                      {ROOT_DISPLAY_NAMES[folder.id] ?? folder.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Group 2: Hard Disk Drives */}
        <section>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text)',
              paddingBottom: 4,
              marginBottom: 8,
              borderBottom: '1px solid #B0C4DE',
            }}
          >
            Hard Disk Drives
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(null);
              }}
              onDoubleClick={() => navigateTo('documents')}
              style={{
                width: 220,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 6px',
                cursor: 'pointer',
              }}
            >
              <FileTypeIcon isFolder folderId="system" size={36} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text)' }}>Local Disk (C:)</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                  {availGb} GB free of 12.4 GB
                </div>
              </div>
            </div>

            {trashNode && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId('trash');
                }}
                onDoubleClick={() => navigateTo('trash')}
                style={{
                  width: 180,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 6px',
                  cursor: 'pointer',
                }}
              >
                <FileTypeIcon
                  isFolder
                  folderId="trash"
                  isTrashEmpty={isTrashEmpty}
                  size={36}
                />
                <span
                  style={{
                    padding: '1px 4px',
                    borderRadius: 2,
                    background: selectedId === 'trash' ? 'var(--select)' : 'transparent',
                    color: selectedId === 'trash' ? '#FFFFFF' : 'var(--text)',
                    fontSize: 11,
                  }}
                >
                  Trash
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Group 3: Network Locations */}
        <section>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text)',
              paddingBottom: 4,
              marginBottom: 8,
              borderBottom: '1px solid #B0C4DE',
            }}
          >
            Network Locations
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <div
              onDoubleClick={() => {
                playSound('open');
                openApp('browser', { url: 'https://en.wikipedia.org/wiki/Bliss_(photograph)' });
              }}
              style={{
                width: 220,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 6px',
                cursor: 'pointer',
              }}
            >
              <FileTypeIcon ext="url" size={32} />
              <span style={{ fontSize: 11, color: 'var(--text)' }}>
                Wikipedia Encyclopedia
              </span>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderFolderContent = () => {
    if (children.length === 0) {
      return (
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-3)',
            fontSize: 12,
            gap: 4,
          }}
        >
          <span>
            {searchQuery
              ? `No items matching "${searchQuery}"`
              : isTrashView
                ? 'Trash is empty.'
                : 'This folder is empty.'}
          </span>
        </div>
      );
    }

    if (viewMode === 'icons') {
      return (
        <div
          style={{
            padding: 12,
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            gap: 8,
          }}
        >
          {children.map((node) => {
            const isSelected = selectedId === node.id;
            return (
              <div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(node.id);
                }}
                onDoubleClick={() => openNode(node)}
                style={{
                  width: 96,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 4px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    padding: 2,
                    borderRadius: 4,
                    background: isSelected ? 'rgba(56, 117, 215, 0.25)' : 'transparent',
                  }}
                >
                  <FileTypeIcon
                    ext={node.ext}
                    isFolder={node.type === 'folder'}
                    folderId={node.type === 'folder' ? node.id : undefined}
                    isTrashEmpty={node.id === 'trash' ? isTrashEmpty : undefined}
                    size={48}
                  />
                </div>
                <div
                  style={{
                    maxWidth: '100%',
                    padding: '1px 4px',
                    borderRadius: 2,
                    background: isSelected ? 'var(--select)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : 'var(--text)',
                    fontSize: 11,
                    lineHeight: '14px',
                    textAlign: 'center',
                    wordBreak: 'normal',
                    overflowWrap: 'break-word',
                  }}
                >
                  {renderNodeName(node, true)}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="hc-colhead" style={{ flexShrink: 0 }}>
            {(
              [
                { key: 'name', label: 'Name', width: '44%' },
                { key: 'updatedAt', label: 'Date Modified', width: '24%' },
                { key: 'kind', label: 'Kind', width: '18%' },
                { key: 'size', label: 'Size', width: '14%' },
              ] as const
            ).map((col) => {
              const isSorted = sortKey === col.key;
              return (
                <div
                  key={col.key}
                  className={`hc-colhead-cell${isSorted ? ' is-sorted' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => toggleSort(col.key)}
                >
                  <span>{col.label}</span>
                  {isSorted && (
                    <span
                      style={{
                        display: 'inline-flex',
                        transform: sortAsc ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <UIGlyph name="disclosure" size={8} tone="dark" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className={`hc-list${isFocused ? '' : ' is-inactive'}`}
            style={{ flex: 1, overflowY: 'auto' }}
          >
            {children.map((node) => {
              const isSelected = selectedId === node.id;
              return (
                <div
                  key={node.id}
                  className={`hc-list-row${isSelected ? ' is-selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(node.id);
                  }}
                  onDoubleClick={() => openNode(node)}
                  style={{ padding: 0, cursor: 'pointer' }}
                >
                  <div
                    style={{
                      width: '44%',
                      padding: '0 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      minWidth: 0,
                    }}
                  >
                    <FileTypeIcon
                      ext={node.ext}
                      isFolder={node.type === 'folder'}
                      folderId={node.type === 'folder' ? node.id : undefined}
                      size={16}
                    />
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {renderNodeName(node)}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '24%',
                      padding: '0 8px',
                      fontSize: 11,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatDate(node.updatedAt)}
                  </div>
                  <div
                    style={{
                      width: '18%',
                      padding: '0 8px',
                      fontSize: 11,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getKindLabel(node)}
                  </div>
                  <div
                    style={{
                      width: '14%',
                      padding: '0 8px',
                      fontSize: 11,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {node.type === 'folder' ? '--' : formatBytes(node.size)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Columns View (Finder 200px column + preview)
    return (
      <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
        <div
          className={`hc-list${isFocused ? '' : ' is-inactive'}`}
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: '1px solid #C8C8C8',
            overflowY: 'auto',
          }}
        >
          {children.map((node) => {
            const isSelected = selectedId === node.id;
            return (
              <div
                key={node.id}
                className={`hc-list-row${isSelected ? ' is-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(node.id);
                }}
                onDoubleClick={() => openNode(node)}
                style={{ justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <FileTypeIcon
                    ext={node.ext}
                    isFolder={node.type === 'folder'}
                    folderId={node.type === 'folder' ? node.id : undefined}
                    size={16}
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ROOT_DISPLAY_NAMES[node.id] ?? node.name}
                  </span>
                </div>
                {node.type === 'folder' && (
                  <UIGlyph
                    name="chevron-right"
                    size={11}
                    tone={isSelected && isFocused ? 'light' : 'dark'}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Preview Column */}
        <div
          style={{
            flex: 1,
            padding: 16,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            background: 'var(--paper)',
          }}
        >
          {selectedNode ? (
            <>
              {selectedNode.ext === 'png' && selectedNode.content?.startsWith('data:image') ? (
                <img
                  src={selectedNode.content}
                  alt={selectedNode.name}
                  style={{ maxWidth: 220, maxHeight: 150, border: '1px solid #D0D0D0' }}
                />
              ) : selectedNode.ext === 'svg' && selectedNode.content ? (
                <img
                  src={
                    selectedNode.content.startsWith('data:')
                      ? selectedNode.content
                      : `data:image/svg+xml;utf8,${encodeURIComponent(selectedNode.content)}`
                  }
                  alt={selectedNode.name}
                  style={{ maxWidth: 220, maxHeight: 150, border: '1px solid #D0D0D0' }}
                />
              ) : (
                <FileTypeIcon
                  ext={selectedNode.ext}
                  isFolder={selectedNode.type === 'folder'}
                  folderId={selectedNode.type === 'folder' ? selectedNode.id : undefined}
                  size={64}
                />
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                  {ROOT_DISPLAY_NAMES[selectedNode.id] ?? selectedNode.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
                  {getKindLabel(selectedNode)},{' '}
                  {selectedNode.type === 'folder'
                    ? `${vfs.getChildren(selectedNode.id).length} items`
                    : formatBytes(selectedNode.size)}
                </div>
              </div>
              <button
                type="button"
                className="hc-btn hc-btn--default"
                onClick={() => openNode(selectedNode)}
              >
                {selectedNode.type === 'folder' ? 'Open Folder' : 'Open'}
              </button>
            </>
          ) : (
            <div style={{ margin: 'auto', color: 'var(--text-3)', fontSize: 12 }}>
              Select an item to preview
            </div>
          )}
        </div>
      </div>
    );
  };

  const statusText = useMemo(() => {
    const count =
      currentFolderId === null
        ? 5
        : children.length;
    return `${count} ${count === 1 ? 'item' : 'items'}, ${availGb} GB available`;
  }, [availGb, children.length, currentFolderId]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--linen)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* 34px Toolbar (§9.4) */}
      <div className="hc-toolbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Round green Back/Forward XP jewels (24px) */}
          <button
            type="button"
            title="Back"
            disabled={historyIdx <= 0}
            onClick={goBack}
            style={{
              width: 24,
              height: 24,
              padding: 0,
              border: 'none',
              background: 'transparent',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: historyIdx > 0 ? 'pointer' : 'default',
            }}
          >
            <UIGlyph
              name={historyIdx > 0 ? 'orb-back' : 'orb-back-disabled'}
              size={24}
            />
          </button>

          <button
            type="button"
            title="Forward"
            disabled={historyIdx >= history.length - 1}
            onClick={goForward}
            style={{
              width: 24,
              height: 24,
              padding: 0,
              border: 'none',
              background: 'transparent',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: historyIdx < history.length - 1 ? 'pointer' : 'default',
            }}
          >
            <UIGlyph
              name={historyIdx < history.length - 1 ? 'orb-forward' : 'orb-forward-disabled'}
              size={24}
            />
          </button>

          <button
            type="button"
            title="Up"
            disabled={currentFolderId === null}
            onClick={goUp}
            className="hc-tool"
          >
            <UIGlyph name="up" size={16} tone="dark" disabled={currentFolderId === null} />
          </button>

          <span className="hc-toolbar-sep" />

          {/* View Mode Segmented Control */}
          <div className="hc-seg">
            <button
              type="button"
              title="Icons"
              className={viewMode === 'icons' ? 'is-active' : undefined}
              onClick={() => {
                playSound('click');
                setViewMode('icons');
              }}
            >
              <UIGlyph name="grid" size={14} tone="dark" />
            </button>
            <button
              type="button"
              title="List"
              className={viewMode === 'list' ? 'is-active' : undefined}
              onClick={() => {
                playSound('click');
                setViewMode('list');
              }}
            >
              <UIGlyph name="list" size={14} tone="dark" />
            </button>
            <button
              type="button"
              title="Columns"
              className={viewMode === 'columns' ? 'is-active' : undefined}
              onClick={() => {
                playSound('click');
                setViewMode('columns');
              }}
            >
              <UIGlyph name="columns" size={14} tone="dark" />
            </button>
          </div>
        </div>

        {/* Search Field (.hc-search) */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span
            style={{
              position: 'absolute',
              left: 6,
              pointerEvents: 'none',
              display: 'inline-flex',
            }}
          >
            <UIGlyph name="search" size={14} tone="dark" />
          </span>
          <input
            className="hc-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            style={{ width: 170 }}
          />
        </div>
      </div>

      {/* 24px Address Row (§9.4) */}
      <div
        style={{
          height: 26,
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--linen)',
          borderBottom: '1px solid #B8B5AA',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Address</span>
        <div
          className="hc-field"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            overflow: 'hidden',
          }}
        >
          <FileTypeIcon
            isFolder
            folderId={currentFolderId ?? 'system'}
            isTrashEmpty={currentFolderId === 'trash' ? isTrashEmpty : undefined}
            size={14}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id ?? 'root'}>
                {idx > 0 && <UIGlyph name="chevron-right" size={10} tone="dark" />}
                <button
                  type="button"
                  onClick={() => navigateTo(crumb.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '0 2px',
                    fontSize: 11.5,
                    color: 'var(--text)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="hc-btn hc-btn--sm"
          onClick={() => navigateTo(currentFolderId)}
          style={{ gap: 4 }}
        >
          <UIGlyph name="go" size={13} />
          <span>Go</span>
        </button>
      </div>

      {/* Main Split: 200px XP Task Pane + Opaque Paper Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <aside className="hc-taskpane" style={{ width: 200, flexShrink: 0 }}>
          <TaskCard title="File and Folder Tasks">
            {isTrashView ? (
              <>
                <button
                  type="button"
                  className="hc-taskcard-link"
                  disabled={!selectedNode}
                  onClick={() => selectedNode && handleRestore(selectedNode)}
                >
                  <UIGlyph name="undo" size={13} disabled={!selectedNode} />
                  <span>Restore this item</span>
                </button>
                <button
                  type="button"
                  className="hc-taskcard-link"
                  disabled={isTrashEmpty}
                  onClick={handleEmptyTrash}
                >
                  <UIGlyph name="trash" size={13} tone="dark" disabled={isTrashEmpty} />
                  <span>Empty the Trash</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="hc-taskcard-link"
                  onClick={handleCreateFolder}
                >
                  <UIGlyph name="open-folder" size={13} />
                  <span>Make a new folder</span>
                </button>
                <button
                  type="button"
                  className="hc-taskcard-link"
                  onClick={handleCreateTextDoc}
                >
                  <UIGlyph name="new-doc" size={13} />
                  <span>New text document</span>
                </button>
                <button
                  type="button"
                  className="hc-taskcard-link"
                  disabled={!selectedNode || PROTECTED_ROOT_IDS.has(selectedNode.id)}
                  onClick={() => selectedNode && startRename(selectedNode)}
                >
                  <UIGlyph
                    name="star"
                    size={12}
                    tone="dark"
                    disabled={!selectedNode || PROTECTED_ROOT_IDS.has(selectedNode.id)}
                  />
                  <span>Rename this item</span>
                </button>
                <button
                  type="button"
                  className="hc-taskcard-link"
                  disabled={!selectedNode || PROTECTED_ROOT_IDS.has(selectedNode.id)}
                  onClick={() => selectedNode && handleMoveToTrash(selectedNode)}
                >
                  <UIGlyph
                    name="trash"
                    size={12}
                    tone="dark"
                    disabled={!selectedNode || PROTECTED_ROOT_IDS.has(selectedNode.id)}
                  />
                  <span>Move to Trash</span>
                </button>
              </>
            )}
          </TaskCard>

          <TaskCard title="Other Places">
            {[
              { id: null, label: 'My Computer' },
              { id: 'desktop', label: 'Desktop' },
              { id: 'documents', label: 'My Documents' },
              { id: 'pictures', label: 'My Pictures' },
              { id: 'music', label: 'My Music' },
              { id: 'trash', label: isTrashEmpty ? 'Trash' : `Trash (${trashItems.length})` },
            ].map((place) => (
              <button
                key={place.id ?? 'root'}
                type="button"
                className="hc-taskcard-link"
                onClick={() => navigateTo(place.id)}
              >
                <FileTypeIcon
                  isFolder
                  folderId={place.id ?? 'system'}
                  isTrashEmpty={place.id === 'trash' ? isTrashEmpty : undefined}
                  size={14}
                />
                <span>{place.label}</span>
              </button>
            ))}
            <button
              type="button"
              className="hc-taskcard-link"
              onClick={() => {
                playSound('open');
                openApp('control-panel');
              }}
            >
              <UIGlyph name="control" size={13} tone="dark" />
              <span>Control Panel</span>
            </button>
          </TaskCard>

          <TaskCard title="Details">
            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileTypeIcon
                    ext={selectedNode.ext}
                    isFolder={selectedNode.type === 'folder'}
                    folderId={selectedNode.type === 'folder' ? selectedNode.id : undefined}
                    isTrashEmpty={selectedNode.id === 'trash' ? isTrashEmpty : undefined}
                    size={32}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, wordBreak: 'break-word' }}>
                      {ROOT_DISPLAY_NAMES[selectedNode.id] ?? selectedNode.name}
                    </div>
                    <div style={{ color: 'var(--text-2)' }}>{getKindLabel(selectedNode)}</div>
                  </div>
                </div>
                <div>Modified: {formatDate(selectedNode.updatedAt)}</div>
                <div>
                  Size:{' '}
                  {selectedNode.type === 'folder'
                    ? `${vfs.getChildren(selectedNode.id).length} items`
                    : formatBytes(selectedNode.size)}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text)' }}>
                <div style={{ fontWeight: 700 }}>
                  {currentFolderId === null
                    ? 'My Computer'
                    : ROOT_DISPLAY_NAMES[currentFolderId] ?? currentFolder?.name}
                </div>
                <div style={{ color: 'var(--text-2)', marginTop: 2 }}>
                  {currentFolderId === null ? 'System Folder' : `${children.length} items`}
                </div>
              </div>
            )}
          </TaskCard>
        </aside>

        <main
          onClick={() => setSelectedId(null)}
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--paper)',
          }}
        >
          {currentFolderId === null ? renderMyComputerHome() : renderFolderContent()}
        </main>
      </div>

      {/* 22px Centred Finder-Style Status Bar (§9.4) */}
      <div className="hc-statusbar" style={{ justifyContent: 'center' }}>
        {statusText}
      </div>
    </div>
  );
};
