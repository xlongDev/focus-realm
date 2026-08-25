"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type SchulteRecord } from "@/lib/store";
import { useT, useSfx } from "@/lib/hooks";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  PlayIcon, ResetIcon, TrophyIcon, ClockIcon, TargetIcon, StatsIcon, TrendUpIcon, GridIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { ConfettiBurst } from "@/components/ui/effects";

const DIFFICULTIES = [
  { size: 3, labelKey: "schulte.grid3", color: "oklch(0.72 0.16 145)" },
  { size: 4, labelKey: "schulte.grid4", color: "oklch(0.7 0.16 175)" },
  { size: 5, labelKey: "schulte.grid5", color: "oklch(0.78 0.16 90)" },
  { size: 6, labelKey: "schulte.grid6", color: "oklch(0.7 0.16 60)" },
  { size: 7, labelKey: "schulte.grid7", color: "oklch(0.65 0.2 330)" },
];

export function SchulteModule() {
  const t = useT();
  const sfx = useSfx();
  const { schulteRecords, addSchulteRecord } = useAppStore();

  const [gridSize, setGridSize] = useState(5);
  const [grid, setGrid] = useState<number[]>([]);
  const [nextNum, setNextNum] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [clicked, setClicked] = useState<Set<number>>(new Set());
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [lastResult, setLastResult] = useState<{ durationMs: number; errors: number; accuracy: number; isRecord: boolean } | null>(null);
  const rafRef = useRef<number>(0);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs to avoid stale closures in click handler
  const nextNumRef = useRef(1);
  const clickedRef = useRef<Set<number>>(new Set());
  const errorsRef = useRef(0);
  const startTimeRef = useRef(0);
  const total = gridSize * gridSize;

  const shuffle = useCallback((n: number) => {
      const arr = Array.from({ length: n * n }, (_, i) => i + 1);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }, []);

  const startGame = useCallback(() => {
    const g = shuffle(gridSize);
    setGrid(g);
    setNextNum(1);
    nextNumRef.current = 1;
    setErrors(0);
    errorsRef.current = 0;
    setClicked(new Set());
    clickedRef.current = new Set();
    setWrongCell(null);
    setFinished(false);
    setLastResult(null);
    setElapsed(0);
    setPlaying(true);
    setReady(true);
    sfx.start();
    // Start timer after intro animation completes
    // Animation: stagger delay = idx * 0.012, last cell delay = (total-1)*0.012, plus 0.4s tween
    const animDuration = (gridSize * gridSize - 1) * 0.012 * 1000 + 450;
    if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
    readyTimerRef.current = setTimeout(() => {
      setReady(false);
      setStartTime(Date.now());
      startTimeRef.current = Date.now();
    }, animDuration);
  }, [gridSize, shuffle, sfx]);

  const stopGame = useCallback(() => {
    setPlaying(false);
    setReady(false);
    setGrid([]);
    setFinished(false);
    if (readyTimerRef.current) { clearTimeout(readyTimerRef.current); readyTimerRef.current = null; }
  }, []);

  const handleCellClick = useCallback((num: number, idx: number) => {
    if (!playing || ready) return;
    const expected = nextNumRef.current;
    if (num === expected) {
      sfx.correct();
      const newClicked = new Set(clickedRef.current);
      newClicked.add(idx);
      clickedRef.current = newClicked;
      setClicked(newClicked);
      if (num === total) {
        // finished
        const durationMs = Date.now() - startTimeRef.current;
        const errs = errorsRef.current;
        const accuracy = Math.round((total / (total + errs)) * 1000) / 10;
        const prevBest = schulteRecords.filter((r) => r.gridSize === gridSize).length
          ? Math.min(...schulteRecords.filter((r) => r.gridSize === gridSize).map((r) => r.durationMs))
          : Infinity;
        const isRecord = durationMs < prevBest;
        setPlaying(false);
        setFinished(true);
        setCelebrate((c) => c + 1);
        setLastResult({ durationMs, errors: errs, accuracy, isRecord });
        sfx.success();
        const record: SchulteRecord = {
          id: crypto.randomUUID(),
          gridSize,
          durationMs,
          errors: errs,
          accuracy,
          createdAt: Date.now(),
        };
        addSchulteRecord(record);
        if (isRecord) sfx.complete();
        toast.success(t("schulte.complete"), { description: `${t("common.duration")}: ${(durationMs / 1000).toFixed(1)}s · ${t("common.accuracy")}: ${accuracy}%` });
      } else {
        nextNumRef.current = num + 1;
        setNextNum(num + 1);
      }
    } else {
      sfx.error();
      errorsRef.current += 1;
      setErrors(errorsRef.current);
      setWrongCell(idx);
      setTimeout(() => setWrongCell(null), 400);
    }
  }, [playing, total, gridSize, sfx, addSchulteRecord, t, schulteRecords]);

  useEffect(() => {
    if (!playing || ready) return;
    const tick = () => {
      setElapsed(Date.now() - startTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, ready, startTime]);

  // Cleanup ready timer on unmount
  useEffect(() => {
    return () => {
      if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
    };
  }, []);

  // Stats
  const recordsForSize = schulteRecords.filter((r) => r.gridSize === gridSize);
  const bestTime = recordsForSize.length ? Math.min(...recordsForSize.map((r) => r.durationMs)) : 0;
  const avgTime = recordsForSize.length ? recordsForSize.reduce((s, r) => s + r.durationMs, 0) / recordsForSize.length : 0;
  const avgAccuracy = recordsForSize.length ? recordsForSize.reduce((s, r) => s + r.accuracy, 0) / recordsForSize.length : 0;

  // chart data - last 10 records for this size
  const chartData = recordsForSize.slice(0, 10).reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <ModuleHeader
        title={t("schulte.title")}
        desc={t("schulte.desc")}
        icon={<GridIcon className="w-5 h-5" />}
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Game area */}
        <div className="space-y-4">
          {/* Difficulty selector */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground mr-2">{t("schulte.difficulty")}</span>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.size}
                  onClick={() => { sfx.click(); setGridSize(d.size); }}
                  onMouseEnter={() => sfx.hover()}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-sm font-medium transition-all",
                    gridSize === d.size ? "text-white shadow-lg scale-105" : "glass glass-sheen text-foreground/70 hover:text-foreground"
                  )}
                  style={gridSize === d.size ? { background: d.color } : undefined}
                >
                  {t(d.labelKey)}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Game board */}
          <GlassCard className="p-4 sm:p-6" glow>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("common.duration")}</div>
                  <div className="text-2xl font-bold tabular-nums gradient-text">
                    {ready ? "—" : `${(elapsed / 1000).toFixed(1)}s`}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("schulte.next")}</div>
                  <div className="text-2xl font-bold tabular-nums text-primary">{playing ? nextNum : "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("schulte.errors")}</div>
                  <div className="text-2xl font-bold tabular-nums text-rose-500">{errors}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {!playing ? (
                  <Button onClick={startGame} className="rounded-full px-5 gap-1.5">
                    <PlayIcon className="w-4 h-4" /> {t("schulte.start")}
                  </Button>
                ) : (
                  <Button onClick={stopGame} variant="outline" className="rounded-full px-5 gap-1.5">
                    <ResetIcon className="w-4 h-4" /> {t("common.stop")}
                  </Button>
                )}
              </div>
            </div>

            {/* Grid */}
            <div className="relative">
              <ConfettiBurst trigger={celebrate} />
              {!playing && !finished && (
                <div className="aspect-square max-w-md mx-auto rounded-3xl glass flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <GridIcon className="w-16 h-16 text-primary/40" />
                  <p className="text-sm text-muted-foreground max-w-xs">{t("schulte.desc")}</p>
                  <Button onClick={startGame} className="rounded-full mt-2 gap-1.5">
                    <PlayIcon className="w-4 h-4" /> {t("schulte.start")}
                  </Button>
                </div>
              )}
              {playing && (
                <div
                  className="grid gap-2 sm:gap-2.5 max-w-md mx-auto"
                  style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                >
                  {grid.map((num, idx) => {
                    const isClicked = clicked.has(idx);
                    const isWrong = wrongCell === idx;
                    return (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, scale: 0.3, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.012, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                        onClick={() => handleCellClick(num, idx)}
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.05 }}
                        className={cn(
                          "aspect-square rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl transition-all relative overflow-hidden",
                          isClicked ? "bg-primary/20 text-primary/50 scale-95" : "glass glass-sheen text-foreground hover:scale-105",
                          isWrong && "bg-rose-500/40 text-white animate-pulse"
                        )}
                      >
                        {num}
                      </motion.button>
                    );
                  })}
                </div>
              )}
              {playing && ready && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 py-3 rounded-full glass-strong glass-sheen text-lg font-bold text-primary shadow-2xl"
                  >
                    {t("breath.ready")}
                  </motion.div>
                </motion.div>
              )}
              {finished && lastResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="aspect-square max-w-md mx-auto rounded-3xl glass-strong glass-sheen flex flex-col items-center justify-center gap-4 p-8 text-center relative overflow-hidden"
                >
                  {lastResult.isRecord && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: "linear-gradient(90deg, oklch(0.78 0.16 90), oklch(0.7 0.16 60))" }}
                    >
                      {t("schulte.newRecord")}
                    </motion.div>
                  )}
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, repeat: 2 }}
                  >
                    <TrophyIcon className="w-16 h-16" style={{ color: lastResult.isRecord ? "oklch(0.78 0.16 90)" : "var(--primary)" }} />
                  </motion.div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t("schulte.yourResult")}</div>
                    <div className="text-5xl font-bold gradient-text tabular-nums">{(lastResult.durationMs / 1000).toFixed(1)}s</div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold tabular-nums" style={{ color: "oklch(0.72 0.16 145)" }}>{lastResult.accuracy}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{t("common.accuracy")}</div>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="text-center">
                      <div className="text-2xl font-bold tabular-nums" style={{ color: lastResult.errors > 0 ? "oklch(0.65 0.2 25)" : "var(--primary)" }}>{lastResult.errors}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{t("schulte.errorsCount")}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={startGame} className="rounded-full gap-1.5">
                      <ResetIcon className="w-4 h-4" /> {t("schulte.playAgain")}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <GlassCard className="p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2"><StatsIcon className="w-4 h-4 text-primary" /> {t("schulte.stats")}</h3>
            <div className="grid grid-cols-3 gap-2">
              <StatBox icon={<TrophyIcon className="w-3.5 h-3.5" />} label={t("common.best")} value={bestTime ? `${(bestTime / 1000).toFixed(1)}s` : "—"} color="oklch(0.78 0.16 90)" />
              <StatBox icon={<ClockIcon className="w-3.5 h-3.5" />} label={t("common.average")} value={avgTime ? `${(avgTime / 1000).toFixed(1)}s` : "—"} color="oklch(0.72 0.16 175)" />
              <StatBox icon={<TargetIcon className="w-3.5 h-3.5" />} label={t("common.accuracy")} value={recordsForSize.length ? `${avgAccuracy.toFixed(0)}%` : "—"} color="oklch(0.7 0.16 145)" />
            </div>
            <div className="mt-3 text-center text-xs text-muted-foreground">
              {gridSize}×{gridSize} · {recordsForSize.length} {t("schulte.records")}
            </div>
          </GlassCard>

          {/* Trend chart */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><TrendUpIcon className="w-4 h-4 text-primary" /> {t("schulte.trend")}</h3>
            {chartData.length > 0 ? (
              <SchulteChart data={chartData} />
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">{t("common.noData")}</div>
            )}
          </GlassCard>

          {/* History */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-3">{t("common.history")}</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {recordsForSize.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">{t("common.noData")}</div>}
              {recordsForSize.slice(0, 8).map((r, i) => (
                <div key={r.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-accent/30">
                  <span className="text-muted-foreground">#{recordsForSize.length - i}</span>
                  <span className="font-medium tabular-nums">{(r.durationMs / 1000).toFixed(1)}s</span>
                  <span className="text-xs text-muted-foreground">{r.accuracy.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function SchulteChart({ data }: { data: SchulteRecord[] }) {
  const max = Math.max(...data.map((d) => d.durationMs));
  const min = Math.min(...data.map((d) => d.durationMs));
  const range = max - min || 1;
  const w = 280;
  const h = 100;
  const pad = 8;
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((d.durationMs - min) / range) * (h - pad * 2);
    return { x, y, d };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${path} L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
        <defs>
          <linearGradient id="schulteArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#schulteArea)" />
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--primary)" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{(min / 1000).toFixed(1)}s</span>
        <span>{(max / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-2.5 rounded-xl glass text-center">
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
        {icon}
      </div>
      <div className="text-base font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

// Shared module header
export function ModuleHeader({ title, desc, icon, accent }: { title: string; desc: string; icon: React.ReactNode; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
        style={{ background: accent || "linear-gradient(135deg, var(--primary), var(--glow))" }}
      >
        {icon}
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{desc}</p>
      </div>
    </motion.div>
  );
}
