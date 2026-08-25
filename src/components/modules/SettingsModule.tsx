"use client";

import { motion } from "framer-motion";
import { useAppStore, type ThemeName } from "@/lib/store";
import { useT, useSfx } from "@/lib/hooks";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  SettingsIcon, PaletteIcon, GlobeIcon, VolumeIcon, InfoIcon, TrashIcon, AppLogo, GitHubIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const THEMES: { id: ThemeName; labelKey: string; swatch: string }[] = [
  { id: "system", labelKey: "settings.themeSystem", swatch: "linear-gradient(135deg, oklch(0.72 0.16 175), oklch(0.2 0.02 250))" },
  { id: "aurora", labelKey: "settings.themeAurora", swatch: "linear-gradient(135deg, oklch(0.72 0.16 175), oklch(0.78 0.16 90))" },
  { id: "midnight", labelKey: "settings.themeMidnight", swatch: "linear-gradient(135deg, oklch(0.25 0.05 250), oklch(0.3 0.08 220))" },
  { id: "sunset", labelKey: "settings.themeSunset", swatch: "linear-gradient(135deg, oklch(0.7 0.16 60), oklch(0.65 0.2 25))" },
  { id: "forest", labelKey: "settings.themeForest", swatch: "linear-gradient(135deg, oklch(0.72 0.16 145), oklch(0.6 0.12 160))" },
  { id: "rose", labelKey: "settings.themeRose", swatch: "linear-gradient(135deg, oklch(0.65 0.2 330), oklch(0.7 0.16 350))" },
  { id: "ocean", labelKey: "settings.themeOcean", swatch: "linear-gradient(135deg, oklch(0.6 0.16 220), oklch(0.7 0.15 190))" },
  { id: "lavender", labelKey: "settings.themeLavender", swatch: "linear-gradient(135deg, oklch(0.62 0.18 290), oklch(0.7 0.16 330))" },
  { id: "amber", labelKey: "settings.themeAmber", swatch: "linear-gradient(135deg, oklch(0.68 0.16 75), oklch(0.65 0.18 40))" },
];

const LANGS = [
  { id: "zh" as const, label: "中文" },
  { id: "en" as const, label: "English" },
];

export function SettingsModule() {
  const t = useT();
  const sfx = useSfx();
  const {
    theme, setTheme, locale, setLocale,
    soundEnabled, setSoundEnabled, masterVolume, setMasterVolume,
    resetAllData,
    pomoSessions, schulteRecords, breathingSessions, meditationSessions,
  } = useAppStore();

  const handleReset = () => {
    if (confirm(t("settings.resetConfirm"))) {
      resetAllData();
      sfx.complete();
      toast.success(t("settings.resetData"));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: "linear-gradient(135deg, var(--primary), var(--glow))" }}>
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("settings.aboutDesc")}</p>
        </div>
      </motion.div>

      {/* Theme */}
      <GlassCard className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><PaletteIcon className="w-4 h-4 text-primary" /> {t("settings.theme")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => { sfx.toggle(); setTheme(th.id); }}
              onMouseEnter={() => sfx.hover()}
              className={cn(
                "relative p-4 rounded-2xl transition-all overflow-hidden",
                theme === th.id ? "ring-2 ring-primary scale-[1.02]" : "glass glass-sheen hover:scale-[1.01]"
              )}
            >
              <div className="w-full h-16 rounded-xl mb-2" style={{ background: th.swatch }} />
              <div className="text-sm font-medium text-left">{t(th.labelKey)}</div>
              {theme === th.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</div>
              )}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Language */}
      <GlassCard className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><GlobeIcon className="w-4 h-4 text-primary" /> {t("settings.language")}</h3>
        <div className="grid grid-cols-2 gap-3">
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => { sfx.toggle(); setLocale(l.id); }}
              onMouseEnter={() => sfx.hover()}
              className={cn(
                "p-4 rounded-2xl text-center font-medium transition-all",
                locale === l.id ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" : "glass glass-sheen hover:scale-[1.01]"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Sound */}
      <GlassCard className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><VolumeIcon className="w-4 h-4 text-primary" /> {t("settings.sound")}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl glass">
            <span className="text-sm font-medium">{t("settings.sound")}</span>
            <Switch checked={soundEnabled} onCheckedChange={(v) => { setSoundEnabled(v); if (v) sfx.toggle(); }} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t("settings.masterVolume")}</span>
              <span className="text-sm font-bold text-primary tabular-nums">{Math.round(masterVolume * 100)}%</span>
            </div>
            <Slider value={[masterVolume * 100]} min={0} max={100} step={5} onValueChange={(v) => { setMasterVolume(v[0] / 100); if (v[0] > 0) sfx.click(); }} />
          </div>
        </div>
      </GlassCard>

      {/* Data stats */}
      <GlassCard className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><InfoIcon className="w-4 h-4 text-primary" /> {t("common.history")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <DataStat label={t("nav.pomodoro")} value={pomoSessions.length} />
          <DataStat label={t("nav.schulte")} value={schulteRecords.length} />
          <DataStat label={t("nav.breathing")} value={breathingSessions.length} />
          <DataStat label={t("nav.meditation")} value={meditationSessions.length} />
        </div>
        <Button onClick={handleReset} variant="outline" className="gap-2 text-rose-500 hover:text-rose-600">
          <TrashIcon className="w-4 h-4" /> {t("settings.resetData")}
        </Button>
      </GlassCard>

      {/* About */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-4">
          <AppLogo className="w-14 h-14 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold">{t("app.title")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("settings.aboutDesc")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("footer.madeWith")}</p>
          </div>
          <a
            href="https://github.com/xlongDev"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => sfx.hover()}
            onClick={() => sfx.click()}
            className="w-11 h-11 rounded-full glass glass-sheen flex items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 transition-all"
            title="GitHub"
          >
            <GitHubIcon className="w-5 h-5" />
          </a>
        </div>
      </GlassCard>
    </div>
  );
}

function DataStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-xl glass text-center">
      <div className="text-2xl font-bold tabular-nums gradient-text">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
