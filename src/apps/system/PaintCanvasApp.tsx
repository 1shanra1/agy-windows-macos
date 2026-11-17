import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { OSAppProps } from '../../core/types';
import { useOS } from '../../core/osStore';
import { UIGlyph } from '../../art';

type PaintTool =
  | 'pencil'
  | 'brush'
  | 'airbrush'
  | 'fill'
  | 'line'
  | 'rect'
  | 'ellipse'
  | 'eraser';

// Classic 28-swatch MS Paint palette (2 rows x 14 cols)
const XP_PALETTE_28 = [
  '#000000', '#7F7F7F', '#880015', '#ED1C24', '#FF7F27', '#FFF200', '#22B14C',
  '#00A2E8', '#3F48CC', '#A349A4', '#004080', '#245EDB', '#008080', '#4A752C',
  '#FFFFFF', '#C3C3C3', '#B97A57', '#FFAEC9', '#FFC90E', '#EFE4B0', '#B5E61D',
  '#99D9EA', '#7092BE', '#C8BFE7', '#80BFFF', '#DCEBFE', '#A7F3D0', '#FDE68A',
];

const CANVAS_W = 640;
const CANVAS_H = 420;

function hexToRgba(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

const PaintToolGlyph: React.FC<{ tool: PaintTool }> = ({ tool }) => {
  switch (tool) {
    case 'pencil':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M10.5 1.5L12.5 3.5L4.5 11.5L2 12L2.5 9.5Z" fill="#E6B84C" stroke="#2B2B2B" strokeWidth="1" />
          <path d="M2 12L3.2 11.7L2.3 10.8Z" fill="#1D1D1F" />
        </svg>
      );
    case 'brush':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M11 2L12 3L6.5 8.5L5.5 7.5Z" fill="#7C532E" stroke="#2B2B2B" strokeWidth="0.9" />
          <path d="M5.5 7.5C3.8 8 3 9.5 2.5 11.5C4.5 11 6 10.2 6.5 8.5Z" fill="#2A75E8" stroke="#2B2B2B" strokeWidth="0.9" />
        </svg>
      );
    case 'airbrush':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <rect x="6" y="5" width="5" height="7" rx="1" fill="#C4C7CE" stroke="#2B2B2B" strokeWidth="1" />
          <rect x="7" y="3" width="3" height="2" fill="#2B2B2B" />
          <circle cx="3" cy="3" r="0.8" fill="#2B2B2B" />
          <circle cx="4.5" cy="2" r="0.8" fill="#2B2B2B" />
          <circle cx="2" cy="5" r="0.8" fill="#2B2B2B" />
          <circle cx="4" cy="4.5" r="0.8" fill="#2B2B2B" />
        </svg>
      );
    case 'fill':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M4 5L8 2L11.5 5.5L7.5 9Z" fill="#D5D8DF" stroke="#2B2B2B" strokeWidth="1" />
          <path d="M2.5 9.5C2.5 8 3.8 7 3.8 7C3.8 7 5 8 5 9.5C5 10.6 4.4 11.5 3.8 11.5C3.1 11.5 2.5 10.6 2.5 9.5Z" fill="#2A75E8" />
        </svg>
      );
    case 'line':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <line x1="2.5" y1="11.5" x2="11.5" y2="2.5" stroke="#2B2B2B" strokeWidth="1.6" />
        </svg>
      );
    case 'rect':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <rect x="2.5" y="3.5" width="9" height="7" fill="none" stroke="#2B2B2B" strokeWidth="1.3" />
        </svg>
      );
    case 'ellipse':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <ellipse cx="7" cy="7" rx="4.8" ry="3.5" fill="none" stroke="#2B2B2B" strokeWidth="1.3" />
        </svg>
      );
    case 'eraser':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M3 8.5L7.5 4L11 7.5L6.5 12H3.5Z" fill="#F4A8B8" stroke="#2B2B2B" strokeWidth="1" />
        </svg>
      );
  }
};

export const PaintCanvasApp: React.FC<OSAppProps> = ({
  isFocused,
  payload,
  setWindowTitle,
  setAppMenus,
}) => {
  const { vfs, playSound, notify } = useOS();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const snapshotRef = useRef<ImageData | null>(null);
  const isDrawingRef = useRef(false);
  const startPtRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPtRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const airbrushTimerRef = useRef<number | null>(null);

  const [tool, setTool] = useState<PaintTool>('brush');
  const [fgColor, setFgColor] = useState('#245EDB');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [strokeSize, setStrokeSize] = useState(4);
  const [fillShapes, setFillShapes] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [fileName, setFileName] = useState('Untitled');
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    undoStackRef.current = [...undoStackRef.current.slice(-19), snap];
    setCanUndo(true);
  }, []);

  const clearCanvas = useCallback(
    (recordUndo = true) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      if (recordUndo) pushUndo();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    },
    [pushUndo]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    undoStackRef.current = [];
    setCanUndo(false);

    if (!payload?.fileId) return;
    const node = vfs.getNode(payload.fileId);
    if (!node || !node.content) return;

    setFileName(node.name.replace(/\.(png|svg)$/i, ''));

    let src = '';
    if (node.ext === 'png' && node.content.startsWith('data:image')) {
      src = node.content;
    } else if (node.ext === 'svg') {
      src = node.content.startsWith('data:image')
        ? node.content
        : `data:image/svg+xml;utf8,${encodeURIComponent(node.content)}`;
    }
    if (!src) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height, 1);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (CANVAS_W - dw) / 2, (CANVAS_H - dh) / 2, dw, dh);
    };
    img.src = src;
  }, [payload?.fileId, vfs]);

  useEffect(() => {
    setWindowTitle(`${fileName}.png — LunaPaint`);
  }, [fileName, setWindowTitle]);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || undoStackRef.current.length === 0) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    ctx.putImageData(prev, 0, 0);
    setCanUndo(undoStackRef.current.length > 0);
    playSound('click');
  }, [playSound]);

  const handleSaveToPictures = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const cleanBase = fileName.trim().replace(/\.png$/i, '') || 'Untitled';
    const existing = new Set(vfs.getChildren('pictures').map((n) => n.name.toLowerCase()));
    let finalName = `${cleanBase}.png`;
    if (existing.has(finalName.toLowerCase())) {
      let idx = 2;
      while (existing.has(`${cleanBase} (${idx}).png`.toLowerCase()) && idx < 99) {
        idx += 1;
      }
      finalName = `${cleanBase} (${idx}).png`;
    }
    vfs.createFile('pictures', finalName, 'png', dataUrl);
    playSound('balloon');
    notify({
      title: 'Saved to My Pictures',
      message: `"${finalName}" saved to My Pictures.`,
      icon: 'paint',
    });
  }, [fileName, notify, playSound, vfs]);

  useEffect(() => {
    if (!isFocused) return;
    setAppMenus([
      {
        label: 'File',
        items: [
          { label: 'New', action: () => clearCanvas(true) },
          { label: 'Save to My Pictures', shortcut: '⌘S', action: handleSaveToPictures },
        ],
      },
      {
        label: 'Edit',
        items: [
          { label: 'Undo', shortcut: '⌘Z', disabled: !canUndo, action: handleUndo },
          { label: 'Clear Image', action: () => clearCanvas(true) },
        ],
      },
    ]);
  }, [isFocused, canUndo, clearCanvas, handleSaveToPictures, handleUndo, setAppMenus]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) * CANVAS_W) / rect.width);
    const y = Math.round(((e.clientY - rect.top) * CANVAS_H) / rect.height);
    return {
      x: Math.max(0, Math.min(CANVAS_W - 1, x)),
      y: Math.max(0, Math.min(CANVAS_H - 1, y)),
    };
  };

  const floodFill = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillHex: string
  ) => {
    const img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const data = img.data;
    const startIdx = (startY * CANVAS_W + startX) * 4;
    const sr = data[startIdx];
    const sg = data[startIdx + 1];
    const sb = data[startIdx + 2];
    const sa = data[startIdx + 3];
    const [fr, fg, fb, fa] = hexToRgba(fillHex);

    if (sr === fr && sg === fg && sb === fb && sa === fa) return;

    const tol = 28;
    const matches = (idx: number) =>
      Math.abs(data[idx] - sr) <= tol &&
      Math.abs(data[idx + 1] - sg) <= tol &&
      Math.abs(data[idx + 2] - sb) <= tol &&
      Math.abs(data[idx + 3] - sa) <= tol;

    const visited = new Uint8Array(CANVAS_W * CANVAS_H);
    const stack: number[] = [startX, startY];

    while (stack.length > 0) {
      const y = stack.pop()!;
      const x = stack.pop()!;
      const pIdx = y * CANVAS_W + x;
      if (visited[pIdx]) continue;
      const dIdx = pIdx * 4;
      if (!matches(dIdx)) continue;

      visited[pIdx] = 1;
      data[dIdx] = fr;
      data[dIdx + 1] = fg;
      data[dIdx + 2] = fb;
      data[dIdx + 3] = fa;

      if (x > 0) stack.push(x - 1, y);
      if (x < CANVAS_W - 1) stack.push(x + 1, y);
      if (y > 0) stack.push(x, y - 1);
      if (y < CANVAS_H - 1) stack.push(x, y + 1);
    }
    ctx.putImageData(img, 0, 0);
  };

  const sprayAt = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    const radius = Math.max(8, strokeSize * 3.2);
    const density = Math.max(16, strokeSize * 5);
    ctx.fillStyle = color;
    for (let i = 0; i < density; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      ctx.fillRect(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 1.5, 1.5);
    }
  };

  const drawShapePreview = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    ctx.strokeStyle = fgColor;
    ctx.fillStyle = bgColor;
    ctx.lineWidth = strokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (tool === 'rect') {
      const rx = Math.min(x1, x2);
      const ry = Math.min(y1, y2);
      const rw = Math.abs(x2 - x1);
      const rh = Math.abs(y2 - y1);
      if (fillShapes) ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (tool === 'ellipse') {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      if (fillShapes) ctx.fill();
      ctx.stroke();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e);
    pushUndo();

    if (tool === 'fill') {
      floodFill(ctx, pt.x, pt.y, e.button === 2 ? bgColor : fgColor);
      playSound('click');
      return;
    }

    isDrawingRef.current = true;
    startPtRef.current = pt;
    lastPtRef.current = pt;

    if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      snapshotRef.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
      return;
    }

    if (tool === 'airbrush') {
      sprayAt(ctx, pt.x, pt.y, fgColor);
      airbrushTimerRef.current = window.setInterval(() => {
        if (isDrawingRef.current) {
          sprayAt(ctx, lastPtRef.current.x, lastPtRef.current.y, fgColor);
        }
      }, 35);
      return;
    }

    ctx.save();
    ctx.strokeStyle = tool === 'eraser' ? bgColor : fgColor;
    ctx.fillStyle = tool === 'eraser' ? bgColor : fgColor;
    const width =
      tool === 'pencil'
        ? Math.max(1, Math.min(2, strokeSize))
        : tool === 'eraser'
          ? strokeSize * 2.2
          : strokeSize * 1.5;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    setCoords(pt);

    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }
      drawShapePreview(ctx, startPtRef.current.x, startPtRef.current.y, pt.x, pt.y);
      return;
    }

    if (tool === 'airbrush') {
      lastPtRef.current = pt;
      sprayAt(ctx, pt.x, pt.y, fgColor);
      return;
    }

    ctx.save();
    ctx.strokeStyle = tool === 'eraser' ? bgColor : fgColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth =
      tool === 'pencil'
        ? Math.max(1, Math.min(2, strokeSize))
        : tool === 'eraser'
          ? strokeSize * 2.2
          : strokeSize * 1.5;
    ctx.beginPath();
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();
    lastPtRef.current = pt;
  };

  const finishStroke = () => {
    isDrawingRef.current = false;
    snapshotRef.current = null;
    if (airbrushTimerRef.current !== null) {
      window.clearInterval(airbrushTimerRef.current);
      airbrushTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (airbrushTimerRef.current !== null) {
        window.clearInterval(airbrushTimerRef.current);
      }
    };
  }, []);

  const TOOLS: { id: PaintTool; label: string }[] = [
    { id: 'pencil', label: 'Pencil' },
    { id: 'brush', label: 'Brush' },
    { id: 'airbrush', label: 'Airbrush' },
    { id: 'fill', label: 'Fill With Color' },
    { id: 'line', label: 'Line' },
    { id: 'rect', label: 'Rectangle' },
    { id: 'ellipse', label: 'Ellipse' },
    { id: 'eraser', label: 'Eraser' },
  ];

  const handlePositions: React.CSSProperties[] = [
    { top: -3, left: -3 },
    { top: -3, left: '50%', transform: 'translateX(-50%)' },
    { top: -3, right: -3 },
    { top: '50%', right: -3, transform: 'translateY(-50%)' },
    { bottom: -3, right: -3 },
    { bottom: -3, left: '50%', transform: 'translateX(-50%)' },
    { bottom: -3, left: -3 },
    { top: '50%', left: -3, transform: 'translateY(-50%)' },
  ];

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
      {/* 34px Toolbar (.hc-toolbar) */}
      <div className="hc-toolbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            title="Undo"
            disabled={!canUndo}
            onClick={handleUndo}
            className="hc-tool"
          >
            <UIGlyph name="undo" size={16} tone="dark" disabled={!canUndo} />
          </button>
          <button
            type="button"
            title="Clear Image"
            onClick={() => {
              playSound('click');
              clearCanvas(true);
            }}
            className="hc-tool"
          >
            <UIGlyph name="trash" size={16} tone="dark" />
          </button>

          <span className="hc-toolbar-sep" />

          <input
            className="hc-field"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            aria-label="Artwork filename"
            style={{ width: 150 }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>.png</span>
        </div>

        <button type="button" className="hc-btn" onClick={handleSaveToPictures}>
          Save to My Pictures
        </button>
      </div>

      {/* Main Split: MS Paint Left Tool Palette + #808080 Canvas Workspace */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left Tool Box (68px) */}
        <aside
          style={{
            width: 68,
            flexShrink: 0,
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: 'var(--linen)',
            borderRight: '1px solid #B8B5AA',
          }}
        >
          {/* 2 columns of 24x24 .hc-tool buttons in a --well frame */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 24px',
              gap: 2,
              padding: 3,
              background: 'var(--linen-hi)',
              boxShadow: 'var(--well)',
              justifyContent: 'center',
            }}
          >
            {TOOLS.map((item) => {
              const active = tool === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  className={`hc-tool${active ? ' is-active' : ''}`}
                  onClick={() => {
                    playSound('click');
                    setTool(item.id);
                  }}
                  style={{
                    width: 24,
                    minWidth: 24,
                    height: 24,
                    padding: 0,
                  }}
                >
                  <PaintToolGlyph tool={item.id} />
                </button>
              );
            })}
          </div>

          {/* Options Box (line widths as drawn lines in a sunk box) */}
          <div
            style={{
              padding: 4,
              background: '#FFFFFF',
              boxShadow: 'var(--well)',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {[1, 2, 4, 7].map((sz) => {
              const active = strokeSize === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  title={`${sz}px`}
                  onClick={() => setStrokeSize(sz)}
                  style={{
                    width: '100%',
                    height: 14,
                    border: 'none',
                    padding: '0 4px',
                    background: active ? 'var(--select)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: '100%',
                      height: sz,
                      background: active ? '#FFFFFF' : '#1D1D1F',
                    }}
                  />
                </button>
              );
            })}

            {(tool === 'rect' || tool === 'ellipse') && (
              <div
                style={{
                  marginTop: 4,
                  paddingTop: 4,
                  borderTop: '1px solid #D0D0D0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {[
                  { filled: false, label: 'Outline' },
                  { filled: true, label: 'Fill' },
                ].map((opt) => {
                  const active = fillShapes === opt.filled;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setFillShapes(opt.filled)}
                      style={{
                        height: 16,
                        border: 'none',
                        background: active ? 'var(--select)' : 'transparent',
                        color: active ? '#FFFFFF' : 'var(--text)',
                        fontSize: 10,
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* #808080 Workspace with Canvas + 3x3 Blue Resize Handles */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 12,
            background: '#808080',
            boxShadow: 'inset 1px 1px 2px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
              onPointerLeave={() => setCoords(null)}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                display: 'block',
                width: CANVAS_W,
                height: CANVAS_H,
                background: '#FFFFFF',
                cursor: 'crosshair',
                touchAction: 'none',
              }}
            />
            {handlePositions.map((pos, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  width: 3,
                  height: 3,
                  background: '#000080',
                  pointerEvents: 'none',
                  ...pos,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom MS Paint Colour Box (§9.6) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          background: 'var(--linen)',
          borderTop: '1px solid #B8B5AA',
          boxShadow: 'inset 0 1px 0 var(--etch-light)',
          flexShrink: 0,
        }}
      >
        {/* 28x28 fg/bg overlapping swatches in sunken well */}
        <div
          role="button"
          tabIndex={0}
          title="Click to swap foreground and background colors"
          onClick={() => {
            const prev = fgColor;
            setFgColor(bgColor);
            setBgColor(prev);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const prev = fgColor;
              setFgColor(bgColor);
              setBgColor(prev);
            }
          }}
          style={{
            position: 'relative',
            width: 30,
            height: 30,
            background: 'var(--linen-hi)',
            boxShadow: 'var(--well)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 3,
              right: 3,
              width: 14,
              height: 14,
              background: bgColor,
              border: '1px solid #808080',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 3,
              left: 3,
              width: 14,
              height: 14,
              background: fgColor,
              border: '1px solid #000000',
            }}
          />
        </div>

        {/* 2 rows of 14 swatches 14x14, 1px #808080 sunken rim, 0 radius */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(14, 14px)',
            gap: 2,
          }}
        >
          {XP_PALETTE_28.map((hex) => (
            <button
              key={hex}
              type="button"
              title={`${hex} (Left-click: Foreground, Right-click: Background)`}
              onClick={() => setFgColor(hex)}
              onContextMenu={(e) => {
                e.preventDefault();
                setBgColor(hex);
              }}
              style={{
                width: 14,
                height: 14,
                padding: 0,
                borderRadius: 0,
                background: hex,
                border: '1px solid #808080',
                boxShadow:
                  fgColor.toLowerCase() === hex.toLowerCase()
                    ? 'inset 0 0 0 1px #FFFFFF'
                    : 'inset 1px 1px 0 rgba(0,0,0,0.2)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>

      {/* 22px Status Bar */}
      <div className="hc-statusbar" style={{ justifyContent: 'space-between' }}>
        <span>For Help, click Help Topics on the Help Menu.</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {coords ? `${coords.x}, ${coords.y} px` : `${CANVAS_W} x ${CANVAS_H} px`}
        </span>
      </div>
    </div>
  );
};
