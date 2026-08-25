"use client";

import { getCtx, getMasterGain, useAppStore, type WaveType } from "./audio-engine";

// Generative music tracks + custom file player. Built on the primitives in
// audio-engine.ts.

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
  const master = getMasterGain();
  if (!c || !master) return () => {};
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
      g.connect(master);
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
    melGain.connect(master);
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
      melodyType: "sine",
      chordType: "sine",
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
      melodyType: "sine",
      chordType: "sine",
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
      melodyType: "sine",
      chordType: "sine",
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
      melodyType: "sine",
      chordType: "sine",
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
      melodyType: "sine",
      chordType: "sine",
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
      melodyType: "sine",
      chordType: "sine",
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
    const master = getMasterGain();
    if (!c || !master) {
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
      this.gainNode.connect(master);
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
