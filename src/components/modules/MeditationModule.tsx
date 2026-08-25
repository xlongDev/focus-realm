"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useT, useSfx, formatTime } from "@/lib/hooks";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  PlayIcon, PauseIcon, ResetIcon, LeafIcon, RainIcon, WaveIcon, WindIcon, FireIcon,
  StreamIcon, NightIcon, BirdIcon, CafeIcon, BowlIcon, ChimeIcon, ThunderIcon,
  WhaleIcon, CrystalIcon, MusicIcon, MeditationIcon, UploadIcon,
  HarpIcon, FluteIcon, StringsIcon, PadIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { ambientSounds, musicPlayer, CustomMusicPlayer } from "@/lib/sound";
import { FloatingOrbs } from "@/components/ui/effects";

interface AmbientDef {
  id: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  labelKey: string;
  color: string;
}

const AMBIENTS: AmbientDef[] = [
  { id: "forest", icon: LeafIcon, labelKey: "med.forest", color: "oklch(0.72 0.16 145)" },
  { id: "rain", icon: RainIcon, labelKey: "med.rain", color: "oklch(0.7 0.16 220)" },
  { id: "ocean", icon: WaveIcon, labelKey: "med.ocean", color: "oklch(0.7 0.16 200)" },
  { id: "wind", icon: WindIcon, labelKey: "med.wind", color: "oklch(0.72 0.16 175)" },
  { id: "fire", icon: FireIcon, labelKey: "med.fire", color: "oklch(0.7 0.18 45)" },
  { id: "stream", icon: StreamIcon, labelKey: "med.stream", color: "oklch(0.7 0.14 200)" },
  { id: "night", icon: NightIcon, labelKey: "med.night", color: "oklch(0.55 0.15 280)" },
  { id: "birds", icon: BirdIcon, labelKey: "med.birds", color: "oklch(0.72 0.16 120)" },
  { id: "cafe", icon: CafeIcon, labelKey: "med.cafe", color: "oklch(0.6 0.12 50)" },
  { id: "bowl", icon: BowlIcon, labelKey: "med.bowl", color: "oklch(0.65 0.12 30)" },
  { id: "chimes", icon: ChimeIcon, labelKey: "med.chimes", color: "oklch(0.7 0.14 90)" },
  { id: "thunder", icon: ThunderIcon, labelKey: "med.thunder", color: "oklch(0.5 0.12 260)" },
  { id: "whale", icon: WhaleIcon, labelKey: "med.whale", color: "oklch(0.6 0.14 210)" },
  { id: "crystal", icon: CrystalIcon, labelKey: "med.crystal", color: "oklch(0.75 0.12 180)" },
];

interface MusicDef {
  id: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  labelKey: string;
  color: string;
}

const MUSIC_TRACKS: MusicDef[] = [
  { id: "none", icon: MusicIcon, labelKey: "med.musicNone", color: "oklch(0.6 0.1 0)" },
  { id: "piano", icon: MusicIcon, labelKey: "med.musicPiano", color: "oklch(0.7 0.14 330)" },
  { id: "zen", icon: BowlIcon, labelKey: "med.musicZen", color: "oklch(0.65 0.12 280)" },
  { id: "harp", icon: HarpIcon, labelKey: "med.musicHarp", color: "oklch(0.7 0.14 145)" },
  { id: "flute", icon: FluteIcon, labelKey: "med.musicFlute", color: "oklch(0.65 0.14 90)" },
  { id: "strings", icon: StringsIcon, labelKey: "med.musicStrings", color: "oklch(0.6 0.16 50)" },
  { id: "pad", icon: PadIcon, labelKey: "med.musicPad", color: "oklch(0.65 0.14 200)" },
];

const DURATIONS = [3, 5, 10, 15, 20, 30, 45, 60];

export function MeditationModule() {
  const t = useT();
  const sfx = useSfx();
  const { addMeditationSession, meditationSessions } = useAppStore();

  const [duration, setDuration] = useState(10);
  const [customDuration, setCustomDuration] = useState(10);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [remaining, setRemaining] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ambient, setAmbient] = useState<string | null>("forest");
  const [musicTrack, setMusicTrack] = useState<string>("none");
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [customMusicUrl, setCustomMusicUrl] = useState<string | null>(null);
  const [customMusicName, setCustomMusicName] = useState<string>("");
  const [knobAngle, setKnobAngle] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastTickAngleRef = useRef(0);
  const rafRef = useRef<number>(0);
  const endTimeRef = useRef<number>(0);
  const pauseRemainingRef = useRef<number>(0);
  const stopAmbientRef = useRef<(() => void) | null>(null);
  const stopMusicRef = useRef<(() => void) | null>(null);
  const customMusicRef = useRef<CustomMusicPlayer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveDuration = useCustomTime ? customDuration : duration;

  // Knob interaction - clock style with detent sound
  const updateFromAngle = useCallback((angle: number) => {
    const normalized = ((angle % 360) + 360) % 360;
    const idx = Math.round(normalized / (360 / DURATIONS.length));
    const realIdx = ((idx % DURATIONS.length) + DURATIONS.length) % DURATIONS.length;
    const newDur = DURATIONS[realIdx];
    const targetAngle = realIdx * (360 / DURATIONS.length);
    if (newDur !== duration) {
      setDuration(newDur);
      sfx.knobTick();
      if (!running) setRemaining(newDur * 60);
    }
    setKnobAngle(targetAngle);
  }, [duration, running, sfx]);

  const handlePointerMove = useCallback((e: PointerEvent | React.PointerEvent) => {
    if (!draggingRef.current || !knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e as PointerEvent).clientX - cx;
    const dy = (e as PointerEvent).clientY - cy;
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    const prev = lastTickAngleRef.current;
    const delta = Math.abs(((angle - prev + 540) % 360) - 180);
    if (delta > 8) {
      sfx.knobTick();
      lastTickAngleRef.current = angle;
    }
    updateFromAngle(angle);
  }, [sfx, updateFromAngle]);

  useEffect(() => {
    const up = () => { draggingRef.current = false; };
    const move = (e: PointerEvent) => handlePointerMove(e);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", move);
    };
  }, [handlePointerMove]);

  // Timer - FIXED: uses real time tracking instead of decrementing per frame
  useEffect(() => {
    if (!running || paused) return;
    const tick = () => {
      const now = Date.now();
      const rem = Math.max(0, Math.round((endTimeRef.current - now) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        setRunning(false);
        setPaused(false);
        sfx.complete();
        addMeditationSession({
          id: crypto.randomUUID(),
          durationSec: effectiveDuration * 60,
          ambient: ambient || "none",
          completedAt: Date.now(),
        });
        toast.success(t("med.complete"));
        if (stopAmbientRef.current) { stopAmbientRef.current(); stopAmbientRef.current = null; }
        if (stopMusicRef.current) { stopMusicRef.current(); stopMusicRef.current = null; }
        if (customMusicRef.current) { customMusicRef.current.stop(); }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, paused, effectiveDuration, ambient, sfx, addMeditationSession, t]);

  // Sync ambient volume
  const applyAmbientVolume = useCallback((vol: number) => {
    // Ambient sounds use masterGain which is controlled globally
    // For per-track volume, we'd need to refactor; for now master volume suffices
  }, []);

  // Start/stop ambient sound
  useEffect(() => {
    if (!running || !ambient) return;
    const fn = (ambientSounds as any)[ambient];
    if (fn) {
      stopAmbientRef.current = fn();
    }
    return () => {
      if (stopAmbientRef.current) { stopAmbientRef.current(); stopAmbientRef.current = null; }
    };
  }, [running, ambient]);

  // Start/stop music
  useEffect(() => {
    if (!running) return;
    if (musicTrack === "none") {
      if (stopMusicRef.current) { stopMusicRef.current(); stopMusicRef.current = null; }
      if (customMusicRef.current) { customMusicRef.current.stop(); }
      return;
    }
    if (musicTrack === "custom" && customMusicUrl) {
      if (!customMusicRef.current) customMusicRef.current = new CustomMusicPlayer();
      customMusicRef.current.load(customMusicUrl, musicVolume);
      customMusicRef.current.play();
      return () => { if (customMusicRef.current) customMusicRef.current.stop(); };
    }
    if (musicTrack !== "custom") {
      const fn = (musicPlayer as any)[`play${musicTrack.charAt(0).toUpperCase()}${musicTrack.slice(1)}`];
      if (fn) {
        stopMusicRef.current = fn();
      }
      return () => {
        if (stopMusicRef.current) { stopMusicRef.current(); stopMusicRef.current = null; }
      };
    }
  }, [running, musicTrack, customMusicUrl, musicVolume]);

  // Update custom music volume
  useEffect(() => {
    if (customMusicRef.current) {
      customMusicRef.current.setVolume(musicVolume);
    }
  }, [musicVolume]);

  const handleStart = () => {
    if (running) return;
    sfx.start();
    const dur = effectiveDuration;
    setRemaining(dur * 60);
    endTimeRef.current = Date.now() + dur * 60 * 1000;
    setRunning(true);
    setPaused(false);
  };

  const handlePause = () => {
    if (!running) return;
    setPaused(true);
    pauseRemainingRef.current = remaining;
    if (stopAmbientRef.current) { stopAmbientRef.current(); stopAmbientRef.current = null; }
    if (stopMusicRef.current) { stopMusicRef.current(); stopMusicRef.current = null; }
    if (customMusicRef.current) { customMusicRef.current.pause(); }
    sfx.click();
  };

  const handleResume = () => {
    if (!running || !paused) return;
    setPaused(false);
    endTimeRef.current = Date.now() + pauseRemainingRef.current * 1000;
    sfx.click();
  };

  const handleStop = () => {
    setRunning(false);
    setPaused(false);
    setRemaining(effectiveDuration * 60);
    if (stopAmbientRef.current) { stopAmbientRef.current(); stopAmbientRef.current = null; }
    if (stopMusicRef.current) { stopMusicRef.current(); stopMusicRef.current = null; }
    if (customMusicRef.current) { customMusicRef.current.stop(); }
    sfx.click();
  };

  const handleUploadMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error(t("med.uploadHint"));
      return;
    }
    const url = URL.createObjectURL(file);
    setCustomMusicUrl(url);
    setCustomMusicName(file.name);
    setMusicTrack("custom");
    toast.success(t("med.customMusic") + ": " + file.name);
    sfx.complete();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stopAmbientRef.current) stopAmbientRef.current();
      if (stopMusicRef.current) stopMusicRef.current();
      if (customMusicRef.current) customMusicRef.current.cleanup();
      if (customMusicUrl) URL.revokeObjectURL(customMusicUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = 1 - remaining / (effectiveDuration * 60);
  const totalSessions = meditationSessions.length;
  const totalMinutes = meditationSessions.reduce((s, m) => s + Math.round(m.durationSec / 60), 0);

  return (
    <div className="space-y-6">
      <ModuleHeaderLocal
        title={t("med.title")}
        desc={t("med.desc")}
        icon={<MeditationIcon className="w-5 h-5" />}
        accent="linear-gradient(135deg, oklch(0.65 0.2 330), oklch(0.7 0.15 145))"
      />

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Main meditation area */}
        <GlassCard className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden" glow>
          <FloatingOrbs count={6} active={running} />

          {/* Clock-style knob with breathing halo centered behind it */}
          <div className="relative z-10 mb-4 flex items-center justify-center">
            {/* Breathing guide animation - centered behind knob */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="rounded-full"
                animate={running && !paused ? { scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2] } : { scale: 1, opacity: 0.12 }}
                transition={running && !paused ? { duration: 8, repeat: Infinity, ease: "easeInOut" } : {}}
                style={{
                  width: 240,
                  height: 240,
                  background: "radial-gradient(circle, var(--primary), transparent 70%)",
                }}
              />
              <motion.div
                className="absolute rounded-full border-2"
                animate={running && !paused ? { scale: [1, 1.3, 1], opacity: [0.3, 0.06, 0.3] } : { scale: 1, opacity: 0.15 }}
                transition={running && !paused ? { duration: 8, repeat: Infinity, ease: "easeInOut" } : {}}
                style={{ width: 200, height: 200, borderColor: "var(--primary)" }}
              />
            </div>

            <div
              ref={knobRef}
              onPointerDown={(e) => { draggingRef.current = true; handlePointerMove(e); }}
              className="relative w-44 h-44 rounded-full cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: "none" }}
            >
              {/* Progress ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground/10" />
                <motion.circle
                  cx="100" cy="100" r="92" fill="none" stroke="var(--primary)" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 92}
                  animate={{ strokeDashoffset: 2 * Math.PI * 92 * (1 - progress) }}
                  transition={{ duration: 0.3 }}
                />
              </svg>
              <div className="absolute inset-3 rounded-full glass-strong glass-sheen flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold tabular-nums gradient-text">{formatTime(remaining)}</div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">{t("med.duration")}</div>
                </div>
              </div>
              {/* Handle */}
              <div
                className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-7 rounded-full bg-primary shadow-lg"
                style={{
                  transformOrigin: "50% 87px",
                  transform: `translateX(-50%) rotate(${knobAngle}deg)`,
                }}
              />
              {/* Tick marks */}
              {DURATIONS.map((d, i) => {
                const a = i * (360 / DURATIONS.length);
                return (
                  <div
                    key={d}
                    className="absolute left-1/2 top-1 text-[9px] font-medium text-muted-foreground"
                    style={{
                      transformOrigin: "0 87px",
                      transform: `rotate(${a}deg) translateY(0) translateX(-50%)`,
                    }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 z-10">
            {!running ? (
              <Button onClick={handleStart} className="rounded-full px-6 gap-2 shadow-lg">
                <PlayIcon className="w-4 h-4" /> {t("med.begin")}
              </Button>
            ) : paused ? (
              <Button onClick={handleResume} className="rounded-full px-6 gap-2 shadow-lg">
                <PlayIcon className="w-4 h-4" /> {t("common.resume")}
              </Button>
            ) : (
              <Button onClick={handlePause} variant="outline" className="rounded-full px-6 gap-2">
                <PauseIcon className="w-4 h-4" /> {t("common.pause")}
              </Button>
            )}
            {running && (
              <Button onClick={handleStop} variant="outline" className="rounded-full px-5 gap-1.5">
                <ResetIcon className="w-4 h-4" /> {t("common.stop")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3 z-10">{t("med.dragKnob")}</p>
        </GlassCard>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Ambient sounds */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <LeafIcon className="w-4 h-4 text-primary" /> {t("med.ambient")}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {AMBIENTS.map((a) => {
                const Icon = a.icon;
                const isActive = ambient === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => { sfx.click(); setAmbient(isActive ? null : a.id); }}
                    onMouseEnter={() => sfx.hover()}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all",
                      isActive ? "shadow-lg scale-105" : "glass glass-sheen hover:scale-105"
                    )}
                    style={isActive ? { background: a.color, color: "white" } : {}}
                    title={t(a.labelKey)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[9px] font-medium leading-tight text-center px-0.5">{t(a.labelKey)}</span>
                  </button>
                );
              })}
            </div>
            {/* Ambient volume */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">{t("med.ambientVolume")}</span>
                <span className="text-xs font-bold tabular-nums">{Math.round(ambientVolume * 100)}%</span>
              </div>
              <Slider value={[ambientVolume]} min={0} max={1} step={0.05} onValueChange={(v) => setAmbientVolume(v[0])} />
            </div>
          </GlassCard>

          {/* Music tracks */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <MusicIcon className="w-4 h-4 text-primary" /> {t("med.lightMusic")}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {MUSIC_TRACKS.map((m) => {
                const Icon = m.icon;
                const isActive = musicTrack === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { sfx.click(); setMusicTrack(m.id); }}
                    onMouseEnter={() => sfx.hover()}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all",
                      isActive ? "shadow-lg scale-105" : "glass glass-sheen hover:scale-105"
                    )}
                    style={isActive ? { background: m.color, color: "white" } : {}}
                    title={t(m.labelKey)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[9px] font-medium leading-tight text-center px-0.5">{t(m.labelKey)}</span>
                  </button>
                );
              })}
            </div>
            {/* Custom music upload */}
            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleUploadMusic}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={() => sfx.hover()}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  musicTrack === "custom" ? "bg-primary/15 text-primary" : "glass glass-sheen hover:scale-[1.02]"
                )}
              >
                <UploadIcon className="w-4 h-4" />
                <span className="flex-1 text-left truncate">
                  {customMusicName || t("med.uploadMusic")}
                </span>
              </button>
              <p className="text-[10px] text-muted-foreground mt-1">{t("med.uploadHint")}</p>
            </div>
            {/* Music volume */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">{t("med.musicVolume")}</span>
                <span className="text-xs font-bold tabular-nums">{Math.round(musicVolume * 100)}%</span>
              </div>
              <Slider value={[musicVolume]} min={0} max={1} step={0.05} onValueChange={(v) => setMusicVolume(v[0])} />
            </div>
          </GlassCard>

          {/* Duration settings */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-3">{t("med.quickSet")}</h3>
            {/* Custom time toggle */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/30">
              <div>
                <div className="text-sm font-medium">{t("med.customDuration")}</div>
                <div className="text-[10px] text-muted-foreground">{t("med.customDurationHint")}</div>
              </div>
              <button
                onClick={() => { sfx.click(); setUseCustomTime(!useCustomTime); if (!running) setRemaining((useCustomTime ? duration : customDuration) * 60); }}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative",
                  useCustomTime ? "bg-primary" : "bg-foreground/20"
                )}
              >
                <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform", useCustomTime ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
            {useCustomTime ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t("med.customDuration")}</span>
                  <span className="text-sm font-bold text-primary tabular-nums">{customDuration}{t("common.minutes")}</span>
                </div>
                <Slider value={[customDuration]} min={1} max={120} step={1} onValueChange={(v) => { setCustomDuration(v[0]); if (!running) setRemaining(v[0] * 60); }} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => { sfx.knobTick(); setDuration(d); if (!running) setRemaining(d * 60); const idx = DURATIONS.indexOf(d); setKnobAngle(idx * (360 / DURATIONS.length)); }}
                    onMouseEnter={() => sfx.hover()}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      duration === d ? "bg-primary text-primary-foreground shadow-lg scale-105" : "glass glass-sheen text-foreground/70 hover:text-foreground"
                    )}
                  >
                    {d}{t("common.minutes")}
                  </button>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Stats */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <MusicIcon className="w-4 h-4 text-primary" /> {t("med.sessionEnd")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl glass">
                <div className="text-2xl font-bold tabular-nums gradient-text">{totalSessions}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("home.statSessions")}</div>
              </div>
              <div className="text-center p-3 rounded-xl glass">
                <div className="text-2xl font-bold tabular-nums gradient-text">{totalMinutes}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("home.statMinutes")}</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function ModuleHeaderLocal({ title, desc, icon, accent }: { title: string; desc: string; icon: React.ReactNode; accent?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: accent || "linear-gradient(135deg, var(--primary), var(--glow))" }}>
        {icon}
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{desc}</p>
      </div>
    </motion.div>
  );
}
