"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type ModuleId, type ThemeName } from "@/lib/store";
import { useT, useSfx } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import {
  AppLogo,
  HomeIcon,
  PomodoroIcon,
  SchulteIcon,
  MeditationIcon,
  BreathingIcon,
  CameraIcon,
  SettingsIcon,
  GitHubIcon,
  GlobeIcon,
  PaletteIcon,
  VolumeIcon,
  VolumeOffIcon,
  MenuIcon,
  CloseIcon,
  CheckIcon,
} from "@/components/icons";

interface NavItem {
  id: ModuleId;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", icon: HomeIcon, labelKey: "nav.home" },
  { id: "pomodoro", icon: PomodoroIcon, labelKey: "nav.pomodoro" },
  { id: "schulte", icon: SchulteIcon, labelKey: "nav.schulte" },
  { id: "meditation", icon: MeditationIcon, labelKey: "nav.meditation" },
  { id: "breathing", icon: BreathingIcon, labelKey: "nav.breathing" },
  { id: "camera", icon: CameraIcon, labelKey: "nav.camera" },
];

const THEMES: { id: ThemeName; labelKey: string; swatch: string }[] = [
  { id: "system", labelKey: "settings.themeSystem", swatch: "linear-gradient(135deg, oklch(0.72 0.16 175), oklch(0.2 0.02 250))" },
  { id: "aurora", labelKey: "settings.themeAurora", swatch: "linear-gradient(135deg, oklch(0.72 0.16 175), oklch(0.78 0.16 90))" },
  { id: "midnight", labelKey: "settings.themeMidnight", swatch: "linear-gradient(135deg, oklch(0.2 0.02 250), oklch(0.72 0.16 180))" },
  { id: "sunset", labelKey: "settings.themeSunset", swatch: "linear-gradient(135deg, oklch(0.66 0.22 30), oklch(0.7 0.18 340))" },
  { id: "forest", labelKey: "settings.themeForest", swatch: "linear-gradient(135deg, oklch(0.58 0.15 155), oklch(0.7 0.16 85))" },
  { id: "rose", labelKey: "settings.themeRose", swatch: "linear-gradient(135deg, oklch(0.65 0.2 350), oklch(0.7 0.16 60))" },
];

const LANGS = [
  { id: "zh" as const, label: "中文" },
  { id: "en" as const, label: "English" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const sfx = useSfx();
  const activeModule = useAppStore((s) => s.activeModule);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const go = (id: ModuleId) => {
    sfx.click();
    setActiveModule(id);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen flex">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen p-4 gap-3">
        {/* Logo */}
        <button
          onClick={() => go("home")}
          onMouseEnter={() => sfx.hover()}
          className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-accent/30 transition-colors"
        >
          <AppLogo className="w-10 h-10" />
          <div className="text-left">
            <div className="font-bold text-lg leading-tight">{t("app.title")}</div>
            <div className="text-[11px] text-muted-foreground leading-tight">{t("app.subtitle")}</div>
          </div>
        </button>

        {/* Nav */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                onMouseEnter={() => sfx.hover()}
                className={cn(
                  "group relative flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all",
                  active
                    ? "text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent/30"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: "var(--primary)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" />
                <span className="relative z-10">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1.5">
          <button
            onClick={() => go("settings")}
            onMouseEnter={() => sfx.hover()}
            className={cn(
              "group relative flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all",
              activeModule === "settings"
                ? "text-primary-foreground"
                : "text-foreground/70 hover:text-foreground hover:bg-accent/30"
            )}
          >
            {activeModule === "settings" && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 rounded-2xl"
                style={{ background: "var(--primary)" }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <SettingsIcon className="w-5 h-5 relative z-10" />
            <span className="relative z-10">{t("nav.settings")}</span>
          </button>

          {/* Top controls row */}
          <div className="flex items-center gap-2 px-1 pt-2">
            <ThemePicker />
            <LangPicker />
            <SoundToggle />
            <a
              href="https://github.com/xlongDev"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => sfx.hover()}
              onClick={() => sfx.click()}
              className="w-9 h-9 rounded-full glass glass-sheen flex items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 active:scale-95 transition-all"
              aria-label="GitHub"
              title="GitHub"
            >
              <GitHubIcon className="w-4.5 h-4.5" style={{ width: "1.05rem", height: "1.05rem" }} />
            </a>
          </div>
        </div>
      </aside>

      {/* ===== Mobile Top Bar ===== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 px-3 py-2.5">
        <div className="glass glass-sheen rounded-2xl px-3 py-2 flex items-center justify-between">
          <button onClick={() => go("home")} className="flex items-center gap-2">
            <AppLogo className="w-8 h-8" />
            <span className="font-bold text-base">{t("app.title")}</span>
          </button>
          <div className="flex items-center gap-1.5">
            <ThemePicker />
            <SoundToggle />
            <a
              href="https://github.com/xlongDev"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sfx.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground active:scale-95 transition-all"
              aria-label="GitHub"
            >
              <GitHubIcon style={{ width: "1.1rem", height: "1.1rem" }} />
            </a>
            <button
              onClick={() => { sfx.click(); setMobileNavOpen(true); }}
              className="w-9 h-9 rounded-full glass glass-sheen flex items-center justify-center text-foreground/80"
              aria-label="Menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Mobile Nav Drawer ===== */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[80vw] glass-strong p-5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AppLogo className="w-8 h-8" />
                  <span className="font-bold">{t("app.title")}</span>
                </div>
                <button
                  onClick={() => { sfx.click(); setMobileNavOpen(false); }}
                  className="w-9 h-9 rounded-full glass flex items-center justify-center"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
                      active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent/30"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {t(item.labelKey)}
                  </button>
                );
              })}
              <button
                onClick={() => go("settings")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
                  activeModule === "settings" ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent/30"
                )}
              >
                <SettingsIcon className="w-5 h-5" />
                {t("nav.settings")}
              </button>
              <div className="mt-auto flex items-center gap-2">
                <LangPicker />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Main Content ===== */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-28 lg:pb-12">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ===== Mobile Bottom Nav ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3">
        <div className="glass-strong glass-sheen rounded-3xl px-2 py-2 flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl transition-all",
                  active ? "text-primary" : "text-foreground/55"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 rounded-2xl bg-primary/15"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" />
                <span className="text-[10px] relative z-10 font-medium">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ThemePicker() {
  const t = useT();
  const sfx = useSfx();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { sfx.click(); setOpen(!open); }}
        onMouseEnter={() => sfx.hover()}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass glass-sheen flex items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 active:scale-95 transition-all"
        aria-label={t("settings.theme")}
        title={t("settings.theme")}
      >
        <PaletteIcon style={{ width: "1.05rem", height: "1.05rem" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-52 glass-strong glass-sheen rounded-2xl p-2 z-50"
          >
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">{t("settings.theme")}</div>
            {THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => { sfx.toggle(); setTheme(th.id); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors",
                  theme === th.id ? "bg-primary/15 text-primary" : "hover:bg-accent/40 text-foreground/80"
                )}
              >
                <span className="w-5 h-5 rounded-full shrink-0 ring-1 ring-white/20" style={{ background: th.swatch }} />
                <span className="flex-1 text-left">{t(th.labelKey)}</span>
                {theme === th.id && <CheckIcon className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LangPicker() {
  const t = useT();
  const sfx = useSfx();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { sfx.click(); setOpen(!open); }}
        onMouseEnter={() => sfx.hover()}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass glass-sheen flex items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 active:scale-95 transition-all"
        aria-label={t("settings.language")}
        title={t("settings.language")}
      >
        <GlobeIcon style={{ width: "1.05rem", height: "1.05rem" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full mb-2 right-0 w-40 glass-strong glass-sheen rounded-2xl p-2 z-50 shadow-2xl"
          >
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">{t("settings.language")}</div>
            {LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => { sfx.toggle(); setLocale(l.id); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  locale === l.id ? "bg-primary/15 text-primary" : "hover:bg-accent/40 text-foreground/80"
                )}
              >
                {l.label}
                {locale === l.id && <CheckIcon className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SoundToggle() {
  const t = useT();
  const sfx = useSfx();
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled);
  return (
    <button
      onClick={() => { setSoundEnabled(!soundEnabled); if (!soundEnabled) sfx.toggle(); }}
      onMouseEnter={() => sfx.hover()}
      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass glass-sheen flex items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 active:scale-95 transition-all"
      aria-label={t("settings.sound")}
      title={t("settings.sound")}
    >
      {soundEnabled ? <VolumeIcon style={{ width: "1.05rem", height: "1.05rem" }} /> : <VolumeOffIcon style={{ width: "1.05rem", height: "1.05rem" }} />}
    </button>
  );
}
