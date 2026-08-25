"use client";

import { useAppStore } from "./store";

// Re-exported so the audio sub-modules can import it from one place.
export { useAppStore } from "./store";

// Core Web Audio singleton + reusable tone/noise primitives.
// Everything else (sfx, ambient, music) is built on top of these.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

export function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function syncMasterVolume() {
  if (masterGain) {
    const vol = useAppStore.getState().masterVolume;
    masterGain.gain.value = vol;
  }
}

// Live accessor for the shared master gain node (created lazily by getCtx).
export function getMasterGain(): GainNode | null {
  return masterGain;
}

export function initAudio() {
  getCtx();
  syncMasterVolume();
}

export type WaveType = "sine" | "triangle" | "square" | "sawtooth";

export interface ToneOpts {
  freq: number;
  duration: number;
  type?: WaveType;
  volume?: number;
  attack?: number;
  release?: number;
  detune?: number;
}

export function playTone({ freq, duration, type = "sine", volume = 0.3, attack = 0.005, release = 0.1, detune = 0 }: ToneOpts) {
  const c = getCtx();
  if (!c || !masterGain) return;
  const enabled = useAppStore.getState().soundEnabled;
  if (!enabled) return;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  osc.connect(gain);
  gain.connect(masterGain);

  const now = c.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(volume * 0.7, now + duration - release);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.start(now);
  osc.stop(now + duration + 0.05);
}

export function playNoise(duration: number, volume = 0.15, filterFreq = 1000) {
  const c = getCtx();
  if (!c || !masterGain) return;
  const enabled = useAppStore.getState().soundEnabled;
  if (!enabled) return;

  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  const now = c.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(now);
  noise.stop(now + duration);
}

// Generate a looping noise buffer of the given colour.
export function createNoiseBuffer(c: AudioContext, type: "white" | "pink" | "brown"): AudioBuffer {
  const bufferSize = c.sampleRate * 2;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === "pink") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
  }
  return buffer;
}
