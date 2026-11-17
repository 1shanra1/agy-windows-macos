import React, { useEffect, useRef } from 'react';
import type { TimeOfDay, WallpaperId } from '../core/types';

export interface BlissSonomaCanvasProps {
  wallpaper: WallpaperId;
  timeOfDay: TimeOfDay;
  interactive?: boolean;
  className?: string;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ScenePalette {
  skyStops: [string, string, string, string];
  farRidge: string;
  hillTop: string;
  hillMid: string;
  hillBot: string;
  rimGlow: string;
  cloudLit: string;
  cloudBody: string;
  cloudShade: string;
  bloomColor: string | null;
  bloomX: number;
  bloomY: number;
  stars: boolean;
}

function resolvePalette(wallpaper: WallpaperId, timeOfDay: TimeOfDay): ScenePalette {
  // Golden wallpaper or golden time of day
  if (wallpaper === 'golden' || (wallpaper === 'halcyon-live' && timeOfDay === 'golden')) {
    return {
      skyStops: ['#283673', '#6B5C8E', '#CC8878', '#F4C698'],
      farRidge: '#9C8BA2',
      hillTop: '#A4BA4E',
      hillMid: '#648332',
      hillBot: '#375020',
      rimGlow: 'rgba(255, 224, 152, 0.34)',
      cloudLit: 'rgba(255, 236, 210, 0.88)',
      cloudBody: 'rgba(246, 200, 178, 0.72)',
      cloudShade: 'rgba(130, 102, 138, 0.34)',
      bloomColor: 'rgba(255, 198, 122, 0.32)',
      bloomX: 0.32,
      bloomY: 0.44,
      stars: false,
    };
  }

  // Dusk wallpaper or midnight time of day
  if (wallpaper === 'dusk' || (wallpaper === 'halcyon-live' && timeOfDay === 'midnight')) {
    return {
      skyStops: ['#09122B', '#162D5E', '#2B538C', '#4E7AA8'],
      farRidge: '#3C5B84',
      hillTop: '#316E52',
      hillMid: '#1D4D42',
      hillBot: '#0F2F30',
      rimGlow: 'rgba(165, 214, 255, 0.24)',
      cloudLit: 'rgba(180, 208, 240, 0.42)',
      cloudBody: 'rgba(116, 150, 196, 0.32)',
      cloudShade: 'rgba(32, 52, 92, 0.36)',
      bloomColor: 'rgba(140, 188, 255, 0.18)',
      bloomX: 0.76,
      bloomY: 0.24,
      stars: true,
    };
  }

  // Coast wallpaper
  if (wallpaper === 'coast') {
    return {
      skyStops: ['#1858BD', '#3A8CE2', '#89C2EF', '#D2E8F8'],
      farRidge: '#7EA5BD',
      hillTop: '#5EA86E',
      hillMid: '#377E58',
      hillBot: '#1F5644',
      rimGlow: 'rgba(225, 250, 245, 0.26)',
      cloudLit: 'rgba(255, 255, 255, 0.90)',
      cloudBody: 'rgba(240, 248, 255, 0.78)',
      cloudShade: 'rgba(115, 152, 194, 0.32)',
      bloomColor: null,
      bloomX: 0.65,
      bloomY: 0.22,
      stars: false,
    };
  }

  // Morning variant for live meadow
  if (timeOfDay === 'morning') {
    return {
      skyStops: ['#266BC8', '#529EE8', '#A2D1F4', '#E6E4DC'],
      farRidge: '#98B4C6',
      hillTop: '#A4DC64',
      hillMid: '#58AE3C',
      hillBot: '#337E2A',
      rimGlow: 'rgba(255, 246, 210, 0.30)',
      cloudLit: 'rgba(255, 252, 246, 0.92)',
      cloudBody: 'rgba(246, 244, 242, 0.80)',
      cloudShade: 'rgba(135, 162, 198, 0.32)',
      bloomColor: 'rgba(255, 224, 180, 0.24)',
      bloomX: 0.74,
      bloomY: 0.28,
      stars: false,
    };
  }

  // Flagship Day (§7.2 exact spec: #1C5FD0 -> #3F86E3 -> #8CBCEE -> #CFE3F5, NO sun disc)
  return {
    skyStops: ['#1C5FD0', '#3F86E3', '#8CBCEE', '#CFE3F5'],
    farRidge: '#8FB5C8',
    hillTop: '#9BD65A',
    hillMid: '#4FA836',
    hillBot: '#2E7D24',
    rimGlow: 'rgba(235, 255, 200, 0.28)',
    cloudLit: 'rgba(255, 255, 255, 0.92)',
    cloudBody: 'rgba(244, 249, 255, 0.80)',
    cloudShade: 'rgba(120, 150, 190, 0.35)',
    bloomColor: null,
    bloomX: 0.68,
    bloomY: 0.2,
    stars: false,
  };
}

interface CloudSprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  baseX: number;
  baseY: number;
  speed: number;
  depth: number;
}

function buildCloudSprite(
  seed: number,
  w: number,
  h: number,
  puffCount: number,
  isWisp: boolean,
  pal: ScenePalette
): HTMLCanvasElement {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  if (!octx) return off;

  const rand = mulberry32(seed);
  const cx = w * 0.5;
  const baseLineY = h * 0.74;

  // Generate many small puffs (r 4-18) in a flat-bottomed deck with wispier upper crown
  const puffs: Array<{ x: number; y: number; r: number; alpha: number; flat: number }> = [];
  for (let i = 0; i < puffCount; i++) {
    const u = (rand() - 0.5) * 2; // -1..1
    const absU = Math.abs(u);
    const envH = Math.pow(Math.max(0.02, 1 - absU * absU), 1.2) * (isWisp ? 0.22 : 0.42);
    const v = Math.pow(rand(), 1.15); // denser near flat base, wispier toward top
    const px = cx + u * (w * 0.38) + (rand() - 0.5) * 14;
    const py = baseLineY - v * h * envH;
    // Small puffs r 4..18 (slightly finer near top/edges for wispy dissolution)
    const edgeFactor = 1 - absU * 0.35 - v * 0.3;
    const r = 4 + rand() * (isWisp ? 9 : 14) * Math.max(0.35, edgeFactor);
    const alpha = (isWisp ? 0.32 : 0.45) * (1 - v * 0.38) * (1 - absU * 0.28);
    const flat = v < 0.28 ? 1.85 : 1.35; // flatter along the base
    puffs.push({ x: px, y: py, r, alpha, flat });
  }

  octx.save();
  if ('filter' in octx) {
    octx.filter = 'blur(3.5px)';
  }

  // Pass 1: Cool shade pass offset +5px downward along flat base
  const shadeZero = pal.cloudShade.replace(/[\d.]+\)\s*$/, '0)');
  for (const p of puffs) {
    if (p.y < baseLineY - h * 0.25) continue;
    const sy = p.y + 5;
    const g = octx.createRadialGradient(p.x, sy, 0, p.x, sy, p.r * p.flat);
    g.addColorStop(0, pal.cloudShade);
    g.addColorStop(0.55, pal.cloudShade.replace(/[\d.]+\)\s*$/, '0.12)'));
    g.addColorStop(1, shadeZero);
    octx.globalAlpha = p.alpha * 0.85;
    octx.fillStyle = g;
    octx.beginPath();
    octx.ellipse(p.x, sy, p.r * p.flat, p.r * 0.58, 0, 0, Math.PI * 2);
    octx.fill();
  }

  // Pass 2: Fine wispy lit cumulus volume
  const litZero = pal.cloudBody.replace(/[\d.]+\)\s*$/, '0)');
  for (const p of puffs) {
    const g = octx.createRadialGradient(p.x, p.y - p.r * 0.15, 0, p.x, p.y, p.r * p.flat);
    g.addColorStop(0, pal.cloudLit);
    g.addColorStop(0.48, pal.cloudBody);
    g.addColorStop(1, litZero);
    octx.globalAlpha = p.alpha;
    octx.fillStyle = g;
    octx.beginPath();
    octx.ellipse(p.x, p.y, p.r * p.flat, p.r * 0.68, 0, 0, Math.PI * 2);
    octx.fill();
  }

  octx.restore();
  return off;
}

function buildDitherPattern(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const img = ctx.createImageData(128, 128);
  const rand = mulberry32(90125);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rand() > 0.5 ? 255 : 0;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = Math.floor(rand() * 5); // ~1.5% dither
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function buildMeadowSpecklePattern(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 160;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const rand = mulberry32(314159);
  for (let i = 0; i < 650; i++) {
    const x = rand() * 160;
    const y = rand() * 160;
    const dark = rand() > 0.45;
    ctx.fillStyle = dark ? 'rgba(18, 52, 14, 0.065)' : 'rgba(218, 255, 168, 0.055)';
    ctx.fillRect(x, y, 1 + rand() * 1.5, 1 + rand() * 1.2);
  }
  return c;
}

export const BlissSonomaCanvas: React.FC<BlissSonomaCanvasProps> = ({
  wallpaper,
  timeOfDay,
  interactive = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({ wallpaper, timeOfDay, interactive });
  propsRef.current = { wallpaper, timeOfDay, interactive };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const ditherTile = buildDitherPattern();
    const meadowTile = buildMeadowSpecklePattern();
    const ditherPat = ctx.createPattern(ditherTile, 'repeat');
    const meadowPat = ctx.createPattern(meadowTile, 'repeat');

    const rand = mulberry32(77312);
    const stars = Array.from({ length: 85 }, () => ({
      x: rand(),
      y: rand() * 0.56,
      r: 0.6 + rand() * 1.1,
      phase: rand() * Math.PI * 2,
    }));

    let cachedKey = '';
    let cloudSprites: CloudSprite[] = [];

    const ensureClouds = (wp: WallpaperId, tod: TimeOfDay, pal: ScenePalette) => {
      const key = `${wp}:${tod}`;
      if (key === cachedKey) return;
      cachedKey = key;

      cloudSprites = [
        {
          canvas: buildCloudSprite(101, 440, 210, 190, false, pal),
          w: 440,
          h: 210,
          baseX: 0.14,
          baseY: 0.14,
          speed: 0.0022,
          depth: 0.85,
        },
        {
          canvas: buildCloudSprite(202, 500, 230, 220, false, pal),
          w: 500,
          h: 230,
          baseX: 0.56,
          baseY: 0.09,
          speed: 0.0017,
          depth: 0.7,
        },
        {
          canvas: buildCloudSprite(303, 380, 180, 165, false, pal),
          w: 380,
          h: 180,
          baseX: 0.80,
          baseY: 0.25,
          speed: 0.0026,
          depth: 0.95,
        },
        {
          canvas: buildCloudSprite(404, 340, 120, 95, true, pal),
          w: 340,
          h: 120,
          baseX: 0.34,
          baseY: 0.30,
          speed: 0.0012,
          depth: 0.45,
        },
        {
          canvas: buildCloudSprite(505, 300, 110, 90, true, pal),
          w: 300,
          h: 110,
          baseX: 0.04,
          baseY: 0.36,
          speed: 0.0014,
          depth: 0.5,
        },
      ];
    };

    let width = 0;
    let height = 0;
    let dpr = 1;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      const tw = Math.floor(width * dpr);
      const th = Math.floor(height * dpr);
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(canvas);

    let targetPx = 0;
    let targetPy = 0;
    let currentPx = 0;
    let currentPy = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (!propsRef.current.interactive || reducedMotion) return;
      targetPx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      targetPy = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let rafId = 0;
    const t0 = performance.now();

    const drawFrame = (now: number) => {
      const t = reducedMotion ? 0 : (now - t0) * 0.001;
      currentPx += (targetPx - currentPx) * 0.05;
      currentPy += (targetPy - currentPy) * 0.05;
      const px = currentPx;
      const py = currentPy;

      const { wallpaper: wp, timeOfDay: tod } = propsRef.current;
      const pal = resolvePalette(wp, tod);
      ensureClouds(wp, tod, pal);

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Sky gradient + 1.5% noise dither (NO sun disc)
      const sky = ctx.createLinearGradient(0, 0, 0, height * 0.68);
      sky.addColorStop(0, pal.skyStops[0]);
      sky.addColorStop(0.45, pal.skyStops[1]);
      sky.addColorStop(0.78, pal.skyStops[2]);
      sky.addColorStop(1, pal.skyStops[3]);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      if (ditherPat) {
        ctx.fillStyle = ditherPat;
        ctx.fillRect(0, 0, width, height * 0.7);
      }

      if (pal.bloomColor) {
        const bx = pal.bloomX * width + px * 8;
        const by = pal.bloomY * height + py * 5;
        const bg = ctx.createRadialGradient(bx, by, 0, bx, by, Math.max(width, height) * 0.45);
        bg.addColorStop(0, pal.bloomColor);
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height * 0.75);
      }

      if (pal.stars) {
        ctx.fillStyle = '#FFFFFF';
        for (const s of stars) {
          ctx.globalAlpha = 0.45 + 0.45 * Math.sin(t * 1.4 + s.phase);
          ctx.beginPath();
          ctx.arc(s.x * width + px * 3, s.y * height + py * 2, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // 2. Offscreen pre-baked volumetric cumulus clouds
      const scaleK = Math.max(0.55, width / 1440);
      for (const c of cloudSprites) {
        const cx = (((c.baseX + t * c.speed) % 1.35) - 0.17) * width + px * 14 * c.depth;
        const cy = c.baseY * height + py * 7 * c.depth;
        const dw = c.w * scaleK;
        const dh = c.h * scaleK;
        ctx.drawImage(c.canvas, cx - dw * 0.5, cy - dh * 0.5, dw, dh);
      }

      // 3. Far atmospheric ridge (~60% y, #8FB5C8, no stroke)
      const farY = height * 0.60 + py * 3;
      ctx.beginPath();
      ctx.moveTo(-20, farY + 14);
      ctx.bezierCurveTo(
        width * 0.28,
        farY - height * 0.045,
        width * 0.62,
        farY - height * 0.075,
        width + 20,
        farY + 6
      );
      ctx.lineTo(width + 20, height + 20);
      ctx.lineTo(-20, height + 20);
      ctx.closePath();
      const farG = ctx.createLinearGradient(0, farY - height * 0.08, 0, height * 0.78);
      farG.addColorStop(0, pal.farRidge);
      farG.addColorStop(1, pal.skyStops[3]);
      ctx.fillStyle = farG;
      ctx.fill();

      // 4. Dominant Bliss Hill (single smooth cubic, crest ~38%x / 58%y, no ridge stroke)
      const crestX = width * 0.38 + px * 12;
      const crestY = height * 0.58 + py * 6;
      const leftY = height * 0.65 + py * 5;
      const rightY = height * 0.69 + py * 5;

      const buildMainHillPath = () => {
        ctx.beginPath();
        ctx.moveTo(-20, leftY);
        ctx.bezierCurveTo(
          width * 0.16,
          crestY - height * 0.02,
          crestX + width * 0.14,
          crestY - height * 0.015,
          width + 20,
          rightY
        );
        ctx.lineTo(width + 20, height + 20);
        ctx.lineTo(-20, height + 20);
        ctx.closePath();
      };

      buildMainHillPath();
      const hillGrad = ctx.createLinearGradient(0, crestY - 12, 0, height);
      hillGrad.addColorStop(0, pal.hillTop);
      hillGrad.addColorStop(0.38, pal.hillMid);
      hillGrad.addColorStop(1, pal.hillBot);
      ctx.fillStyle = hillGrad;
      ctx.fill();

      // Clip to hill for crest-to-valley light modulation, speckle texture, feathered rim, and soft cloud shadows
      ctx.save();
      buildMainHillPath();
      ctx.clip();

      // Sunlit crest bloom on upper-left slope
      const crestBloom = ctx.createRadialGradient(
        crestX * 0.88,
        crestY + height * 0.04,
        10,
        crestX * 0.88,
        crestY + height * 0.04,
        width * 0.44
      );
      crestBloom.addColorStop(0, 'rgba(222, 255, 138, 0.36)');
      crestBloom.addColorStop(0.5, 'rgba(182, 238, 96, 0.14)');
      crestBloom.addColorStop(1, 'rgba(182, 238, 96, 0)');
      ctx.fillStyle = crestBloom;
      ctx.fillRect(0, crestY - 24, width, height - crestY + 30);

      // Cool valley trough shadow in lower-right
      const valleyShadow = ctx.createRadialGradient(
        width * 0.78,
        height * 0.94,
        20,
        width * 0.78,
        height * 0.94,
        width * 0.56
      );
      valleyShadow.addColorStop(0, 'rgba(12, 56, 46, 0.34)');
      valleyShadow.addColorStop(0.55, 'rgba(16, 64, 48, 0.14)');
      valleyShadow.addColorStop(1, 'rgba(16, 64, 48, 0)');
      ctx.fillStyle = valleyShadow;
      ctx.fillRect(0, crestY - 24, width, height - crestY + 30);

      if (meadowPat) {
        ctx.fillStyle = meadowPat;
        ctx.fillRect(0, crestY - 24, width, height - crestY + 30);
      }

      // 2 drifting soft cloud shadows across slope
      for (let s = 0; s < 2; s++) {
        const sx = (((0.22 + s * 0.45 + t * 0.004) % 1.3) - 0.15) * width;
        const sy = crestY + height * (0.10 + s * 0.08);
        const sg = ctx.createRadialGradient(sx, sy, 12, sx, sy, width * 0.24);
        sg.addColorStop(0, 'rgba(10, 42, 18, 0.16)');
        sg.addColorStop(1, 'rgba(10, 42, 18, 0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, crestY - 20, width, height - crestY + 25);
      }

      // 3px feathered rim light along the ridge (no sharp stroke)
      ctx.beginPath();
      ctx.moveTo(-20, leftY);
      ctx.bezierCurveTo(
        width * 0.16,
        crestY - height * 0.02,
        crestX + width * 0.14,
        crestY - height * 0.015,
        width + 20,
        rightY
      );
      ctx.strokeStyle = pal.rimGlow;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.restore();
      ctx.restore();

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    if (reducedMotion) {
      drawFrame(performance.now());
    } else {
      rafId = window.requestAnimationFrame(drawFrame);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
};
