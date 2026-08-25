"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type PomodoroTask, type PomodoroSession } from "@/lib/store";
import { useT, useSfx, formatTime } from "@/lib/hooks";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  PlayIcon, PauseIcon, ResetIcon, SkipIcon, PlusIcon, TrashIcon, CheckCircleIcon,
  PomodoroIcon, FireIcon, ClockIcon, TargetIcon, StatsIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { ConfettiBurst } from "@/components/ui/effects";

type Phase = "focus" | "shortBreak" | "longBreak";

export function PomodoroModule() {
  const t = useT();
  const sfx = useSfx();
  const {
    pomoFocusMin, pomoShortBreakMin, pomoLongBreakMin, pomoRoundsBeforeLong,
    pomoAutoStartBreaks, pomoAutoStartFocus,
    setPomoFocusMin, setPomoShortBreakMin, setPomoLongBreakMin, setPomoRoundsBeforeLong,
    setPomoAutoStartBreaks, setPomoAutoStartFocus,
    pomoTasks, pomoSessions, addPomoTask, deletePomoTask, togglePomoTask,
    addPomoSession, incrementPomoTask,
  } = useAppStore();

  const [phase, setPhase] = useState<Phase>("focus");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(pomoFocusMin * 60);
  const [round, setRound] = useState(1);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const activeTask = pomoTasks.find((t) => t.id === activeTaskId) || null;
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEst, setNewTaskEst] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const rafRef = useRef<number | null>(null);
  const endTimeRef = useRef<number>(0);

  const phaseDurations: Record<Phase, number> = {
    focus: pomoFocusMin * 60,
    shortBreak: pomoShortBreakMin * 60,
    longBreak: pomoLongBreakMin * 60,
  };

  const phaseLabel: Record<Phase, string> = {
    focus: t("pomo.focus"),
    shortBreak: t("pomo.shortBreak"),
    longBreak: t("pomo.longBreak"),
  };

  const phaseColor: Record<Phase, string> = {
    focus: "var(--primary)",
    shortBreak: "oklch(0.7 0.16 145)",
    longBreak: "oklch(0.65 0.2 330)",
  };

  // Reset remaining when phase or duration changes (and not running)
  useEffect(() => {
    if (!running) setRemaining(phaseDurations[phase]);
  }, [phase, pomoFocusMin, pomoShortBreakMin, pomoLongBreakMin, running, phaseDurations]);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    endTimeRef.current = Date.now() + remaining * 1000;
    const tick = () => {
      const left = Math.max(0, (endTimeRef.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) {
        handlePhaseComplete();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running]);

  const handlePhaseComplete = useCallback(() => {
    setRunning(false);
    sfx.complete();

    // Record session
    const session: PomodoroSession = {
      id: crypto.randomUUID(),
      type: phase,
      durationSec: phaseDurations[phase],
      completedAt: Date.now(),
      taskId: activeTaskId ?? undefined,
    };
    addPomoSession(session);

    if (phase === "focus") {
      if (activeTaskId) incrementPomoTask(activeTaskId);
      toast.success(t("pomo.focusComplete"));
      setCelebrate((c) => c + 1);
      const nextPhase: Phase = round % pomoRoundsBeforeLong === 0 ? "longBreak" : "shortBreak";
      setPhase(nextPhase);
      setRemaining(phaseDurations[nextPhase]);
      if (pomoAutoStartBreaks) {
        setTimeout(() => setRunning(true), 800);
      }
    } else {
      toast.success(t("pomo.breakComplete"));
      setCelebrate((c) => c + 1);
      setPhase("focus");
      setRemaining(phaseDurations.focus);
      setRound((r) => r + 1);
      if (pomoAutoStartFocus) {
        setTimeout(() => setRunning(true), 800);
      }
    }
  }, [phase, round, activeTaskId, pomoRoundsBeforeLong, pomoAutoStartBreaks, pomoAutoStartFocus]);

  const handleStart = () => {
    sfx.click();
    setRunning(true);
  };
  const handlePause = () => {
    sfx.click();
    setRunning(false);
  };
  const handleReset = () => {
    sfx.click();
    setRunning(false);
    setRemaining(phaseDurations[phase]);
  };
  const handleSkip = () => {
    sfx.click();
    setRunning(false);
    handlePhaseComplete();
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    sfx.click();
    const task: PomodoroTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      estPomodoros: newTaskEst,
      completedPomodoros: 0,
      done: false,
      createdAt: Date.now(),
    };
    addPomoTask(task);
    setNewTaskTitle("");
    setNewTaskEst(1);
    toast.success(t("pomo.taskAdded"));
  };

  // Stats
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todaySessions = pomoSessions.filter((s) => s.completedAt >= todayStart);
  const todayFocus = todaySessions.filter((s) => s.type === "focus");
  const todayFocusMin = todayFocus.reduce((sum, s) => sum + s.durationSec, 0) / 60;
  const totalFocusMin = pomoSessions.filter((s) => s.type === "focus").reduce((sum, s) => sum + s.durationSec, 0) / 60;
  const totalSessions = pomoSessions.filter((s) => s.type === "focus").length;

  // Last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;
    const mins = pomoSessions
      .filter((s) => s.type === "focus" && s.completedAt >= dayStart && s.completedAt < dayEnd)
      .reduce((sum, s) => sum + s.durationSec, 0) / 60;
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, mins: Math.round(mins) };
  });
  const maxDay = Math.max(...last7Days.map((d) => d.mins), 1);

  const progress = 1 - remaining / phaseDurations[phase];
  const circumference = 2 * Math.PI * 140;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl glass glass-sheen flex items-center justify-center text-primary">
              <PomodoroIcon className="w-6 h-6" />
            </span>
            {t("nav.pomodoro")}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{t("pomo.subtitle")}</p>
        </div>
        <Button variant="ghost" onClick={() => { sfx.click(); setShowSettings(!showSettings); }} className="glass glass-sheen rounded-2xl">
          {t("pomo.settings")}
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* ===== Timer ===== */}
        <GlassCard strong className="p-6 sm:p-10 flex flex-col items-center">
          {/* Phase tabs */}
          <div className="flex gap-1.5 p-1.5 rounded-2xl glass mb-8">
            {(["focus", "shortBreak", "longBreak"] as Phase[]).map((p) => (
              <button
                key={p}
                onClick={() => { sfx.click(); setRunning(false); setPhase(p); }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all relative",
                  phase === p ? "text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                )}
              >
                {phase === p && (
                  <motion.div layoutId="pomo-phase" className="absolute inset-0 rounded-xl" style={{ background: phaseColor[p] }} transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <span className="relative z-10">{phaseLabel[p]}</span>
              </button>
            ))}
          </div>

          {/* Circular timer */}
          <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
            <ConfettiBurst trigger={celebrate} colors={[phaseColor.focus, phaseColor.shortBreak, phaseColor.longBreak]} />
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{ background: `radial-gradient(circle, ${phaseColor[phase]}55 0%, transparent 70%)` }}
            />
            {/* Tick marks ring */}
            <svg className="absolute inset-0 w-full h-full spin-slow opacity-30" viewBox="0 0 320 320">
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
                const x1 = 160 + Math.cos(angle) * 122;
                const y1 = 160 + Math.sin(angle) * 122;
                const x2 = 160 + Math.cos(angle) * (i % 5 === 0 ? 112 : 117);
                const y2 = 160 + Math.sin(angle) * (i % 5 === 0 ? 112 : 117);
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={phaseColor[phase]} strokeWidth={i % 5 === 0 ? 2 : 1} strokeLinecap="round" />
                );
              })}
            </svg>
            <svg className="w-full h-full -rotate-90 relative" viewBox="0 0 320 320">
              <circle cx="160" cy="160" r="140" fill="none" stroke="var(--foreground)" strokeOpacity="0.08" strokeWidth="14" />
              {/* Progress track glow */}
              <circle cx="160" cy="160" r="140" fill="none"
                stroke={phaseColor[phase]} strokeOpacity="0.2" strokeWidth="20" strokeLinecap="round" />
              <motion.circle
                cx="160" cy="160" r="140" fill="none"
                stroke={phaseColor[phase]} strokeWidth="14" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{ filter: `drop-shadow(0 0 16px ${phaseColor[phase]})` }}
                transition={{ duration: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className={`text-5xl sm:text-6xl font-bold font-mono tabular-nums ${running ? "pulse-glow" : ""}`}
                style={{ color: phaseColor[phase], borderRadius: "50%", padding: "0.5rem" }}
              >
                {formatTime(remaining)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {t("pomo.round")} {round} · {phaseLabel[phase]}
              </div>
              {activeTask && (
                <div className="mt-2 px-3 py-1 rounded-full glass text-xs font-medium max-w-[200px] truncate">
                  {activeTask.title}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={handleReset}
              onMouseEnter={() => sfx.hover()}
              className="w-12 h-12 rounded-full glass glass-sheen flex items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 active:scale-95 transition-all"
              aria-label={t("common.reset")}
            >
              <ResetIcon className="w-5 h-5" />
            </button>
            <button
              onClick={running ? handlePause : handleStart}
              onMouseEnter={() => sfx.hover()}
              className="w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-lg"
              style={{ background: phaseColor[phase], boxShadow: `0 8px 32px ${phaseColor[phase]}66` }}
              aria-label={running ? t("common.pause") : t("common.start")}
            >
              {running ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7 ml-1" />}
            </button>
            <button
              onClick={handleSkip}
              onMouseEnter={() => sfx.hover()}
              className="w-12 h-12 rounded-full glass glass-sheen flex items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 active:scale-95 transition-all"
              aria-label={t("common.skip")}
            >
              <SkipIcon className="w-5 h-5" />
            </button>
          </div>
        </GlassCard>

        {/* ===== Side panel ===== */}
        <div className="space-y-6">
          {/* Stats */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <StatsIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t("pomo.stats")}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBox icon={<FireIcon className="w-4 h-4" />} label={t("pomo.todayFocus")} value={`${Math.round(todayFocusMin)}m`} color="oklch(0.7 0.18 45)" />
              <StatBox icon={<TargetIcon className="w-4 h-4" />} label={t("pomo.todaySessions")} value={`${todayFocus.length}`} color="var(--primary)" />
              <StatBox icon={<ClockIcon className="w-4 h-4" />} label={t("pomo.totalFocus")} value={`${Math.round(totalFocusMin)}m`} color="oklch(0.65 0.2 330)" />
              <StatBox icon={<PomodoroIcon className="w-4 h-4" />} label={t("pomo.totalSessions")} value={`${totalSessions}`} color="oklch(0.7 0.16 145)" />
            </div>
            {/* 7-day chart */}
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-2">{t("pomo.last7days")}</div>
              <div className="flex items-end justify-between gap-1.5 h-24">
                {last7Days.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex-1 flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.mins / maxDay) * 100}%` }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                        className="w-full rounded-t-md min-h-[2px]"
                        style={{ background: d.mins > 0 ? "var(--primary)" : "var(--foreground)", opacity: d.mins > 0 ? 1 : 0.15 }}
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Tasks */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircleIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t("pomo.tasks")}</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              <AnimatePresence>
                {pomoTasks.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-6">{t("pomo.noTasks")}</div>
                )}
                {pomoTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    layout
                    className={cn(
                      "group flex items-center gap-2.5 p-2.5 rounded-xl transition-all cursor-pointer",
                      activeTaskId === task.id ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-accent/30",
                      task.done && "opacity-50"
                    )}
                    onClick={() => { sfx.click(); setActiveTaskId(activeTaskId === task.id ? null : task.id); }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); sfx.click(); togglePomoTask(task.id); }}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        task.done ? "bg-primary border-primary text-primary-foreground" : "border-foreground/30"
                      )}
                    >
                      {task.done && <CheckCircleIcon className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium truncate", task.done && "line-through")}>{task.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {task.completedPomodoros}/{task.estPomodoros} {t("pomo.pomodoros")}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); sfx.click(); deletePomoTask(task.id); }}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {/* Add task */}
            <div className="mt-3 flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                placeholder={t("pomo.taskPlaceholder")}
                className="glass rounded-xl h-10"
              />
              <Button
                onClick={handleAddTask}
                className="rounded-xl h-10 px-3 shrink-0"
                aria-label={t("common.save")}
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ===== Settings panel ===== */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-4">{t("pomo.settings")}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <SettingSlider label={t("pomo.focusDuration")} value={pomoFocusMin} min={5} max={60} step={5} unit="m" onChange={(v) => { sfx.tick(); setPomoFocusMin(v); }} />
                <SettingSlider label={t("pomo.shortBreakDuration")} value={pomoShortBreakMin} min={1} max={15} step={1} unit="m" onChange={(v) => { sfx.tick(); setPomoShortBreakMin(v); }} />
                <SettingSlider label={t("pomo.longBreakDuration")} value={pomoLongBreakMin} min={5} max={30} step={5} unit="m" onChange={(v) => { sfx.tick(); setPomoLongBreakMin(v); }} />
                <SettingSlider label={t("pomo.roundsBeforeLong")} value={pomoRoundsBeforeLong} min={2} max={8} step={1} unit="" onChange={(v) => { sfx.tick(); setPomoRoundsBeforeLong(v); }} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <div className="flex items-center justify-between p-3 rounded-xl glass">
                  <span className="text-sm font-medium">{t("pomo.autoStartBreaks")}</span>
                  <Switch checked={pomoAutoStartBreaks} onCheckedChange={(v) => { sfx.click(); setPomoAutoStartBreaks(v); }} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl glass">
                  <span className="text-sm font-medium">{t("pomo.autoStartFocus")}</span>
                  <Switch checked={pomoAutoStartFocus} onCheckedChange={(v) => { sfx.click(); setPomoAutoStartFocus(v); }} />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  function SettingSlider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-bold text-primary tabular-nums">{value}{unit}</span>
        </div>
        <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
      </div>
    );
  }
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl glass">
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
