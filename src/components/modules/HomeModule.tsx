"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAppStore, type ModuleId } from "@/lib/store";
import { useT, useSfx } from "@/lib/hooks";
import { GlassCard } from "@/components/ui/glass";
import {
  PomodoroIcon,
  SchulteIcon,
  MeditationIcon,
  BreathingIcon,
  CameraIcon,
  SparkleIcon,
  ArrowRightIcon,
  StatsIcon,
  FireIcon,
  TargetIcon,
  ClockIcon,
} from "@/components/icons";

interface FeatureCard {
  id: ModuleId;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  titleKey: string;
  descKey: string;
  gradient: string;
  stat: string;
  statLabelKey: string;
}

const FEATURES: FeatureCard[] = [
  {
    id: "pomodoro",
    icon: PomodoroIcon,
    titleKey: "nav.pomodoro",
    descKey: "home.featPomodoro",
    gradient: "linear-gradient(135deg, oklch(0.62 0.15 175), oklch(0.7 0.16 60))",
    stat: "25:00",
    statLabelKey: "home.statLabelFocus",
  },
  {
    id: "schulte",
    icon: SchulteIcon,
    titleKey: "nav.schulte",
    descKey: "home.featSchulte",
    gradient: "linear-gradient(135deg, oklch(0.7 0.16 60), oklch(0.65 0.2 330))",
    stat: "5×5",
    statLabelKey: "home.statLabelGrid",
  },
  {
    id: "meditation",
    icon: MeditationIcon,
    titleKey: "nav.meditation",
    descKey: "home.featMeditation",
    gradient: "linear-gradient(135deg, oklch(0.65 0.2 330), oklch(0.7 0.15 145))",
    stat: "∞",
    statLabelKey: "home.statLabelCalm",
  },
  {
    id: "breathing",
    icon: BreathingIcon,
    titleKey: "nav.breathing",
    descKey: "home.featBreathing",
    gradient: "linear-gradient(135deg, oklch(0.7 0.15 145), oklch(0.62 0.15 175))",
    stat: "4-7-8",
    statLabelKey: "home.statLabelRhythm",
  },
  {
    id: "camera",
    icon: CameraIcon,
    titleKey: "nav.camera",
    descKey: "home.featCamera",
    gradient: "linear-gradient(135deg, oklch(0.72 0.18 20), oklch(0.7 0.16 60))",
    stat: "Live",
    statLabelKey: "home.statLabelMonitor",
  },
];

export function HomeModule() {
  const t = useT();
  const sfx = useSfx();
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const pomoSessions = useAppStore((s) => s.pomoSessions);
  const schulteRecords = useAppStore((s) => s.schulteRecords);
  const meditationSessions = useAppStore((s) => s.meditationSessions);
  const breathingSessions = useAppStore((s) => s.breathingSessions);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  // Mouse parallax
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const go = (id: ModuleId) => {
    sfx.click();
    setActiveModule(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Compute user stats
  const focusMin = Math.round(
    pomoSessions.filter((s) => s.type === "focus").reduce((sum, s) => sum + s.durationSec, 0) / 60
  );
  const totalSessions = pomoSessions.length + schulteRecords.length + meditationSessions.length + breathingSessions.length;
  const medMin = Math.round(meditationSessions.reduce((sum, s) => sum + s.durationSec, 0) / 60);
  const breathMin = Math.round(breathingSessions.reduce((sum, s) => sum + s.totalSec, 0) / 60);
  const avgAccuracy = schulteRecords.length
    ? Math.round(schulteRecords.reduce((sum, r) => sum + r.accuracy, 0) / schulteRecords.length)
    : 0;
  const hasData = totalSessions > 0;

  const moduleStats = [
    { id: "pomodoro" as ModuleId, label: t("home.statPomodoro"), value: focusMin, unit: t("home.statMinutes"), color: "oklch(0.72 0.16 175)", count: pomoSessions.filter((s) => s.type === "focus").length },
    { id: "schulte" as ModuleId, label: t("home.statSchulte"), value: schulteRecords.length, unit: t("home.statTimes"), color: "oklch(0.78 0.16 90)", count: schulteRecords.length },
    { id: "meditation" as ModuleId, label: t("home.statMeditation"), value: medMin, unit: t("home.statMinutes"), color: "oklch(0.65 0.2 330)", count: meditationSessions.length },
    { id: "breathing" as ModuleId, label: t("home.statBreathing"), value: breathingSessions.length, unit: t("home.statTimes"), color: "oklch(0.7 0.16 60)", count: breathingSessions.length },
  ];
  const maxModuleCount = Math.max(...moduleStats.map((m) => m.count), 1);

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* ===== Hero ===== */}
      <section ref={heroRef} className="relative min-h-[78vh] flex flex-col items-center justify-center text-center px-2 perspective-1000">
        <motion.div style={{ y: y1, opacity, scale }} className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass glass-sheen rounded-full px-4 py-1.5 mb-6 flex items-center gap-2 text-sm"
          >
            <SparkleIcon className="w-4 h-4 text-primary" />
            <span className="text-foreground/80">{t("home.heroBadge")}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] text-balance"
            style={{
              transform: `perspective(1000px) rotateY(${mouse.x * 4}deg) rotateX(${-mouse.y * 4}deg)`,
              transition: "transform 0.2s ease-out",
            }}
          >
            <span className="block text-foreground/90">{t("home.heroTitle1")}</span>
            <span className="block gradient-text glow-text">{t("home.heroTitle2")}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground text-balance leading-relaxed"
          >
            {t("home.heroDesc")}
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3"
          >
            <button
              onClick={() => go("pomodoro")}
              onMouseEnter={() => sfx.hover()}
              className="group relative px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow-lg overflow-hidden transition-transform hover:scale-105 active:scale-95"
              style={{ boxShadow: "0 8px 32px -8px var(--glow)" }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {t("home.heroCta")}
                <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 shimmer opacity-50" />
            </button>
            <button
              onClick={() => go("schulte")}
              onMouseEnter={() => sfx.hover()}
              className="px-7 py-3.5 rounded-full glass glass-sheen font-semibold text-base text-foreground/80 hover:text-foreground transition-all hover:scale-105 active:scale-95"
            >
              {t("home.heroSecondary")}
            </button>
          </motion.div>
        </motion.div>

        {/* Floating decorative orbs */}
        <motion.div
          style={{ y: y2 }}
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <motion.div
            className="absolute top-[12%] left-[8%] w-20 h-20 sm:w-28 sm:h-28 rounded-3xl glass glass-sheen float-slow flex items-center justify-center"
            animate={{ rotate: [0, 8, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ClockIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </motion.div>
          <motion.div
            className="absolute top-[20%] right-[10%] w-16 h-16 sm:w-24 sm:h-24 rounded-3xl glass glass-sheen float-med flex items-center justify-center"
            animate={{ rotate: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <TargetIcon className="w-7 h-7 sm:w-9 sm:h-9 text-accent" />
          </motion.div>
          <motion.div
            className="absolute bottom-[18%] left-[14%] w-14 h-14 sm:w-20 sm:h-20 rounded-2xl glass glass-sheen float-slow flex items-center justify-center"
            style={{ animationDelay: "-2s" }}
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <FireIcon className="w-6 h-6 sm:w-8 sm:h-8 text-chart-5" />
          </motion.div>
          <motion.div
            className="absolute bottom-[24%] right-[16%] w-16 h-16 sm:w-24 sm:h-24 rounded-full glass glass-sheen float-med flex items-center justify-center"
            style={{ animationDelay: "-1s" }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <SparkleIcon className="w-7 h-7 sm:w-9 sm:h-9 text-chart-3" />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== Stats strip ===== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: ClockIcon, value: "4+", label: "home.statModules", color: "var(--primary)" },
          { icon: TargetIcon, value: "6", label: "home.statThemes", color: "var(--accent)" },
          { icon: StatsIcon, value: "100%", label: "home.statOffline", color: "var(--chart-3)" },
          { icon: FireIcon, value: "0", label: "home.statCost", color: "var(--chart-5)" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <GlassCard className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in oklch, ${s.color} 18%, transparent)`, color: s.color }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl sm:text-3xl font-bold leading-none">{s.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{t(s.label)}</div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </section>

      {/* ===== Your Focus Data (real user stats) ===== */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("home.statsTitle")}</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">{t("home.statsDesc")}</p>
          </div>
        </div>
        <GlassCard strong className="p-6 sm:p-8">
          {hasData ? (
            <>
              {/* Top summary numbers */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text tabular-nums">{focusMin}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("home.statFocus")} ({t("home.statMinutes")})</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text tabular-nums">{totalSessions}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("home.statSessions")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text tabular-nums">{avgAccuracy}%</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("home.statAccuracy")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text tabular-nums">{medMin + breathMin}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("home.statFocus")} ({t("home.statMinutes")})</div>
                </div>
              </div>
              {/* Module usage bars */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground mb-2">{t("home.modulesProgress")}</div>
                {moduleStats.map((m, i) => (
                  <motion.button
                    key={m.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    onClick={() => go(m.id)}
                    onMouseEnter={() => sfx.hover()}
                    className="w-full flex items-center gap-3 group"
                  >
                    <div className="w-20 text-sm font-medium text-left shrink-0">{m.label}</div>
                    <div className="flex-1 h-8 rounded-full glass overflow-hidden relative">
                      <motion.div
                        className="h-full rounded-full relative"
                        style={{ background: `linear-gradient(90deg, ${m.color}, color-mix(in oklch, ${m.color} 60%, white))` }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(m.count / maxModuleCount) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                      >
                        <div className="absolute inset-0 glass-sweep-shine" />
                      </motion.div>
                    </div>
                    <div className="w-20 text-right text-sm font-bold tabular-nums shrink-0">
                      {m.value}<span className="text-muted-foreground font-normal ml-0.5">{m.unit}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full glass glass-sheen mx-auto flex items-center justify-center mb-4">
                <StatsIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("home.statNoData")}</p>
            </div>
          )}
        </GlassCard>
      </section>

      {/* ===== Feature cards ===== */}
      <section>
        <div className="flex items-end justify-between mb-5 sm:mb-7">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">{t("home.featuresTitle")}</h2>
            <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">{t("home.featuresDesc")}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCardItem key={f.id} feature={f} index={i} onClick={() => go(f.id)} />
          ))}
          {/* CTA card */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={() => go("settings")}
            onMouseEnter={() => sfx.hover()}
            className="glass glass-sheen rounded-3xl p-6 text-left flex flex-col justify-between min-h-[200px] hover:scale-[1.02] active:scale-[0.99] transition-transform group"
          >
            <div className="flex items-start justify-between">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}
              >
                <StatsIcon className="w-6 h-6" />
              </div>
              <ArrowRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-lg font-bold mt-4">{t("home.ctaCardTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{t("home.ctaCardDesc")}</p>
            </div>
          </motion.button>
        </div>
      </section>

      {/* ===== Philosophy ===== */}
      <section>
        <GlassCard strong className="p-8 sm:p-12 lg:p-16 text-center overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ background: "var(--aurora-1)" }} />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ background: "var(--aurora-2)" }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <SparkleIcon className="w-10 h-10 mx-auto text-primary mb-4" />
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight max-w-3xl mx-auto text-balance">
              {t("home.philosophyTitle")}
            </h2>
            <p className="mt-5 max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg leading-relaxed text-balance">
              {t("home.philosophyDesc")}
            </p>
          </motion.div>
        </GlassCard>
      </section>
    </div>
  );
}

function FeatureCardItem({ feature, index, onClick }: { feature: FeatureCard; index: number; onClick: () => void }) {
  const t = useT();
  const sfx = useSfx();
  const Icon = feature.icon;
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 8, ry: x * 8 });
  };
  const handleLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onClick={onClick}
      onMouseEnter={() => sfx.hover()}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="glass glass-sheen rounded-3xl p-6 text-left flex flex-col justify-between min-h-[200px] hover:scale-[1.02] active:scale-[0.99] transition-transform group relative overflow-hidden preserve-3d"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: "transform 0.15s ease-out, scale 0.2s",
      }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
        style={{ background: feature.gradient }}
      />
      <div className="relative z-10 flex items-start justify-between" style={{ transform: "translateZ(40px)" }}>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: feature.gradient, color: "white" }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <div className="text-xl font-bold gradient-text">{feature.stat}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t(feature.statLabelKey)}</div>
        </div>
      </div>
      <div className="relative z-10 mt-4" style={{ transform: "translateZ(20px)" }}>
        <h3 className="text-lg font-bold">{t(feature.titleKey)}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{t(feature.descKey)}</p>
      </div>
      <div className="relative z-10 mt-4 flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity" style={{ transform: "translateZ(30px)" }}>
        {t("home.heroCta")}
        <ArrowRightIcon className="w-4 h-4" />
      </div>
    </motion.button>
  );
}
