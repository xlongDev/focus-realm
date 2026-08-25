"use client";

import { getCtx, getMasterGain, createNoiseBuffer, useAppStore } from "./audio-engine";

// Ambient noise generators (return a stop function). Built on the tone/noise
// primitives in audio-engine.ts.

function playAmbient(config: {
  noise: "white" | "pink" | "brown";
  filterType: BiquadFilterType;
  filterFreq: number;
  filterQ?: number;
  lfoFreq?: number;
  lfoDepth?: number;
  gain: number;
}): () => void {
  const c = getCtx();
  const master = getMasterGain();
  if (!c || !master) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};

  const source = c.createBufferSource();
  source.buffer = createNoiseBuffer(c, config.noise);
  source.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = config.filterType;
  filter.frequency.value = config.filterFreq;
  filter.Q.value = config.filterQ ?? 1;

  const gainNode = c.createGain();
  gainNode.gain.value = 0;
  gainNode.gain.linearRampToValueAtTime(config.gain, c.currentTime + 0.5);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(master);

  // Optional LFO for modulation
  let lfo: OscillatorNode | null = null;
  let lfoGain: GainNode | null = null;
  if (config.lfoFreq) {
    lfo = c.createOscillator();
    lfo.frequency.value = config.lfoFreq;
    lfoGain = c.createGain();
    lfoGain.gain.value = config.lfoDepth ?? 100;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  }

  source.start();

  return () => {
    const now = c.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    setTimeout(() => {
      try { source.stop(); } catch {}
      try { lfo?.stop(); } catch {}
    }, 400);
  };
}

// Recurring scheduler: fire `playOnce(now, track)` immediately, then every
// `period` ms. Tracks created source nodes so stop() hard-kills everything for
// instant silence. Shared by self-contained loop generators (bowl/chimes/...).
function scheduleRecurring(
  c: AudioContext,
  playOnce: (now: number, track: (n: AudioScheduledSourceNode) => void) => void,
  period: number,
): () => void {
  const nodes: AudioScheduledSourceNode[] = [];
  let stopped = false;
  const tick = () => {
    if (stopped || !c) return;
    playOnce(c.currentTime, (n) => nodes.push(n));
  };
  tick();
  const interval = setInterval(tick, period);
  return () => {
    stopped = true;
    clearInterval(interval);
    nodes.forEach((n) => { try { n.stop(); } catch {} });
  };
}

// Continuous base bed (noise) + repeating interval callback. stop() clears both.
// Shared by base+event generators (night/birds/cafe/thunder).
function runWithBase(base: () => void, tick: () => void, period: number): () => void {
  const interval = setInterval(tick, period);
  return () => { clearInterval(interval); base(); };
}

export const ambientSounds = {
  forest: () => playAmbient({ noise: "pink", filterType: "bandpass", filterFreq: 800, filterQ: 0.5, lfoFreq: 0.3, lfoDepth: 300, gain: 0.12 }),
  rain: () => playAmbient({ noise: "white", filterType: "lowpass", filterFreq: 2200, filterQ: 0.7, lfoFreq: 0.15, lfoDepth: 500, gain: 0.18 }),
  ocean: () => playAmbient({ noise: "brown", filterType: "lowpass", filterFreq: 600, filterQ: 0.5, lfoFreq: 0.08, lfoDepth: 200, gain: 0.25 }),
  wind: () => playAmbient({ noise: "pink", filterType: "bandpass", filterFreq: 500, filterQ: 1.5, lfoFreq: 0.2, lfoDepth: 400, gain: 0.15 }),
  fire: () => playAmbientFire(),
  stream: () => playAmbient({ noise: "white", filterType: "bandpass", filterFreq: 1200, filterQ: 0.8, lfoFreq: 0.5, lfoDepth: 600, gain: 0.14 }),
  night: () => playAmbientNight(),
  birds: () => playAmbientBirds(),
  cafe: () => playAmbientCafe(),
  bowl: () => playAmbientBowl(),
  chimes: () => playAmbientChimes(),
  thunder: () => playAmbientThunder(),
  whale: () => playAmbientWhale(),
  crystal: () => playAmbientCrystal(),
};

// ===== Specialized ambient generators =====
function playAmbientFire(): () => void {
  const c = getCtx();
  const master = getMasterGain();
  if (!c || !master) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const bufferSize = c.sampleRate * 2;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1000;
  filter.Q.value = 0.5;
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.5);
  // Random crackle pops
  const crackleInterval = setInterval(() => {
    if (!c) return;
    const pop = c.createOscillator();
    pop.type = "square";
    pop.frequency.value = 200 + Math.random() * 400;
    const popGain = c.createGain();
    const now = c.currentTime;
    popGain.gain.setValueAtTime(0, now);
    popGain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.03, now + 0.005);
    popGain.gain.linearRampToValueAtTime(0, now + 0.05);
    pop.connect(popGain);
    popGain.connect(master);
    pop.start(now);
    pop.stop(now + 0.06);
  }, 200 + Math.random() * 400);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  noise.start();
  return () => {
    const now = c.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    clearInterval(crackleInterval);
    setTimeout(() => { try { noise.stop(); } catch {} }, 400);
  };
}

function playAmbientNight(): () => void {
  const c = getCtx();
  const master = getMasterGain();
  if (!c || !master) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const base = playAmbient({ noise: "brown", filterType: "lowpass", filterFreq: 400, filterQ: 0.5, gain: 0.08 });
  return runWithBase(base, () => {
    const now = c.currentTime;
    const chirpCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < chirpCount; i++) {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 4000 + Math.random() * 2000;
      const g = c.createGain();
      const t = now + i * 0.04;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.015, t + 0.005);
      g.gain.linearRampToValueAtTime(0, t + 0.02);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 0.025);
    }
  }, 800 + Math.random() * 1200);
}

function playAmbientBirds(): () => void {
  const c = getCtx();
  const master = getMasterGain();
  if (!c || !master) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const base = playAmbient({ noise: "pink", filterType: "bandpass", filterFreq: 1500, filterQ: 0.5, gain: 0.06 });
  return runWithBase(base, () => {
    const now = c.currentTime;
    const noteCount = 2 + Math.floor(Math.random() * 4);
    const baseFreq = 2000 + Math.random() * 2000;
    for (let i = 0; i < noteCount; i++) {
      const osc = c.createOscillator();
      osc.type = "sine";
      const t = now + i * 0.12;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * (0.8 + Math.random() * 0.4), t + 0.08);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.025, t + 0.01);
      g.gain.linearRampToValueAtTime(0, t + 0.1);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 0.11);
    }
  }, 1500 + Math.random() * 2000);
}

function playAmbientCafe(): () => void {
  const c = getCtx();
  const master = getMasterGain();
  if (!c || !master) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const base = playAmbient({ noise: "pink", filterType: "bandpass", filterFreq: 500, filterQ: 0.4, lfoFreq: 0.3, lfoDepth: 200, gain: 0.1 });
  return runWithBase(base, () => {
    if (Math.random() < 0.4) {
      const now = c.currentTime;
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 1500 + Math.random() * 2000;
      const g = c.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.02, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 0.31);
    }
  }, 2000 + Math.random() * 3000);
}

function playAmbientBowl(): () => void {
  const c = getCtx();
  const master = getMasterGain();
  if (!c || !master) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const playBowl = (now: number, track: (n: AudioScheduledSourceNode) => void) => {
    const baseFreq = [220, 246.94, 261.63, 293.66][Math.floor(Math.random() * 4)];
    [1, 2.76, 5.4].forEach((mult, i) => {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = baseFreq * mult;
      osc.detune.value = (Math.random() - 0.5) * 8;
      const g = c.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.06 / (i + 1), now + 0.8);
      g.gain.linearRampToValueAtTime(0.06 / (i + 1), now + 6);
      g.gain.exponentialRampToValueAtTime(0.001, now + 12);
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 12.1);
      track(osc);
    });
  };
  return scheduleRecurring(c, playBowl, 10000);
}

function playAmbientChimes(): () => void {
  const c = getCtx();
  const master = getMasterGain();
  if (!c || !master) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const playChime = (now: number, track: (n: AudioScheduledSourceNode) => void) => {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
      const g = c.createGain();
      const t = now + i * (0.15 + Math.random() * 0.2);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 2.1);
      track(osc);
    }
  };
  return scheduleRecurring(c, playChime, 2500 + Math.random() * 2000);
}

function playAmbientThunder(): () => void {
  const c = getCtx();
  const master = getMasterGain();
  if (!c || !master) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const base = playAmbient({ noise: "white", filterType: "lowpass", filterFreq: 1800, filterQ: 0.7, lfoFreq: 0.15, lfoDepth: 500, gain: 0.16 });
  return runWithBase(base, () => {
    if (Math.random() < 0.5) {
      const now = c.currentTime;
      const bufferSize = c.sampleRate * 3;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 1.5));
      const noise = c.createBufferSource();
      noise.buffer = buffer;
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 200;
      const g = c.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.25, now + 0.1);
      g.gain.linearRampToValueAtTime(0.15, now + 0.5);
      g.gain.linearRampToValueAtTime(0, now + 3);
      noise.connect(filter);
      filter.connect(g);
      g.connect(master);
      noise.start(now);
      noise.stop(now + 3.1);
    }
  }, 5000 + Math.random() * 8000);
}

function playAmbientWhale(): () => void {
  const c = getCtx();
  const master = getMasterGain();
  if (!c || !master) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const base = playAmbient({ noise: "brown", filterType: "lowpass", filterFreq: 300, filterQ: 0.5, gain: 0.06 });
  const playWhale = (now: number, track: (n: AudioScheduledSourceNode) => void) => {
    const startFreq = 150 + Math.random() * 100;
    const endFreq = startFreq * (0.5 + Math.random() * 1.5);
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, endFreq), now + 3);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.5);
    g.gain.linearRampToValueAtTime(0.08, now + 2);
    g.gain.linearRampToValueAtTime(0, now + 4);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 4.1);
    track(osc);
  };
  const stopGlides = scheduleRecurring(c, playWhale, 5000 + Math.random() * 3000);
  return () => { stopGlides(); base(); };
}

function playAmbientCrystal(): () => void {
  const c = getCtx();
  const master = getMasterGain();
  if (!c || !master) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const playCrystal = (now: number, track: (n: AudioScheduledSourceNode) => void) => {
    const freqs = [1046.5, 1318.5, 1568.0, 2093.0];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    [1, 2].forEach((mult) => {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f * mult;
      const g = c.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.04 / mult, now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, now + 8);
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 8.1);
      track(osc);
    });
  };
  return scheduleRecurring(c, playCrystal, 6000);
}
