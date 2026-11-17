import { SoundEffect } from './types';

let sharedCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx) {
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {
      // Ignore autoplay blocks before first user gesture
    });
  }
  return sharedCtx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 0.5);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

function playTone(
  ctx: AudioContext,
  master: GainNode,
  freq: number,
  type: OscillatorType,
  startOffset: number,
  duration: number,
  peakGain: number,
  endFreq?: number,
  detune = 0
): void {
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
  }
  if (detune !== 0) {
    osc.detune.setValueAtTime(detune, now);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peakGain), now + Math.min(0.025, duration * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playSynthSound(effect: SoundEffect, volume = 0.65, enabled = true): void {
  if (!enabled || volume <= 0.005) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const master = ctx.createGain();
  master.gain.setValueAtTime(Math.min(1, Math.max(0, volume)) * 0.45, ctx.currentTime);
  master.connect(ctx.destination);

  switch (effect) {
    case 'startup': {
      // Warm F#maj9 shimmering pad + crystalline harmonic bell
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3400, ctx.currentTime + 0.7);
      filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 2.4);
      filter.connect(master);

      const chord = [185.0, 277.18, 369.99, 415.3, 466.16, 698.46]; // F#3, C#4, F#4, G#4, A#4, F5
      chord.forEach((freq, idx) => {
        const delay = idx * 0.065;
        playTone(ctx, filter as unknown as GainNode, freq, 'sine', delay, 2.2 - delay * 0.3, 0.18, undefined, -4);
        playTone(ctx, filter as unknown as GainNode, freq, 'triangle', delay, 1.9 - delay * 0.3, 0.07, undefined, 5);
      });
      // Bell shimmer overtone
      playTone(ctx, master, 1479.98, 'sine', 0.28, 1.35, 0.07);
      playTone(ctx, master, 1108.73, 'sine', 0.42, 1.15, 0.05);
      break;
    }

    case 'login': {
      // Crystalline upward arpeggio
      const notes = [587.33, 739.99, 880.0, 1108.73, 1318.51]; // D5, F#5, A5, C#6, E6
      notes.forEach((freq, idx) => {
        const t = idx * 0.065;
        playTone(ctx, master, freq, 'sine', t, 0.48, 0.16);
        playTone(ctx, master, freq * 2, 'sine', t + 0.01, 0.32, 0.04);
      });
      break;
    }

    case 'shutdown': {
      // Warm descending chord
      const notes = [739.99, 554.37, 466.16, 369.99, 277.18];
      notes.forEach((freq, idx) => {
        const t = idx * 0.11;
        playTone(ctx, master, freq, 'sine', t, 0.65, 0.17);
        playTone(ctx, master, freq * 0.5, 'triangle', t, 0.75, 0.06);
      });
      break;
    }

    case 'click': {
      // Subtle glossy tick
      playTone(ctx, master, 1520, 'sine', 0, 0.028, 0.13, 680);
      playTone(ctx, master, 420, 'triangle', 0, 0.018, 0.06, 220);
      break;
    }

    case 'open': {
      // Airy droplet + glass lift
      playTone(ctx, master, 440, 'sine', 0, 0.14, 0.14, 780);
      playTone(ctx, master, 880, 'sine', 0.035, 0.18, 0.11, 1174);
      break;
    }

    case 'close': {
      // Soft downward velvet drop
      playTone(ctx, master, 620, 'sine', 0, 0.13, 0.14, 290);
      playTone(ctx, master, 310, 'triangle', 0.02, 0.12, 0.06, 175);
      break;
    }

    case 'minimize': {
      // Smooth Aqua genie pitch glide
      playTone(ctx, master, 860, 'sine', 0, 0.16, 0.13, 310);
      playTone(ctx, master, 1290, 'sine', 0.01, 0.12, 0.05, 465);
      break;
    }

    case 'balloon': {
      // Two-note warm marimba chime
      playTone(ctx, master, 783.99, 'sine', 0, 0.22, 0.18); // G5
      playTone(ctx, master, 1567.98, 'sine', 0, 0.09, 0.05);
      playTone(ctx, master, 987.77, 'sine', 0.095, 0.34, 0.2); // B5
      playTone(ctx, master, 1975.53, 'sine', 0.095, 0.12, 0.05);
      break;
    }

    case 'error': {
      // Classic warm Rhodes two-note bonk
      playTone(ctx, master, 196.0, 'triangle', 0, 0.16, 0.24);
      playTone(ctx, master, 277.18, 'sine', 0, 0.16, 0.18);
      playTone(ctx, master, 174.61, 'triangle', 0.11, 0.26, 0.25);
      playTone(ctx, master, 246.94, 'sine', 0.11, 0.26, 0.18);
      break;
    }

    case 'trash': {
      // Crisp noise-filtered paper crumple
      const now = ctx.currentTime;
      const bursts = [0, 0.075, 0.14];
      bursts.forEach((offset, i) => {
        const src = ctx.createBufferSource();
        src.buffer = getNoiseBuffer(ctx);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1900 + i * 550, now + offset);
        bp.Q.setValueAtTime(1.8, now + offset);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, now + offset);
        g.gain.exponentialRampToValueAtTime(0.24 - i * 0.04, now + offset + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.085);
        src.connect(bp);
        bp.connect(g);
        g.connect(master);
        src.start(now + offset);
        src.stop(now + offset + 0.095);
      });
      break;
    }
  }
}
