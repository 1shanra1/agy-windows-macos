import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OSAppProps } from '../../core/types';
import { useOS } from '../../core/osStore';
import { UIGlyph } from '../../art';

type VisualizerMode = 'spectrum' | 'scope';
type SourceFilter = 'all' | string;

interface SynthTrack {
  id: string;
  title: string;
  shortTitle: string;
  artist: string;
  durationSec: number;
  tempoMs: number;
  wave: OscillatorType;
  subWave: OscillatorType;
  chords: number[][];
  arp: number[];
}

const TRACKS: SynthTrack[] = [
  {
    id: 'bliss-horizon',
    title: 'Bliss Horizon',
    shortTitle: 'Bliss',
    artist: 'Lunaura Field Ensemble',
    durationSec: 180,
    tempoMs: 520,
    wave: 'triangle',
    subWave: 'sine',
    chords: [
      [261.63, 329.63, 392.0, 493.88],
      [220.0, 261.63, 329.63, 392.0],
      [174.61, 220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66, 392.0],
    ],
    arp: [523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 493.88, 392.0],
  },
  {
    id: 'cupertino-cerulean',
    title: 'Cupertino Cerulean',
    shortTitle: 'Aqua',
    artist: 'Aqua Glass Quartet',
    durationSec: 161,
    tempoMs: 400,
    wave: 'sine',
    subWave: 'triangle',
    chords: [
      [293.66, 369.99, 440.0, 554.37],
      [246.94, 293.66, 369.99, 440.0],
      [196.0, 246.94, 293.66, 369.99],
      [220.0, 277.18, 329.63, 440.0],
    ],
    arp: [587.33, 739.99, 880.0, 1108.73, 880.0, 739.99, 659.25, 554.37],
  },
  {
    id: 'taskbar-daydream',
    title: 'Taskbar Daydream',
    shortTitle: 'Royale',
    artist: 'Wave Chip Collective',
    durationSec: 148,
    tempoMs: 240,
    wave: 'square',
    subWave: 'triangle',
    chords: [
      [261.63, 329.63, 392.0],
      [293.66, 349.23, 440.0],
      [329.63, 392.0, 493.88],
      [246.94, 293.66, 392.0],
    ],
    arp: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 783.99],
  },
  {
    id: 'royale-nocturne',
    title: 'Royale Nocturne',
    shortTitle: 'Nocturne',
    artist: 'Midnight Energy Ensemble',
    durationSec: 183,
    tempoMs: 560,
    wave: 'sawtooth',
    subWave: 'sine',
    chords: [
      [220.0, 261.63, 329.63, 392.0],
      [196.0, 246.94, 293.66, 349.23],
      [174.61, 220.0, 261.63, 349.23],
      [164.81, 196.0, 246.94, 329.63],
    ],
    arp: [440.0, 523.25, 659.25, 587.33, 523.25, 493.88, 392.0, 329.63],
  },
];

function formatClock(sec: number): string {
  const clamped = Math.max(0, Math.floor(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const MediaSynthApp: React.FC<OSAppProps> = ({
  isFocused,
  setWindowTitle,
  setAppMenus,
}) => {
  const { settings, playSound } = useOS();

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedId, setSelectedId] = useState<string>(TRACKS[0].id);
  const [playingId, setPlayingId] = useState<string>(TRACKS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [vizMode, setVizMode] = useState<VisualizerMode>('spectrum');
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [lcdSpectrumMode, setLcdSpectrumMode] = useState(false);
  const [lcdBars, setLcdBars] = useState<number[]>(() => new Array(24).fill(2));
  const [playerVolume, setPlayerVolume] = useState(0.75);
  const [muted, setMuted] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const peaksRef = useRef<number[]>(new Array(48).fill(0));
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(performance.now());

  const playingTrack = useMemo(
    () => TRACKS.find((t) => t.id === playingId) ?? TRACKS[0],
    [playingId]
  );

  const visibleTracks = useMemo(
    () =>
      sourceFilter === 'all'
        ? TRACKS
        : TRACKS.filter((t) => t.id === sourceFilter),
    [sourceFilter]
  );

  const totalMinutesText = useMemo(() => {
    const totalSec = visibleTracks.reduce((sum, t) => sum + t.durationSec, 0);
    const mins = (totalSec / 60).toFixed(1);
    const count = visibleTracks.length;
    return `${count} ${count === 1 ? 'song' : 'songs'}, ${mins} minutes`;
  }, [visibleTracks]);

  useEffect(() => {
    setWindowTitle('Prism');
  }, [setWindowTitle]);

  const stopEngine = useCallback(() => {
    if (schedulerRef.current !== null) {
      window.clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        void audioCtxRef.current.close();
      } catch {
        // ignore close errors
      }
      audioCtxRef.current = null;
      analyserRef.current = null;
      masterGainRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const triggerStep = useCallback((track: SynthTrack, ctx: AudioContext, dest: AudioNode) => {
    const step = stepRef.current;
    stepRef.current += 1;

    const now = ctx.currentTime;
    const stepDur = track.tempoMs / 1000;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(track.id === 'taskbar-daydream' ? 2400 : 1450, now);
    filter.Q.setValueAtTime(1.8, now);
    filter.connect(dest);

    if (step % 4 === 0) {
      const chordIdx = Math.floor(step / 4) % track.chords.length;
      const chord = track.chords[chordIdx];

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? track.subWave : track.wave;
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((idx - 1.5) * 6, now);

        const dur = stepDur * 3.9;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.065, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(now);
        osc.stop(now + dur + 0.02);
      });

      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(chord[0] / 2, now);
      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.linearRampToValueAtTime(0.14, now + 0.05);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDur * 3.8);
      bassOsc.connect(bassGain);
      bassGain.connect(dest);
      bassOsc.start(now);
      bassOsc.stop(now + stepDur * 3.9);
    }

    const noteFreq = track.arp[step % track.arp.length];
    const arpOsc = ctx.createOscillator();
    const arpGain = ctx.createGain();
    arpOsc.type = track.id === 'taskbar-daydream' ? 'square' : 'sine';
    arpOsc.frequency.setValueAtTime(noteFreq, now);
    arpGain.gain.setValueAtTime(0.0001, now);
    arpGain.gain.linearRampToValueAtTime(
      track.id === 'taskbar-daydream' ? 0.05 : 0.085,
      now + 0.02
    );
    arpGain.gain.exponentialRampToValueAtTime(0.0008, now + stepDur * 0.92);

    arpOsc.connect(arpGain);
    arpGain.connect(filter);
    arpOsc.start(now);
    arpOsc.stop(now + stepDur);
  }, []);

  const startEngine = useCallback(
    (trackId: string) => {
      stopEngine();
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;

      const master = ctx.createGain();
      const effectiveVol = muted || !settings.soundEnabled ? 0 : playerVolume * settings.volume;
      master.gain.setValueAtTime(effectiveVol, ctx.currentTime);

      master.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      masterGainRef.current = master;
      stepRef.current = 0;

      const track = TRACKS.find((t) => t.id === trackId) ?? TRACKS[0];
      setPlayingId(track.id);
      setSelectedId(track.id);
      triggerStep(track, ctx, master);
      schedulerRef.current = window.setInterval(() => {
        if (audioCtxRef.current && masterGainRef.current) {
          triggerStep(track, audioCtxRef.current, masterGainRef.current);
        }
      }, track.tempoMs);

      setIsPlaying(true);
    },
    [muted, playerVolume, settings.soundEnabled, settings.volume, stopEngine, triggerStep]
  );

  const playTrackByOffset = useCallback(
    (delta: number) => {
      playSound('click');
      const idx = TRACKS.findIndex((t) => t.id === playingId);
      const next = TRACKS[(idx + delta + TRACKS.length) % TRACKS.length];
      setPlayingId(next.id);
      setSelectedId(next.id);
      setElapsedSec(0);
      if (isPlaying) {
        startEngine(next.id);
      }
    },
    [isPlaying, playSound, playingId, startEngine]
  );

  useEffect(() => {
    if (!isFocused) return;
    setAppMenus([
      {
        label: 'Controls',
        items: [
          {
            label: isPlaying ? 'Pause' : 'Play',
            action: () => (isPlaying ? stopEngine() : startEngine(playingId)),
          },
          {
            label: 'Stop',
            action: () => {
              stopEngine();
              setElapsedSec(0);
            },
            dividerAfter: true,
          },
          { label: 'Previous', action: () => playTrackByOffset(-1) },
          { label: 'Next', action: () => playTrackByOffset(1) },
        ],
      },
      {
        label: 'View',
        items: [
          { label: 'Show Visualizer', action: () => setShowVisualizer((v) => !v) },
          { label: 'Spectrum', action: () => setVizMode('spectrum') },
          { label: 'Oscilloscope', action: () => setVizMode('scope') },
        ],
      },
    ]);
  }, [isFocused, isPlaying, playingId, playTrackByOffset, setAppMenus, startEngine, stopEngine]);

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const target = muted || !settings.soundEnabled ? 0 : playerVolume * settings.volume;
      masterGainRef.current.gain.setTargetAtTime(target, audioCtxRef.current.currentTime, 0.04);
    }
  }, [muted, playerVolume, settings.soundEnabled, settings.volume]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setElapsedSec((s) => (s + 1 >= playingTrack.durationSec ? 0 : s + 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPlaying, playingTrack.durationSec]);

  useEffect(() => {
    return () => {
      stopEngine();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [stopEngine]);

  // Mini LCD dot-matrix updater when LCD spectrum mode is active
  useEffect(() => {
    if (!lcdSpectrumMode) return;
    const id = window.setInterval(() => {
      const analyser = analyserRef.current;
      if (analyser && isPlaying) {
        const bins = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(bins);
        const next: number[] = [];
        for (let i = 0; i < 24; i += 1) {
          const v = bins[1 + Math.floor((i / 23) * 20)] ?? 0;
          next.push(Math.max(1, Math.min(8, Math.round((v / 255) * 8))));
        }
        setLcdBars(next);
      } else {
        setLcdBars((prev) => prev.map(() => 1));
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [isPlaying, lcdSpectrumMode]);

  // 60fps Canvas Visualizer inside WMP9 Bezel (§9.1)
  useEffect(() => {
    if (!showVisualizer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const freqData = new Uint8Array(128);
    const timeData = new Uint8Array(128);

    const drawFrame = (nowMs: number) => {
      const dtSec = Math.min(0.08, Math.max(0.001, (nowMs - lastFrameRef.current) / 1000));
      lastFrameRef.current = nowMs;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(200, Math.floor(rect.width));
      const h = Math.max(80, Math.floor(rect.height));

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Inner screen bg #03070D
      ctx.fillStyle = '#03070D';
      ctx.fillRect(0, 0, w, h);

      const drawGrid = () => {
        ctx.strokeStyle = 'rgba(120, 180, 255, 0.06)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < w; gx += 16) {
          ctx.beginPath();
          ctx.moveTo(gx + 0.5, 0);
          ctx.lineTo(gx + 0.5, h);
          ctx.stroke();
        }
        for (let gy = 0; gy < h; gy += 16) {
          ctx.beginPath();
          ctx.moveTo(0, gy + 0.5);
          ctx.lineTo(w, gy + 0.5);
          ctx.stroke();
        }
      };

      const analyser = analyserRef.current;
      if (!isPlaying || !analyser) {
        peaksRef.current.fill(0);
        drawGrid();
        const baselineY = vizMode === 'spectrum' ? Math.floor(h * 0.78) : Math.floor(h * 0.5);
        ctx.strokeStyle = 'rgba(127, 224, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12, baselineY + 0.5);
        ctx.lineTo(w - 12, baselineY + 0.5);
        ctx.stroke();
        ctx.restore();
        return;
      }

      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      if (vizMode === 'spectrum') {
        // 48 thin bars (4px bar, 2px gap centered), #9FE3FF -> #2F7BEA 60% -> #0E3E9E
        // 1px peak caps #CFF1FF falling at 30px/s, mirrored 18% reflection under baseline
        const bars = 48;
        const padX = 12;
        const availW = w - padX * 2;
        const step = availW / bars;
        const gap = Math.max(1, Math.min(2, step * 0.3));
        const barW = Math.max(2, Math.min(4, step - gap));
        const totalDrawW = bars * barW + (bars - 1) * gap;
        const startX = (w - totalDrawW) / 2;

        const baselineY = Math.floor(h * 0.78);
        const maxBarH = baselineY - 10;
        const reflectMaxH = Math.floor((h - baselineY - 4) * 0.9);

        const barGrad = ctx.createLinearGradient(0, baselineY - maxBarH, 0, baselineY);
        barGrad.addColorStop(0, '#9FE3FF');
        barGrad.addColorStop(0.6, '#2F7BEA');
        barGrad.addColorStop(1, '#0E3E9E');

        for (let i = 0; i < bars; i += 1) {
          const binPos = 1 + (i / (bars - 1)) * 22;
          const b0 = Math.floor(binPos);
          const b1 = Math.min(freqData.length - 1, b0 + 1);
          const frac = binPos - b0;
          const rawVal = freqData[b0] * (1 - frac) + freqData[b1] * frac;
          const val = Math.min(1, (rawVal / 255) * 1.15);
          const barH = Math.max(2, val * maxBarH);
          const x = startX + i * (barW + gap);

          // Peak cap falling at 30px/s
          if (barH >= peaksRef.current[i]) {
            peaksRef.current[i] = barH;
          } else {
            peaksRef.current[i] = Math.max(2, peaksRef.current[i] - 30 * dtSec);
          }

          // Main bar
          ctx.fillStyle = barGrad;
          ctx.fillRect(x, baselineY - barH, barW, barH);

          // 1px peak cap #CFF1FF
          const peakY = Math.max(4, baselineY - peaksRef.current[i] - 2);
          ctx.fillStyle = '#CFF1FF';
          ctx.fillRect(x, peakY, barW, 1);

          // Mirrored 18% reflection under baseline
          const reflH = Math.min(reflectMaxH, barH * 0.35);
          if (reflH > 1) {
            ctx.save();
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = '#2F7BEA';
            ctx.fillRect(x, baselineY + 1, barW, reflH);
            ctx.restore();
          }
        }
      } else {
        // Scope: faint 16px grid rgba(120,180,255,.06), 1.5px line #7FE0FF with shadowBlur 4 at 60%
        drawGrid();

        ctx.save();
        ctx.strokeStyle = '#7FE0FF';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(127, 224, 255, 0.6)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        const sliceW = w / timeData.length;
        for (let i = 0; i < timeData.length; i += 1) {
          const v = timeData[i] / 128.0;
          const y = (v * h) / 2;
          const x = i * sliceW;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(drawFrame);
    };

    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(drawFrame);
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (!isPlaying) {
              lastFrameRef.current = performance.now();
              requestAnimationFrame(drawFrame);
            }
          })
        : null;
    if (ro) ro.observe(canvas);
    return () => {
      if (ro) ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, showVisualizer, vizMode]);

  const progressRatio = Math.min(1, elapsedSec / Math.max(1, playingTrack.durationSec));
  const remainingSec = Math.max(0, playingTrack.durationSec - elapsedSec);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
        overflow: 'hidden',
        background: 'var(--metal-bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* 64px Brushed Metal Toolbar (§9.1) */}
      <div
        className="hc-metal"
        style={{
          height: 64,
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          borderBottom: '1px solid rgba(0, 0, 0, 0.28)',
          flexShrink: 0,
        }}
      >
        {/* WMP9 Sculpted Transport Pod (150x44, r22) */}
        <div
          style={{
            position: 'relative',
            width: 150,
            height: 44,
            borderRadius: 22,
            flexShrink: 0,
            background: 'linear-gradient(180deg, #F4F5F6 0%, #C3C6CA 100%)',
            boxShadow:
              'inset 0 1px 0 #FFFFFF, inset 0 -1px 2px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
          }}
        >
          {/* Stop 22px disc at left */}
          <button
            type="button"
            title="Stop"
            onClick={() => {
              stopEngine();
              setElapsedSec(0);
            }}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(180deg, #E5E7EA 0%, #C6C9CE 100%)',
              boxShadow: 'var(--well)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <UIGlyph name="stop-media" size={10} tone="dark" />
          </button>

          {/* Prev 28px disc */}
          <button
            type="button"
            title="Previous"
            onClick={() => playTrackByOffset(-1)}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(180deg, #ECEEF1 0%, #CACDD2 100%)',
              boxShadow: 'var(--well)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <UIGlyph name="prev" size={12} tone="dark" />
          </button>

          {/* Center overlapping 44px Cobalt Glass Play/Pause Disc */}
          <button
            type="button"
            title={isPlaying ? 'Pause' : 'Play'}
            onClick={() => {
              if (isPlaying) stopEngine();
              else startEngine(playingId);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '2px solid #BFC4CC',
              background: isPlaying
                ? 'radial-gradient(circle at 50% 30%, #7BB8FA 0%, #2468CE 48%, #0B3385 100%)'
                : 'radial-gradient(circle at 50% 30%, #9FD0FF 0%, #2F7BEA 45%, #0E3E9E 100%)',
              boxShadow: isPlaying
                ? 'inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.35)'
                : 'inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 1px 3px rgba(0, 0, 0, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              zIndex: 2,
            }}
          >
            <UIGlyph
              name={isPlaying ? 'pause' : 'play'}
              size={16}
              tone="light"
              style={isPlaying ? undefined : { marginLeft: 1 }}
            />
          </button>

          {/* Next 28px disc */}
          <button
            type="button"
            title="Next"
            onClick={() => playTrackByOffset(1)}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(180deg, #ECEEF1 0%, #CACDD2 100%)',
              boxShadow: 'var(--well)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <UIGlyph name="next" size={12} tone="dark" />
          </button>
        </div>

        {/* iTunes 4 Recessed Ice-Olive LCD (240-420 x 50, r6) */}
        <div
          role="button"
          tabIndex={0}
          title="Click to toggle LCD display mode"
          onClick={() => setLcdSpectrumMode((m) => !m)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setLcdSpectrumMode((m) => !m);
          }}
          style={{
            flex: '1 1 240px',
            minWidth: 210,
            maxWidth: 420,
            height: 50,
            borderRadius: 6,
            padding: '4px 10px',
            background: 'linear-gradient(180deg, #EDF1DC 0%, #DCE3C4 100%)',
            border: '1px solid #6E7461',
            boxShadow:
              'inset 0 1px 3px rgba(0, 0, 0, 0.35), 0 1px 0 rgba(255, 255, 255, 0.7)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {/* 1px horizontal scanlines at 4% alpha */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 2px)',
            }}
          />
          <div
            style={{
              fontSize: 12,
              lineHeight: '13px',
              fontWeight: 700,
              color: '#1E2414',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            {playingTrack.title}
          </div>

          {lcdSpectrumMode ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: 2,
                height: 24,
                paddingBottom: 2,
                position: 'relative',
              }}
            >
              {lcdBars.map((level, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    gap: 1,
                    width: 4,
                  }}
                >
                  {Array.from({ length: level }).map((_, cIdx) => (
                    <span
                      key={cIdx}
                      style={{
                        display: 'block',
                        width: 4,
                        height: 2,
                        background: '#3F4630',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 11,
                  lineHeight: '12px',
                  fontWeight: 400,
                  color: '#3F4630',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                }}
              >
                {playingTrack.artist}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    lineHeight: '10px',
                    color: '#2A2F22',
                    minWidth: 28,
                  }}
                >
                  {formatClock(elapsedSec)}
                </span>

                <div
                  role="slider"
                  aria-label="Track position"
                  aria-valuemin={0}
                  aria-valuemax={playingTrack.durationSec}
                  aria-valuenow={elapsedSec}
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    setElapsedSec(Math.round(pct * playingTrack.durationSec));
                  }}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(0, 0, 0, 0.15)',
                    boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.22)',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -1,
                      left: `calc(${progressRatio * 100}% - 4px)`,
                      width: 8,
                      height: 8,
                      background: '#2A2F22',
                      transform: 'rotate(45deg)',
                    }}
                  />
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    lineHeight: '10px',
                    color: '#2A2F22',
                    minWidth: 32,
                    textAlign: 'right',
                  }}
                >
                  -{formatClock(remainingSec)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right of LCD: Volume slider + Spectrum/Scope seg + Bezel toggle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button
              type="button"
              title={muted ? 'Unmute' : 'Mute'}
              onClick={() => setMuted((m) => !m)}
              className="hc-tool"
              style={{ width: 20, minWidth: 20, height: 18, padding: 0 }}
            >
              <UIGlyph name={muted ? 'speaker-mute' : 'speaker'} size={14} tone="dark" />
            </button>
            <input
              type="range"
              className="hc-slider"
              aria-label="Volume"
              min={0}
              max={1}
              step={0.02}
              value={muted ? 0 : playerVolume}
              onChange={(e) => {
                setMuted(false);
                setPlayerVolume(parseFloat(e.target.value));
              }}
              style={{ width: 90 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="hc-seg" style={{ height: 20 }}>
              <button
                type="button"
                className={vizMode === 'spectrum' ? 'is-active' : undefined}
                onClick={() => {
                  playSound('click');
                  setVizMode('spectrum');
                }}
              >
                Spectrum
              </button>
              <button
                type="button"
                className={vizMode === 'scope' ? 'is-active' : undefined}
                onClick={() => {
                  playSound('click');
                  setVizMode('scope');
                }}
              >
                Scope
              </button>
            </div>
            <button
              type="button"
              title="Toggle Visualizer"
              className={`hc-tool${showVisualizer ? ' is-active' : ''}`}
              onClick={() => setShowVisualizer((v) => !v)}
              style={{ height: 20, minWidth: 24 }}
            >
              <UIGlyph name="eq" size={14} tone="dark" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: Source List + Track Table & Visualizer Bezel */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Mac Source List (150px) */}
        <aside className="hc-sourcelist" style={{ width: 150, flexShrink: 0 }}>
          <div className="hc-sourcelist-group">Library</div>
          <div
            role="button"
            tabIndex={0}
            className={`hc-sourcelist-row${sourceFilter === 'all' ? ' is-selected' : ''}`}
            onClick={() => {
              playSound('click');
              setSourceFilter('all');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSourceFilter('all');
            }}
          >
            <UIGlyph
              name="eq"
              size={14}
              tone={sourceFilter === 'all' ? 'light' : 'dark'}
            />
            <span>Music</span>
          </div>

          <div className="hc-sourcelist-group" style={{ marginTop: 6 }}>
            Synth Presets
          </div>
          {TRACKS.map((track) => {
            const active = sourceFilter === track.id;
            return (
              <div
                key={track.id}
                role="button"
                tabIndex={0}
                className={`hc-sourcelist-row${active ? ' is-selected' : ''}`}
                onClick={() => {
                  playSound('click');
                  setSourceFilter(track.id);
                  setSelectedId(track.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSourceFilter(track.id);
                }}
              >
                <UIGlyph name="star" size={13} tone={active ? 'light' : 'dark'} />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {track.shortTitle}
                </span>
              </div>
            );
          })}
        </aside>

        {/* Right Pane: Striped Track Table + WMP9 Visualizer Bezel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
            background: 'var(--paper)',
          }}
        >
          {/* Track Table */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="hc-colhead" style={{ flexShrink: 0 }}>
              <div className="hc-colhead-cell" style={{ width: 24, padding: 0 }} />
              <div className="hc-colhead-cell" style={{ flex: 1.4 }}>
                Name
              </div>
              <div className="hc-colhead-cell" style={{ flex: 1.2 }}>
                Artist
              </div>
              <div
                className="hc-colhead-cell"
                style={{ width: 56, justifyContent: 'flex-end' }}
              >
                Time
              </div>
            </div>

            <div
              className={`hc-list${isFocused ? '' : ' is-inactive'}`}
              style={{ flex: 1, overflowY: 'auto' }}
            >
              {visibleTracks.map((track) => {
                const isSel = selectedId === track.id;
                const isNowPlaying = playingId === track.id && isPlaying;
                return (
                  <div
                    key={track.id}
                    className={`hc-list-row${isSel ? ' is-selected' : ''}`}
                    onClick={() => setSelectedId(track.id)}
                    onDoubleClick={() => {
                      setElapsedSec(0);
                      startEngine(track.id);
                    }}
                    style={{ padding: 0, cursor: 'pointer' }}
                  >
                    <div
                      style={{
                        width: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isNowPlaying && (
                        <UIGlyph
                          name="speaker"
                          size={10}
                          tone={isSel && isFocused ? 'light' : 'dark'}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        flex: 1.4,
                        padding: '0 8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {track.title}
                    </div>
                    <div
                      style={{
                        flex: 1.2,
                        padding: '0 8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {track.artist}
                    </div>
                    <div
                      style={{
                        width: 56,
                        padding: '0 8px',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatClock(track.durationSec)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WMP9 Visualizer Bezel (120px) */}
          {showVisualizer && (
            <div
              className="hc-metal"
              style={{
                height: 120,
                flexShrink: 0,
                padding: 6,
                borderTop: '1px solid rgba(0, 0, 0, 0.35)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: '#03070D',
                  boxShadow:
                    'inset 0 0 0 1px #000000, inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metal-Tinted Status Bar (centred song count) */}
      <div
        className="hc-statusbar"
        style={{
          background: 'var(--metal-bg)',
          borderTop: '1px solid rgba(0, 0, 0, 0.25)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.65)',
          justifyContent: 'center',
          color: '#2B2B2B',
          textShadow: '0 1px 0 rgba(255, 255, 255, 0.75)',
        }}
      >
        {totalMinutesText}
      </div>
    </div>
  );
};
