"use client";

import { getCtx, getMasterGain, useAppStore, playTone, playNoise, type WaveType } from "./audio-engine";

// One-shot UI sounds, breath cues and light generative ambients/music.
// All synthesis is delegated to the primitives in audio-engine.ts.
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
    const master = getMasterGain();
    if (!c || !master) return;
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
    gain.connect(master);
    osc.start();
    osc.stop(c.currentTime + 4.1);
  },
  breatheOut() {
    // Gentle falling tone - soft and calming
    const c = getCtx();
    const master = getMasterGain();
    if (!c || !master) return;
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
    gain.connect(master);
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
    const master = getMasterGain();
    if (!c || !master) return () => {};
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
      gain.connect(master);
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
      gain.connect(master);
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
    const master = getMasterGain();
    if (!c || !master) return () => {};
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
        g.connect(master);
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
      melGain.connect(master);
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
