"use client";

import { motion } from "framer-motion";
import { useT, useSfx, formatTime } from "@/lib/hooks";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import {
  CameraIcon, CameraOffIcon, PersonIcon, FocusIcon, AlertIcon, StatsIcon, TrendUpIcon,
  FaceMeshIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { useFaceFocus } from "@/lib/use-face-focus";
import { getFaceContourPath, getEyeContourPath, getLipsContourPath } from "@/lib/camera-math";

export function CameraModule() {
  const t = useT();
  const sfx = useSfx();
  const {
    videoRef, canvasRef, active, error, focusScore, motionLevel, brightness,
    personDetected, faceBox, confidence, videoSize, sessionTime, focusHistory,
    avgFocus, peakFocus, faceLandmarks, showLandmarks, setShowLandmarks,
    landmarkCount, faceLoading, faceReady, startCamera, stopCamera, onVideoMetadata,
  } = useFaceFocus();

  const focusColor = focusScore >= 70 ? "oklch(0.72 0.16 145)" : focusScore >= 40 ? "oklch(0.78 0.16 90)" : "oklch(0.65 0.2 25)";
  const focusLabel = focusScore >= 70 ? t("cam.focused") : focusScore >= 40 ? t("cam.distracted") : t("cam.unfocused");

  const focusedCount = focusHistory.filter((s) => s >= 70).length;
  const distractedCount = focusHistory.filter((s) => s >= 40 && s < 70).length;
  const unfocusedCount = focusHistory.filter((s) => s < 40).length;
  const totalHistory = focusHistory.length;

  return (
    <div className="space-y-5">
      <ModuleHeader
        title={t("cam.title")}
        desc={t("cam.desc")}
        icon={<CameraIcon className="w-5 h-5" />}
        accent="linear-gradient(135deg, oklch(0.7 0.16 220), oklch(0.72 0.16 175))"
      />

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Camera view */}
        <GlassCard className="p-4 sm:p-5" glow>
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/40">
            {/* Video - mirrored */}
            <video
              ref={videoRef}
              playsInline
              muted
              onLoadedMetadata={onVideoMetadata}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-500",
                active ? "opacity-100" : "opacity-0"
              )}
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay when inactive */}
            {!active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 rounded-full glass glass-sheen flex items-center justify-center"
                >
                  <CameraIcon className="w-10 h-10 text-primary" />
                </motion.div>
                <p className="text-sm text-muted-foreground max-w-xs">{t("cam.tips")}</p>
                <Button onClick={startCamera} className="rounded-full gap-2">
                  <CameraIcon className="w-4 h-4" /> {t("cam.start")}
                </Button>
                {error && <p className="text-sm text-rose-500">{error}</p>}
              </div>
            )}

            {/* HUD overlay when active */}
            {active && (
              <>
                {/* Corner brackets */}
                <div className="absolute inset-4 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: focusColor }} />
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: focusColor }} />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: focusColor }} />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: focusColor }} />
                </div>

                {/* Scanning line */}
                <motion.div
                  className="absolute left-0 right-0 h-px pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, ${focusColor}, transparent)`, boxShadow: `0 0 8px ${focusColor}` }}
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Face contour (MediaPipe) - draws face oval outline instead of box */}
                {showLandmarks && faceLandmarks.length > 0 && videoSize.w > 0 && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ transform: "scaleX(-1)" }}
                    viewBox={`0 0 ${videoSize.w} ${videoSize.h}`}
                    preserveAspectRatio="xMidYMid slice"
                  >
                    {/* Face oval contour */}
                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      d={getFaceContourPath(faceLandmarks)}
                      fill="none"
                      stroke={focusColor}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 6px ${focusColor}88)` }}
                    />
                    {/* Eyes contour */}
                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      d={getEyeContourPath(faceLandmarks, "left")}
                      fill="none"
                      stroke={focusColor}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      d={getEyeContourPath(faceLandmarks, "right")}
                      fill="none"
                      stroke={focusColor}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    {/* Lips contour */}
                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      d={getLipsContourPath(faceLandmarks)}
                      fill="none"
                      stroke={focusColor}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    {/* Key landmark dots */}
                    {faceLandmarks.length > 0 && [33, 263, 1, 61, 291, 199].map((idx) => {
                      if (idx >= faceLandmarks.length) return null;
                      const lm = faceLandmarks[idx];
                      return (
                        <circle
                          key={idx}
                          cx={lm.x * videoSize.w}
                          cy={lm.y * videoSize.h}
                          r="4"
                          fill={focusColor}
                          opacity="0.9"
                        />
                      );
                    })}
                  </svg>
                )}

                {/* Top status bar */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-strong">
                    <span className={cn("w-2 h-2 rounded-full animate-pulse", personDetected ? "bg-emerald-400" : "bg-rose-400")} />
                    <span className="text-xs font-medium">
                      {personDetected ? t("cam.detected") : t("cam.notDetected")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {faceLoading && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-strong">
                        <motion.div
                          className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="text-xs font-medium">AI</span>
                      </div>
                    )}
                    {faceReady && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-strong">
                        <span className="text-[10px] font-bold text-emerald-400">AI</span>
                        <span className="text-xs font-medium tabular-nums">{confidence}%</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-strong">
                      <span className="text-xs font-medium tabular-nums">{formatTime(sessionTime)}</span>
                    </div>
                    {/* Face landmarks toggle */}
                    <button
                      onClick={() => { sfx.click(); setShowLandmarks(!showLandmarks); }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-strong transition-all hover:scale-105",
                        showLandmarks && landmarkCount > 0 ? "text-cyan-300" : "text-white/60"
                      )}
                      title={showLandmarks ? t("cam.hideLandmarks") : t("cam.showLandmarks")}
                    >
                      <FaceMeshIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium tabular-nums">{landmarkCount > 0 ? landmarkCount : "—"}</span>
                    </button>
                  </div>
                </div>

                {/* Focus score badge */}
                <div className="absolute bottom-4 left-4">
                  <div className="px-4 py-2 rounded-2xl glass-strong flex items-center gap-3">
                    <FocusGauge score={focusScore} color={focusColor} />
                    <div>
                      <div className="text-xs text-white/70 uppercase tracking-wider">{t("cam.focusScore")}</div>
                      <div className="text-lg font-bold text-white">{focusScore}</div>
                    </div>
                  </div>
                </div>

                {/* Status label */}
                <div className="absolute bottom-4 right-4">
                  <div className="px-3 py-1.5 rounded-full glass-strong text-xs font-bold" style={{ color: focusColor }}>
                    {focusLabel}
                  </div>
                </div>

                {/* Stop button */}
                <button
                  onClick={stopCamera}
                  className="absolute top-4 right-1/2 translate-x-1/2 w-9 h-9 rounded-full glass-strong flex items-center justify-center text-white/80 hover:text-white hover:scale-105 transition-all"
                  title={t("common.stop")}
                >
                  <CameraOffIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </GlassCard>

        {/* Metrics sidebar */}
        <div className="space-y-4">
          {/* Focus score */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--foreground)" strokeOpacity="0.1" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" stroke={focusColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(focusScore / 100) * 264} 264`}
                    style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.5s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold tabular-nums">{focusScore}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FocusIcon className="w-4 h-4 text-primary" />
                  <span className="font-bold">{t("cam.focusScore")}</span>
                </div>
                <div className="text-lg font-bold mt-0.5" style={{ color: focusColor }}>{focusLabel}</div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>{t("cam.avgFocus")}: <b className="text-foreground">{avgFocus}</b></span>
                  <span>{t("cam.peakFocus")}: <b className="text-foreground">{peakFocus}</b></span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Focus curve */}
          <GlassCard className="p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><TrendUpIcon className="w-4 h-4 text-primary" /> {t("cam.focusChart")}</h3>
            {focusHistory.length > 1 ? (
              <FocusChart data={focusHistory} color={focusColor} />
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">{t("common.noData")}</div>
            )}
          </GlassCard>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5 text-primary"><PersonIcon className="w-3.5 h-3.5" /></div>
              <div className="text-base font-bold truncate">{personDetected ? t("cam.detected") : t("cam.notDetected")}</div>
              <div className="text-[11px] text-muted-foreground">{t("cam.faceDetected")}</div>
            </GlassCard>
            <GlassCard className="p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5 text-primary"><AlertIcon className="w-3.5 h-3.5" /></div>
              <div className="text-base font-bold tabular-nums">{Math.round(motionLevel)}%</div>
              <div className="text-[11px] text-muted-foreground">{t("cam.motion")}</div>
            </GlassCard>
            <GlassCard className="p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5 text-primary"><StatsIcon className="w-3.5 h-3.5" /></div>
              <div className="text-base font-bold tabular-nums">{brightness}%</div>
              <div className="text-[11px] text-muted-foreground">{t("cam.brightness")}</div>
            </GlassCard>
            <GlassCard className="p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5 text-primary"><CameraIcon className="w-3.5 h-3.5" /></div>
              <div className="text-base font-bold tabular-nums">{formatTime(sessionTime)}</div>
              <div className="text-[11px] text-muted-foreground">{t("cam.sessionTime")}</div>
            </GlassCard>
          </div>

          {/* Focus distribution */}
          {focusHistory.length > 5 && (
            <GlassCard className="p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><StatsIcon className="w-4 h-4 text-primary" /> {t("cam.focusDistribution")}</h3>
              <div className="space-y-2">
                {[
                  { label: t("cam.focusedTime"), count: focusedCount, color: "oklch(0.72 0.16 145)" },
                  { label: t("cam.distractedTime"), count: distractedCount, color: "oklch(0.78 0.16 90)" },
                  { label: t("cam.unfocusedTime"), count: unfocusedCount, color: "oklch(0.65 0.2 25)" },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{b.label}</span>
                      <span className="font-bold tabular-nums">{Math.round((b.count / totalHistory) * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full glass overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: b.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(b.count / totalHistory) * 100}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

function FocusGauge({ score, color }: { score: number; color: string }) {
  return (
    <div className="relative w-10 h-10">
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        <circle cx="20" cy="20" r="16" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="3" />
        <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(score / 100) * 100.5} 100.5`} style={{ transition: "stroke-dasharray 0.5s ease" }} />
      </svg>
    </div>
  );
}

function FocusChart({ data, color }: { data: number[]; color: string }) {
  const w = 260;
  const h = 80;
  const pad = 6;
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const points = data.map((v, i) => ({ x: pad + i * stepX, y: h - pad - (v / 100) * (h - pad * 2) }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 1 ? `${path} L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z` : "";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      <defs>
        <linearGradient id="focusArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#focusArea)" />}
      {path && <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      {points.length > 0 && <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={color} />}
    </svg>
  );
}
