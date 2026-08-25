"use client";

import { useAppStore } from "./store";

// Sound system using Web Audio API - all sounds synthesized, no external files needed.
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getCtx(): AudioContext | null {
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

type WaveType = "sine" | "triangle" | "square" | "sawtooth";

interface ToneOpts {
  freq: number;
  duration: number;
  type?: WaveType;
  volume?: number;
  attack?: number;
  release?: number;
  detune?: number;
}

function playTone({ freq, duration, type = "sine", volume = 0.3, attack = 0.005, release = 0.1, detune = 0 }: ToneOpts) {
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

function playNoise(duration: number, volume = 0.15, filterFreq = 1000) {
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

// ===== Sound effects =====
export const sfx = {
  click() {
    playTone({ freq: 880, duration: 0.06, type: "sine", volume: 0.18, release: 0.04 });
  },
  hover() {
    playTone({ freq: 1200, duration: 0.04, type: "sine", volume: 0.06, release: 0.03 });
  },
  toggle() {
    playTone({ freq: 660, duration: 0.08, type: "triangle", volume: 0.15 });
    setTimeout(() => playTone({ freq: 990, duration: 0.08, type: "triangle", volume: 0.12 }), 40);
  },
  success() {
    playTone({ freq: 523.25, duration: 0.12, type: "sine", volume: 0.2 });
    setTimeout(() => playTone({ freq: 659.25, duration: 0.12, type: "sine", volume: 0.2 }), 90);
    setTimeout(() => playTone({ freq: 783.99, duration: 0.2, type: "sine", volume: 0.22 }), 180);
  },
  error() {
    playTone({ freq: 220, duration: 0.18, type: "sawtooth", volume: 0.18, release: 0.12 });
    setTimeout(() => playTone({ freq: 180, duration: 0.18, type: "sawtooth", volume: 0.16, release: 0.12 }), 80);
  },
  tick() {
    playTone({ freq: 1500, duration: 0.02, type: "square", volume: 0.05, release: 0.01 });
  },
  correct() {
    playTone({ freq: 880, duration: 0.08, type: "sine", volume: 0.18, release: 0.05 });
    setTimeout(() => playTone({ freq: 1318.5, duration: 0.1, type: "sine", volume: 0.16, release: 0.06 }), 50);
  },
  knobTick() {
    playTone({ freq: 2000, duration: 0.02, type: "sine", volume: 0.08, release: 0.01 });
  },
  // Detent/click sound for knob steps - "段落感"
  detent() {
    playTone({ freq: 1800, duration: 0.025, type: "sine", volume: 0.12, release: 0.015 });
    playNoise(0.02, 0.04, 3000);
  },
  bell() {
    // Singing bowl-like bell
    playTone({ freq: 523.25, duration: 1.8, type: "sine", volume: 0.25, attack: 0.005, release: 1.5 });
    playTone({ freq: 1046.5, duration: 1.5, type: "sine", volume: 0.12, attack: 0.005, release: 1.2 });
    playTone({ freq: 1567.98, duration: 1.2, type: "sine", volume: 0.06, attack: 0.005, release: 1.0 });
  },
  phaseComplete() {
    playTone({ freq: 659.25, duration: 0.15, type: "sine", volume: 0.2 });
    setTimeout(() => playTone({ freq: 880, duration: 0.15, type: "sine", volume: 0.2 }), 120);
    setTimeout(() => playTone({ freq: 1046.5, duration: 0.3, type: "sine", volume: 0.22 }), 240);
  },
  complete() {
    // Celebratory completion chime (ascending arpeggio)
    playTone({ freq: 523.25, duration: 0.15, type: "sine", volume: 0.22 });
    setTimeout(() => playTone({ freq: 659.25, duration: 0.15, type: "sine", volume: 0.22 }), 130);
    setTimeout(() => playTone({ freq: 783.99, duration: 0.15, type: "sine", volume: 0.22 }), 260);
    setTimeout(() => playTone({ freq: 1046.5, duration: 0.4, type: "sine", volume: 0.25 }), 390);
  },
  start() {
    playTone({ freq: 440, duration: 0.1, type: "triangle", volume: 0.18 });
    setTimeout(() => playTone({ freq: 660, duration: 0.15, type: "triangle", volume: 0.2 }), 80);
  },
  countdown() {
    playTone({ freq: 800, duration: 0.08, type: "sine", volume: 0.15 });
  },
  breatheIn() {
    // Gentle rising tone - soft and calming
    const c = getCtx();
    if (!c || !masterGain) return;
    const enabled = useAppStore.getState().soundEnabled;
    if (!enabled) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    // Lower, softer frequency range
    osc.frequency.setValueAtTime(220, c.currentTime);
    osc.frequency.linearRampToValueAtTime(330, c.currentTime + 3.5);
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0.08, c.currentTime + 3);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 4);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(c.currentTime + 4.1);
  },
  breatheOut() {
    // Gentle falling tone - soft and calming
    const c = getCtx();
    if (!c || !masterGain) return;
    const enabled = useAppStore.getState().soundEnabled;
    if (!enabled) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(330, c.currentTime);
    osc.frequency.linearRampToValueAtTime(220, c.currentTime + 3.5);
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0.08, c.currentTime + 3);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 4);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(c.currentTime + 4.1);
  },
  whoosh() {
    playNoise(0.3, 0.08, 800);
  },
  // Aliases for breathIn/breathOut (commonly used naming)
  breathIn() {
    this.breatheIn();
  },
  breathOut() {
    this.breatheOut();
  },
  // Ambient sound generators (return stop functions)
  startAmbient(type: "rain" | "ocean" | "forest" | "fire" | "wind" | "stream" | "night"): () => void {
    const c = getCtx();
    if (!c || !masterGain) return () => {};
    const nodes: { stop: () => void }[] = [];

    const makeNoiseLoop = (filterType: BiquadFilterType, freq: number, q: number, volume: number, lfoFreq?: number) => {
      const bufferSize = c.sampleRate * 2;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = c.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = freq;
      filter.Q.value = q;
      const gain = c.createGain();
      gain.gain.value = volume;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain!);
      noise.start();

      let lfo: OscillatorNode | null = null;
      let lfoGain: GainNode | null = null;
      if (lfoFreq) {
        lfo = c.createOscillator();
        lfo.frequency.value = lfoFreq;
        lfoGain = c.createGain();
        lfoGain.gain.value = volume * 0.5;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
      }
      return {
        stop: () => {
          try { noise.stop(); } catch {}
          try { lfo?.stop(); } catch {}
        },
      };
    };

    const makeTone = (freq: number, volume: number, type: WaveType = "sine", lfoFreq?: number) => {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const gain = c.createGain();
      gain.gain.value = volume;
      osc.connect(gain);
      gain.connect(masterGain!);
      osc.start();
      let lfo: OscillatorNode | null = null;
      let lfoGain: GainNode | null = null;
      if (lfoFreq) {
        lfo = c.createOscillator();
        lfo.frequency.value = lfoFreq;
        lfoGain = c.createGain();
        lfoGain.gain.value = volume * 0.6;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
      }
      return {
        stop: () => {
          try { osc.stop(); } catch {}
          try { lfo?.stop(); } catch {}
        },
      };
    };

    switch (type) {
      case "rain":
        nodes.push(makeNoiseLoop("lowpass", 2200, 0.5, 0.18));
        nodes.push(makeNoiseLoop("highpass", 4000, 0.3, 0.06));
        break;
      case "ocean":
        nodes.push(makeNoiseLoop("lowpass", 600, 0.7, 0.2, 0.15));
        break;
      case "forest":
        nodes.push(makeNoiseLoop("bandpass", 2500, 1, 0.05));
        nodes.push(makeTone(2400, 0.03, "sine", 8));
        nodes.push(makeTone(3100, 0.025, "sine", 11));
        break;
      case "fire":
        nodes.push(makeNoiseLoop("lowpass", 800, 0.8, 0.12, 6));
        nodes.push(makeNoiseLoop("bandpass", 1500, 2, 0.05, 12));
        break;
      case "wind":
        nodes.push(makeNoiseLoop("lowpass", 500, 0.5, 0.15, 0.2));
        break;
      case "stream":
        nodes.push(makeNoiseLoop("bandpass", 1800, 1.5, 0.1, 3));
        nodes.push(makeNoiseLoop("highpass", 3000, 0.5, 0.04));
        break;
      case "night":
        nodes.push(makeTone(1800, 0.04, "sine", 14));
        nodes.push(makeTone(2200, 0.03, "sine", 9));
        nodes.push(makeNoiseLoop("lowpass", 300, 0.5, 0.05));
        break;
    }

    return () => nodes.forEach((n) => n.stop());
  },
  // Light music - simple generative ambient pad
  startMusic(): () => void {
    const c = getCtx();
    if (!c || !masterGain) return () => {};
    const stoppers: (() => void)[] = [];

    // Pentatonic pad chord progression
    const chords = [
      [261.63, 311.13, 392.0],   // C minor-ish
      [233.08, 293.66, 349.23],
      [220.0, 277.18, 329.63],
      [196.0, 246.94, 293.66],
    ];
    let chordIdx = 0;
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    const playChord = () => {
      const chord = chords[chordIdx % chords.length];
      const now = c.currentTime;
      chord.forEach((f, i) => {
        const osc = c.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const g = c.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.04, now + 1.5);
        g.gain.linearRampToValueAtTime(0.04, now + 6);
        g.gain.linearRampToValueAtTime(0, now + 8);
        osc.connect(g);
        g.connect(masterGain!);
        osc.start(now);
        osc.stop(now + 8.1);
        oscs.push(osc);
        gains.push(g);
      });
      // soft melody note
      const melOsc = c.createOscillator();
      melOsc.type = "triangle";
      const melNotes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33];
      melOsc.frequency.setValueAtTime(melNotes[Math.floor(Math.random() * melNotes.length)], now);
      const melGain = c.createGain();
      melGain.gain.setValueAtTime(0, now);
      melGain.gain.linearRampToValueAtTime(0.025, now + 0.3);
      melGain.gain.linearRampToValueAtTime(0, now + 3);
      melOsc.connect(melGain);
      melGain.connect(masterGain!);
      melOsc.start(now);
      melOsc.stop(now + 3.1);
      chordIdx++;
    };

    playChord();
    const interval = setInterval(playChord, 8000);

    return () => {
      clearInterval(interval);
      oscs.forEach((o) => { try { o.stop(); } catch {} });
    };
  },
};

// Initialize audio context on first user interaction
export function initAudio() {
  getCtx();
  syncMasterVolume();
}

// ===== Ambient sound generators (white/pink noise based) =====
function createNoiseBuffer(c: AudioContext, type: "white" | "pink" | "brown"): AudioBuffer {
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
  if (!c || !masterGain) return () => {};
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
  gainNode.connect(masterGain);

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

// Specialized ambient generators
function playAmbientFire(): () => void {
  const c = getCtx();
  if (!c || !masterGain) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const nodes: { stop: () => void }[] = [];
  // Base crackle - brown noise filtered
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
    popGain.connect(masterGain!);
    pop.start(now);
    pop.stop(now + 0.06);
  }, 200 + Math.random() * 400);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
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
  if (!c || !masterGain) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  // Low cricket chirps + ambient hum
  const base = playAmbient({ noise: "brown", filterType: "lowpass", filterFreq: 400, filterQ: 0.5, gain: 0.08 });
  const chirpInterval = setInterval(() => {
    if (!c) return;
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
      g.connect(masterGain!);
      osc.start(t);
      osc.stop(t + 0.025);
    }
  }, 800 + Math.random() * 1200);
  return () => {
    clearInterval(chirpInterval);
    base();
  };
}

function playAmbientBirds(): () => void {
  const c = getCtx();
  if (!c || !masterGain) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  const base = playAmbient({ noise: "pink", filterType: "bandpass", filterFreq: 1500, filterQ: 0.5, gain: 0.06 });
  const birdInterval = setInterval(() => {
    if (!c) return;
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
      g.connect(masterGain!);
      osc.start(t);
      osc.stop(t + 0.11);
    }
  }, 1500 + Math.random() * 2000);
  return () => {
    clearInterval(birdInterval);
    base();
  };
}

function playAmbientCafe(): () => void {
  const c = getCtx();
  if (!c || !masterGain) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  // Murmur of voices + occasional clinks
  const base = playAmbient({ noise: "pink", filterType: "bandpass", filterFreq: 500, filterQ: 0.4, lfoFreq: 0.3, lfoDepth: 200, gain: 0.1 });
  const clinkInterval = setInterval(() => {
    if (!c) return;
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
      g.connect(masterGain!);
      osc.start(now);
      osc.stop(now + 0.31);
    }
  }, 2000 + Math.random() * 3000);
  return () => {
    clearInterval(clinkInterval);
    base();
  };
}

function playAmbientBowl(): () => void {
  const c = getCtx();
  if (!c || !masterGain) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  // Tibetan singing bowl - long sustained resonant tones
  const oscs: OscillatorNode[] = [];
  let stopped = false;
  const playBowl = () => {
    if (stopped || !c) return;
    const now = c.currentTime;
    const baseFreq = [220, 246.94, 261.63, 293.66][Math.floor(Math.random() * 4)];
    // Fundamental + harmonics with slight detune for bowl character
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
      g.connect(masterGain!);
      osc.start(now);
      osc.stop(now + 12.1);
      oscs.push(osc);
    });
  };
  playBowl();
  const interval = setInterval(playBowl, 10000);
  return () => {
    stopped = true;
    clearInterval(interval);
    oscs.forEach((o) => { try { o.stop(); } catch {} });
  };
}

function playAmbientChimes(): () => void {
  const c = getCtx();
  if (!c || !masterGain) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  // Wind chimes - random pentatonic notes
  const oscs: OscillatorNode[] = [];
  let stopped = false;
  const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const playChime = () => {
    if (stopped || !c) return;
    const now = c.currentTime;
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
      g.connect(masterGain!);
      osc.start(t);
      osc.stop(t + 2.1);
      oscs.push(osc);
    }
  };
  playChime();
  const interval = setInterval(playChime, 2500 + Math.random() * 2000);
  return () => {
    stopped = true;
    clearInterval(interval);
    oscs.forEach((o) => { try { o.stop(); } catch {} });
  };
}

function playAmbientThunder(): () => void {
  const c = getCtx();
  if (!c || !masterGain) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  // Rain base + occasional thunder rumbles
  const base = playAmbient({ noise: "white", filterType: "lowpass", filterFreq: 1800, filterQ: 0.7, lfoFreq: 0.15, lfoDepth: 500, gain: 0.16 });
  const thunderInterval = setInterval(() => {
    if (!c) return;
    if (Math.random() < 0.5) {
      const now = c.currentTime;
      // Low rumble
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
      g.connect(masterGain!);
      noise.start(now);
      noise.stop(now + 3.1);
    }
  }, 5000 + Math.random() * 8000);
  return () => {
    clearInterval(thunderInterval);
    base();
  };
}

function playAmbientWhale(): () => void {
  const c = getCtx();
  if (!c || !masterGain) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  // Whale songs - long gliding tones
  const oscs: OscillatorNode[] = [];
  let stopped = false;
  const base = playAmbient({ noise: "brown", filterType: "lowpass", filterFreq: 300, filterQ: 0.5, gain: 0.06 });
  const playWhale = () => {
    if (stopped || !c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = "sine";
    const startFreq = 150 + Math.random() * 100;
    const endFreq = startFreq * (0.5 + Math.random() * 1.5);
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, endFreq), now + 3);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.5);
    g.gain.linearRampToValueAtTime(0.08, now + 2);
    g.gain.linearRampToValueAtTime(0, now + 4);
    osc.connect(g);
    g.connect(masterGain!);
    osc.start(now);
    osc.stop(now + 4.1);
    oscs.push(osc);
  };
  playWhale();
  const interval = setInterval(playWhale, 5000 + Math.random() * 3000);
  return () => {
    stopped = true;
    clearInterval(interval);
    base();
    oscs.forEach((o) => { try { o.stop(); } catch {} });
  };
}

function playAmbientCrystal(): () => void {
  const c = getCtx();
  if (!c || !masterGain) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};
  // Crystal bowl - very high pure tones with long decay
  const oscs: OscillatorNode[] = [];
  let stopped = false;
  const playCrystal = () => {
    if (stopped || !c) return;
    const now = c.currentTime;
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
      g.connect(masterGain!);
      osc.start(now);
      osc.stop(now + 8.1);
      oscs.push(osc);
    });
  };
  playCrystal();
  const interval = setInterval(playCrystal, 6000);
  return () => {
    stopped = true;
    clearInterval(interval);
    oscs.forEach((o) => { try { o.stop(); } catch {} });
  };
}

// ===== Music player (multiple generative tracks - all soothing and calming) =====
export const musicPlayer = {
  // Track 1: Soft piano - gentle pentatonic with warm sine tones
  playPiano(): () => void {
    return playGenerativeMusic({
      chords: [
        [196.0, 246.94, 293.66],  // G major - low and warm
        [174.61, 220.0, 261.63],  // F major
        [164.81, 207.65, 246.94], // E minor
        [146.83, 185.0, 220.0],   // D minor
      ],
      chordInterval: 10000,
      melodyNotes: [392.0, 440.0, 493.88, 587.33, 523.25, 440.0],
      melodyType: "sine" as WaveType,
      chordType: "sine" as WaveType,
      chordGain: 0.025,
      melodyGain: 0.015,
      melodyDuration: 4,
    });
  },
  // Track 2: Zen ambient - deep drone with soft bells
  playZen(): () => void {
    return playGenerativeMusic({
      chords: [
        [98.0, 146.83, 196.0],   // Very low, grounding
        [110.0, 164.81, 220.0],
        [92.5, 138.59, 185.0],
      ],
      chordInterval: 15000,
      melodyNotes: [783.99, 880.0, 987.77],  // Soft high bells
      melodyType: "sine" as WaveType,
      chordType: "sine" as WaveType,
      chordGain: 0.03,
      melodyGain: 0.01,
      melodyDuration: 5,
    });
  },
  // Track 3: Gentle harp - soft plucked arpeggios
  playHarp(): () => void {
    return playGenerativeMusic({
      chords: [
        [196.0, 246.94, 293.66, 392.0],
        [220.0, 277.18, 329.63, 440.0],
        [174.61, 220.0, 261.63, 349.23],
        [164.81, 207.65, 246.94, 329.63],
      ],
      chordInterval: 5000,
      melodyNotes: [523.25, 587.33, 659.25, 523.25],
      melodyType: "sine" as WaveType,
      chordType: "sine" as WaveType,
      chordGain: 0.02,
      melodyGain: 0.015,
      melodyDuration: 2,
      arpeggio: true,
    });
  },
  // Track 4: Bamboo flute - soft breathy melody
  playFlute(): () => void {
    return playGenerativeMusic({
      chords: [
        [146.83, 185.0, 220.0],
        [164.81, 207.65, 246.94],
        [138.59, 174.61, 207.65],
      ],
      chordInterval: 12000,
      melodyNotes: [440.0, 493.88, 587.33, 523.25, 440.0],
      melodyType: "sine" as WaveType,
      chordType: "sine" as WaveType,
      chordGain: 0.025,
      melodyGain: 0.02,
      melodyDuration: 3,
    });
  },
  // Track 5: Warm strings - soft pad with sine waves
  playStrings(): () => void {
    return playGenerativeMusic({
      chords: [
        [196.0, 246.94, 293.66, 392.0],
        [174.61, 220.0, 261.63, 349.23],
        [164.81, 207.65, 246.94, 329.63],
        [146.83, 185.0, 220.0, 293.66],
      ],
      chordInterval: 8000,
      melodyNotes: [392.0, 440.0, 493.88, 440.0],
      melodyType: "sine" as WaveType,
      chordType: "sine" as WaveType,
      chordGain: 0.022,
      melodyGain: 0.012,
      melodyDuration: 3,
    });
  },
  // Track 6: Ambient pad - very soft atmospheric drone
  playPad(): () => void {
    return playGenerativeMusic({
      chords: [
        [98.0, 130.81, 164.81, 196.0],
        [92.5, 123.47, 155.56, 185.0],
        [110.0, 146.83, 174.61, 220.0],
      ],
      chordInterval: 18000,
      melodyNotes: [329.63, 392.0, 440.0],
      melodyType: "sine" as WaveType,
      chordType: "sine" as WaveType,
      chordGain: 0.028,
      melodyGain: 0.008,
      melodyDuration: 6,
    });
  },
  // Default play (backward compat) - piano
  play(): () => void {
    return this.playPiano();
  },
};

interface MusicConfig {
  chords: number[][];
  chordInterval: number;
  melodyNotes: number[];
  melodyType: WaveType;
  chordType: WaveType;
  chordGain: number;
  melodyGain: number;
  melodyDuration: number;
  arpeggio?: boolean;
}

function playGenerativeMusic(config: MusicConfig): () => void {
  const c = getCtx();
  if (!c || !masterGain) return () => {};
  if (!useAppStore.getState().soundEnabled) return () => {};

  let chordIdx = 0;
  const oscs: OscillatorNode[] = [];
  let stopped = false;

  const playChord = () => {
    if (stopped) return;
    const chord = config.chords[chordIdx % config.chords.length];
    const now = c.currentTime;
    chord.forEach((f, i) => {
      const osc = c.createOscillator();
      osc.type = config.chordType;
      osc.frequency.value = f;
      const g = c.createGain();
      const attack = config.arpeggio ? 0.1 + i * 0.15 : 1.5;
      const dur = config.chordInterval / 1000;
      g.gain.setValueAtTime(0, now + (config.arpeggio ? i * 0.15 : 0));
      g.gain.linearRampToValueAtTime(config.chordGain, now + attack);
      g.gain.linearRampToValueAtTime(config.chordGain, now + dur - 2);
      g.gain.linearRampToValueAtTime(0, now + dur);
      osc.connect(g);
      g.connect(masterGain!);
      osc.start(now + (config.arpeggio ? i * 0.15 : 0));
      osc.stop(now + dur + 0.1);
      oscs.push(osc);
    });
    // Melody note
    const melOsc = c.createOscillator();
    melOsc.type = config.melodyType;
    melOsc.frequency.setValueAtTime(config.melodyNotes[Math.floor(Math.random() * config.melodyNotes.length)], now);
    const melGain = c.createGain();
    melGain.gain.setValueAtTime(0, now);
    melGain.gain.linearRampToValueAtTime(config.melodyGain, now + 0.3);
    melGain.gain.linearRampToValueAtTime(0, now + config.melodyDuration);
    melOsc.connect(melGain);
    melGain.connect(masterGain!);
    melOsc.start(now);
    melOsc.stop(now + config.melodyDuration + 0.1);
    oscs.push(melOsc);
    chordIdx++;
  };

  playChord();
  const interval = setInterval(playChord, config.chordInterval);

  return () => {
    stopped = true;
    clearInterval(interval);
    oscs.forEach((o) => { try { o.stop(); } catch {} });
  };
}

// ===== Custom music player (for uploaded audio files) =====
// Uses HTML5 Audio element with separate gain control via Web Audio API
export class CustomMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private url: string | null = null;

  load(url: string, volume: number = 0.5): void {
    this.stop();
    const c = getCtx();
    if (!c || !masterGain) {
      // Fallback to plain audio
      this.audio = new Audio(url);
      this.audio.loop = true;
      this.audio.volume = volume;
      this.url = url;
      return;
    }
    this.audio = new Audio(url);
    this.audio.loop = true;
    this.audio.crossOrigin = "anonymous";
    this.url = url;
    try {
      this.source = c.createMediaElementSource(this.audio);
      this.gainNode = c.createGain();
      this.gainNode.gain.value = volume;
      this.source.connect(this.gainNode);
      this.gainNode.connect(masterGain);
    } catch {
      // Fallback if createMediaElementSource fails
      this.audio.volume = volume;
    }
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    } else if (this.audio) {
      this.audio.volume = volume;
    }
  }

  play(): void {
    if (this.audio) {
      this.audio.play().catch(() => {});
    }
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  cleanup(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    if (this.source) {
      try { this.source.disconnect(); } catch {}
      this.source = null;
    }
    if (this.gainNode) {
      try { this.gainNode.disconnect(); } catch {}
      this.gainNode = null;
    }
    if (this.url) {
      URL.revokeObjectURL(this.url);
      this.url = null;
    }
  }
}
