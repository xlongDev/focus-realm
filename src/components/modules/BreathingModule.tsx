"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useT, useSfx, formatTime } from "@/lib/hooks";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  PlayIcon, PauseIcon, ResetIcon, BreathingIcon, WindIcon, StatsIcon,
  MusicIcon, UploadIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { FloatingOrbs, ConfettiBurst } from "@/components/ui/effects";
import { musicPlayer, CustomMusicPlayer } from "@/lib/sound";

interface BreathPattern {
  id: string;
  name: string;
  desc: string;
  phases: { name: string; sec: number }[];
  color: string;
}

const PATTERNS: BreathPattern[] = [
  {
    id: "478",
    name: "4-7-8",
    desc: "吸气4秒 · 屏息7秒 · 呼气8秒",
    phases: [
      { name: "inhale", sec: 4 },
      { name: "hold", sec: 7 },
      { name: "exhale", sec: 8 },
    ],
    color: "oklch(0.72 0.16 175)",
  },
  {
    id: "box",
    name: "Box",
    desc: "吸气4秒 · 屏息4秒 · 呼气4秒 · 屏息4秒",
    phases: [
      { name: "inhale", sec: 4 },
      { name: "hold", sec: 4 },
      { name: "exhale", sec: 4 },
      { name: "hold", sec: 4 },
    ],
    color: "oklch(0.7 0.16 145)",
  },
  {
    id: "coherent",
    name: "Coherent",
    desc: "吸气5秒 · 呼气5秒",
    phases: [
      { name: "inhale", sec: 5 },
      { name: "exhale", sec: 5 },
    ],
    color: "oklch(0.7 0.16 60)",
  },
  {
    id: "custom",
    name: "Custom",
    desc: "自定义呼吸节奏",
    phases: [
      { name: "inhale", sec: 4 },
      { name: "hold", sec: 2 },
      { name: "exhale", sec: 6 },
    ],
    color: "oklch(0.65 0.2 330)",
  },
];

const PHASE_LABELS: Record<string, { zh: string; en: string }> = {
  inhale: { zh: "吸气", en: "Inhale" },
  hold: { zh: "屏息", en: "Hold" },
  exhale: { zh: "呼气", en: "Exhale" },
};

// Web Speech API - real human voice guidance for breathing
let currentUtterance: SpeechSynthesisUtterance | null = null;

function speakPhase(phase: string, locale: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  const text = PHASE_LABELS[phase]?.[locale as "zh" | "en"] || phase;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale === "zh" ? "zh-CN" : "en-US";
  utterance.rate = 0.8;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;
  // Try to find a suitable voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find((v) =>
    locale === "zh" ? v.lang.startsWith("zh") : v.lang.startsWith("en")
  );
  if (preferredVoice) utterance.voice = preferredVoice;
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function BreathingModule() {
  const t = useT();
  const sfx = useSfx();
  const { locale, addBreathingSession, breathingSessions } = useAppStore();

  const [patternId, setPatternId] = useState("478");
  const [customInhale, setCustomInhale] = useState(4);
  const [customHold, setCustomHold] = useState(2);
  const [customExhale, setCustomExhale] = useState(6);
  const [targetCycles, setTargetCycles] = useState(8);
  const [soundGuide, setSoundGuide] = useState(true);
  const [musicTrack, setMusicTrack] = useState<string>("none");
  const [musicVolume, setMusicVolume] = useState(40);
  const [customMusicUrl, setCustomMusicUrl] = useState<string | null>(null);
  const [customMusicName, setCustomMusicName] = useState<string>("");

  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [finished, setFinished] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const rafRef = useRef<number>(0);
  const phaseStartRef = useRef(0);
  const phaseIdxRef = useRef(0);
  const cycleRef = useRef(0);
  const stopMusicRef = useRef<(() => void) | null>(null);
  const customMusicRef = useRef<CustomMusicPlayer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pattern = PATTERNS.find((p) => p.id === patternId)!;
  const phases = pattern.id === "custom"
    ? [
        { name: "inhale", sec: customInhale },
        { name: "hold", sec: customHold },
        { name: "exhale", sec: customExhale },
      ]
    : pattern.phases;

  const currentPhase = phases[phaseIdx];
  const phaseProgress = currentPhase ? Math.min(1, phaseElapsed / currentPhase.sec) : 0;

  // Circle scale based on phase - smooth interpolation
  const circleScale = (() => {
    if (!running || !currentPhase) return 1;
    if (currentPhase.name === "inhale") {
      // Smooth ease-in from 0.5 to 1.3
      const eased = 0.5 * (1 - Math.cos(Math.PI * phaseProgress));
      return 0.5 + eased * 0.8;
    }
    if (currentPhase.name === "exhale") {
      // Smooth ease-out from 1.3 to 0.5
      const eased = 0.5 * (1 - Math.cos(Math.PI * phaseProgress));
      return 1.3 - eased * 0.8;
    }
    // Hold phase: determine if holding after inhale (large) or after exhale (small)
    const prevPhase = phases[(phaseIdx - 1 + phases.length) % phases.length];
    return prevPhase.name === "inhale" ? 1.3 : 0.5;
  })();

  // Keep refs in sync
  phaseIdxRef.current = phaseIdx;
  cycleRef.current = cycle;

  useEffect(() => {
    if (!running) return;
    phaseStartRef.current = Date.now();
    phaseIdxRef.current = 0;
    cycleRef.current = 0;
    setPhaseIdx(0);
    setPhaseElapsed(0);
    setCycle(0);
    // Voice guidance for initial inhale
    if (soundGuide) speakPhase("inhale", locale);

    const tick = () => {
      const elapsed = (Date.now() - phaseStartRef.current) / 1000;
      setPhaseElapsed(elapsed);
      const curPhaseIdx = phaseIdxRef.current;
      const cur = phases[curPhaseIdx];
      if (elapsed >= cur.sec) {
        // next phase
        const nextIdx = (curPhaseIdx + 1) % phases.length;
        if (nextIdx === 0) {
          // completed a cycle
          const newCycle = cycleRef.current + 1;
          cycleRef.current = newCycle;
          setCycle(newCycle);
          if (newCycle >= targetCycles) {
            // finished
            setRunning(false);
            setFinished(true);
            setCelebrate((c) => c + 1);
            sfx.success();
            const totalSec = phases.reduce((s, p) => s + p.sec, 0) * targetCycles;
            addBreathingSession({ id: crypto.randomUUID(), pattern: pattern.name, cycles: targetCycles, totalSec, createdAt: Date.now() });
            toast.success(t("breath.complete"));
            return;
          }
        }
        phaseIdxRef.current = nextIdx;
        setPhaseIdx(nextIdx);
        phaseStartRef.current = Date.now();
        setPhaseElapsed(0);
        const nextPhase = phases[nextIdx];
        if (soundGuide) {
          speakPhase(nextPhase.name, locale);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running]); // Only restart when running changes

  const togglePlay = () => {
    if (running) {
      setRunning(false);
      sfx.click();
      stopMusic();
      stopSpeech();
    } else {
      if (finished) {
        setFinished(false);
        setPhaseIdx(0);
        setPhaseElapsed(0);
        setCycle(0);
      }
      setRunning(true);
      sfx.start();
      startMusic();
    }
  };

  const reset = () => {
    setRunning(false);
    setPhaseIdx(0);
    setPhaseElapsed(0);
    setCycle(0);
    setFinished(false);
    sfx.click();
    stopMusic();
    stopSpeech();
  };

  const startMusic = () => {
    stopMusic();
    if (musicTrack === "none") return;
    if (musicTrack === "custom") {
      if (customMusicUrl) {
        if (!customMusicRef.current) customMusicRef.current = new CustomMusicPlayer();
        customMusicRef.current.load(customMusicUrl, musicVolume / 100);
        customMusicRef.current.play();
      }
    } else {
      const player = musicPlayer[musicTrack as keyof typeof musicPlayer];
      if (player) stopMusicRef.current = player();
    }
  };

  const stopMusic = () => {
    if (stopMusicRef.current) { stopMusicRef.current(); stopMusicRef.current = null; }
    if (customMusicRef.current) { customMusicRef.current.stop(); }
  };

  const handleMusicTrackChange = (track: string) => {
    sfx.click();
    setMusicTrack(track);
    if (running) {
      stopMusic();
      // Start new track after state update
      setTimeout(() => {
        if (track !== "none") {
          if (track === "custom") {
            if (customMusicUrl) {
              if (!customMusicRef.current) customMusicRef.current = new CustomMusicPlayer();
              customMusicRef.current.load(customMusicUrl, musicVolume / 100);
              customMusicRef.current.play();
            }
          } else {
            const player = musicPlayer[track as keyof typeof musicPlayer];
            if (player) stopMusicRef.current = player();
          }
        }
      }, 50);
    }
  };

  const handleVolumeChange = (v: number) => {
    setMusicVolume(v);
    if (customMusicRef.current) customMusicRef.current.setVolume(v / 100);
  };

  const handleUploadMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error(t("breath.uploadHint"));
      return;
    }
    const url = URL.createObjectURL(file);
    setCustomMusicUrl(url);
    setCustomMusicName(file.name);
    setMusicTrack("custom");
    sfx.complete();
    toast.success(file.name);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      stopSpeech();
      if (customMusicRef.current) { customMusicRef.current.cleanup(); customMusicRef.current = null; }
    };
  }, []);

  const totalSec = phases.reduce((s, p) => s + p.sec, 0) * targetCycles;
  const elapsedSec = phases.slice(0, phaseIdx).reduce((s, p) => s + p.sec, 0) + cycle * phases.reduce((s, p) => s + p.sec, 0) + phaseElapsed;
  const overallProgress = Math.min(1, elapsedSec / totalSec);

  return (
    <div className="space-y-6">
      <ModuleHeaderLocal
        title={t("breath.title")}
        desc={t("breath.desc")}
        icon={<BreathingIcon className="w-5 h-5" />}
        accent="linear-gradient(135deg, oklch(0.7 0.16 60), oklch(0.65 0.2 330))"
      />

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Breathing animation area */}
        <GlassCard className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden" glow>
          <FloatingOrbs count={5} active={running} />
          <ConfettiBurst trigger={celebrate} />
          {/* Ambient rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border"
                style={{ width: 200 + i * 50, height: 200 + i * 50, borderColor: "var(--primary)", opacity: 0.1 - i * 0.02 }}
                animate={running ? { scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] } : {}}
                transition={{ duration: phases.reduce((s, p) => s + p.sec, 0), repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              />
            ))}
          </div>

          {/* Breathing circle - compact size */}
          <div className="relative z-10 flex items-center justify-center" style={{ width: 240, height: 240 }}>
            <motion.div
              className="rounded-full flex items-center justify-center"
              animate={{ scale: circleScale }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                width: 160,
                height: 160,
                background: "radial-gradient(circle at 30% 30%, var(--primary), color-mix(in oklch, var(--primary) 50%, var(--glow)))",
                boxShadow: "0 0 60px var(--glow), inset 0 0 30px rgba(255,255,255,0.2)",
              }}
            >
              <div className="text-center text-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={running ? currentPhase?.name : "idle"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {running && currentPhase ? (
                      <>
                        <div className="text-2xl font-bold">{PHASE_LABELS[currentPhase.name][locale]}</div>
                        <div className="text-4xl font-bold tabular-nums mt-1">{Math.ceil(currentPhase.sec - phaseElapsed)}</div>
                      </>
                    ) : finished ? (
                      <div className="text-xl font-bold">{t("breath.complete")}</div>
                    ) : (
                      <div className="text-lg font-medium opacity-80">{t("breath.ready")}</div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Cycle counter */}
          <div className="relative z-10 mt-4 flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums gradient-text">{cycle}/{targetCycles}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("breath.cycles")}</div>
            </div>
            <div className="w-px h-8 bg-foreground/10" />
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums">{formatTime(totalSec - elapsedSec)}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("breath.remaining")}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="relative z-10 flex items-center gap-3 mt-6">
            <Button onClick={reset} variant="outline" className="rounded-full w-12 h-12 p-0">
              <ResetIcon className="w-5 h-5" />
            </Button>
            <Button onClick={togglePlay} className="rounded-full w-16 h-16 p-0 text-xl shadow-xl">
              {running ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7" />}
            </Button>
            <div className="w-12 h-12" />
          </div>

          {/* Progress */}
          <div className="relative z-10 w-full max-w-xs mt-6">
            <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, var(--primary), var(--glow))" }} animate={{ width: `${overallProgress * 100}%` }} />
            </div>
          </div>
        </GlassCard>

        {/* Control panel */}
        <div className="space-y-4">
          {/* Pattern selection */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><WindIcon className="w-4 h-4 text-primary" /> {t("breath.pattern")}</h3>
            <div className="space-y-2">
              {PATTERNS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { sfx.click(); setPatternId(p.id); reset(); }}
                  onMouseEnter={() => sfx.hover()}
                  className={cn(
                    "w-full text-left p-3 rounded-2xl transition-all",
                    patternId === p.id ? "text-white shadow-lg scale-[1.02]" : "glass glass-sheen hover:scale-[1.01]"
                  )}
                  style={patternId === p.id ? { background: p.color } : undefined}
                >
                  <div className="font-bold text-sm">{p.name}</div>
                  <div className={cn("text-xs mt-0.5", patternId === p.id ? "text-white/80" : "text-muted-foreground")}>{p.desc}</div>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Custom params */}
          <AnimatePresence>
            {patternId === "custom" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <GlassCard className="p-5">
                  <h3 className="font-bold mb-3">{t("breath.custom")}</h3>
                  <div className="space-y-4">
                    <ParamSlider label={t("breath.inhale")} value={customInhale} min={2} max={10} onChange={(v) => { sfx.knobTick(); setCustomInhale(v); }} />
                    <ParamSlider label={t("breath.hold")} value={customHold} min={0} max={10} onChange={(v) => { sfx.knobTick(); setCustomHold(v); }} />
                    <ParamSlider label={t("breath.exhale")} value={customExhale} min={2} max={12} onChange={(v) => { sfx.knobTick(); setCustomExhale(v); }} />
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cycles & sound */}
          <GlassCard className="p-5">
            <div className="mb-4">
              <ParamSlider label={t("breath.targetCycles")} value={targetCycles} min={3} max={20} onChange={(v) => { sfx.knobTick(); setTargetCycles(v); }} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl glass">
              <span className="text-sm font-medium">{t("breath.soundGuide")}</span>
              <Switch checked={soundGuide} onCheckedChange={(v) => { sfx.click(); setSoundGuide(v); }} />
            </div>
          </GlassCard>

          {/* Music control */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><MusicIcon className="w-4 h-4 text-primary" /> {t("breath.music")}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t("breath.musicHint")}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { id: "none", labelKey: "breath.musicNone" },
                { id: "playPiano", labelKey: "breath.musicCalm" },
                { id: "playZen", labelKey: "breath.musicZen" },
                { id: "playHarp", labelKey: "breath.musicForest" },
                { id: "playFlute", labelKey: "breath.musicOcean" },
                { id: "playStrings", labelKey: "breath.musicTibet" },
              ].map((track) => (
                <button
                  key={track.labelKey}
                  onClick={() => handleMusicTrackChange(track.id)}
                  onMouseEnter={() => sfx.hover()}
                  className={cn(
                    "px-2 py-2 rounded-xl text-xs font-medium transition-all",
                    musicTrack === track.id ? "bg-primary text-primary-foreground shadow-lg scale-105" : "glass glass-sheen text-foreground/70 hover:text-foreground"
                  )}
                >
                  {t(track.labelKey)}
                </button>
              ))}
            </div>
            {/* Volume control */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t("breath.volume")}</span>
                <span className="text-sm font-bold text-primary tabular-nums">{musicVolume}</span>
              </div>
              <Slider value={[musicVolume]} min={0} max={100} step={1} onValueChange={(v) => handleVolumeChange(v[0])} />
            </div>
            {/* Upload custom music */}
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
                "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                musicTrack === "custom" ? "bg-primary text-primary-foreground shadow-lg" : "glass glass-sheen text-foreground/70 hover:text-foreground"
              )}
            >
              <UploadIcon className="w-4 h-4" />
              {customMusicName ? customMusicName : t("breath.uploadMusic")}
            </button>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">{t("breath.uploadHint")}</p>
          </GlassCard>

          {/* Stats */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2"><StatsIcon className="w-4 h-4 text-primary" /> {t("breath.stats")}</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-xl glass">
                <div className="text-xl font-bold gradient-text tabular-nums">{breathingSessions.length}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("breath.totalSessions")}</div>
              </div>
              <div className="text-center p-2 rounded-xl glass">
                <div className="text-xl font-bold gradient-text tabular-nums">{breathingSessions.reduce((s, x) => s + x.cycles, 0)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("breath.totalCycles")}</div>
              </div>
              <div className="text-center p-2 rounded-xl glass">
                <div className="text-xl font-bold gradient-text tabular-nums">{Math.round(breathingSessions.reduce((s, x) => s + x.totalSec, 0) / 60)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("breath.totalTime")}min</div>
              </div>
            </div>
            {breathingSessions.length > 0 && (
              <div className="mt-4 space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                {breathingSessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg glass">
                    <span className="font-medium">{s.pattern}</span>
                    <span className="text-muted-foreground">{s.cycles} {t("breath.cycles")} · {Math.round(s.totalSec)}s</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function ParamSlider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold text-primary tabular-nums">{value}{max <= 20 ? "" : "s"}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={(v) => onChange(v[0])} />
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
