"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useT, useSfx } from "@/lib/hooks";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import {
  CameraIcon, CameraOffIcon, PersonIcon, FocusIcon, AlertIcon, StatsIcon, TrendUpIcon,
  FaceMeshIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { useFaceDetection } from "@/lib/useFaceDetection";

export function CameraModule() {
  const t = useT();
  const sfx = useSfx();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const rafRef = useRef<number>(0);
  const focusHistoryRef = useRef<number[]>([]);
  const lastFacePosRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const { detect: detectFace, ready: faceReady, loading: faceLoading } = useFaceDetection();

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusScore, setFocusScore] = useState(0);
  const [motionLevel, setMotionLevel] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [personDetected, setPersonDetected] = useState(false);
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });
  const [sessionTime, setSessionTime] = useState(0);
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [avgFocus, setAvgFocus] = useState(0);
  const [peakFocus, setPeakFocus] = useState(0);
  const [faceLandmarks, setFaceLandmarks] = useState<{ x: number; y: number; z?: number }[]>([]);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [landmarkCount, setLandmarkCount] = useState(0);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      sfx.start();
      setSessionTime(0);
      focusHistoryRef.current = [];
      setFocusHistory([]);
    } catch (e: any) {
      setError(e?.message || "Camera access denied");
      sfx.error();
    }
  }, [sfx]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    prevFrameRef.current = null;
    cancelAnimationFrame(rafRef.current);
    sfx.click();
  }, [sfx]);

  // Session timer
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSessionTime((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  // Motion detection & focus analysis with MediaPipe face detection
  // Throttled to ~5fps for state updates to prevent UI flickering
  useEffect(() => {
    if (!active || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const W = 80;
    const H = 60;
    canvas.width = W;
    canvas.height = H;

    let lastDetectTime = 0;
    let lastStateUpdate = 0;
    // Accumulate values between state updates
    let pendingBrightness = 0;
    let pendingMotion = 0;
    let pendingFocusScore = 0;
    let pendingFaceDetected = false;
    let pendingFaceBox: { x: number; y: number; width: number; height: number } | null = null;
    let pendingConfidence = 0;
    let pendingLandmarks: { x: number; y: number; z?: number }[] = [];
    let pendingLandmarkCount = 0;
    let frameCount = 0;

    const analyze = () => {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, W, H);
        const frame = ctx.getImageData(0, 0, W, H);
        const data = frame.data;

        // brightness
        let brightSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          brightSum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avgBright = brightSum / (data.length / 4);
        pendingBrightness = Math.round((avgBright / 255) * 100);

        // motion detection (frame difference)
        let motionSum = 0;
        if (prevFrameRef.current) {
          const prev = prevFrameRef.current;
          for (let i = 0; i < data.length; i += 4) {
            const dr = Math.abs(data[i] - prev[i]);
            const dg = Math.abs(data[i + 1] - prev[i + 1]);
            const db = Math.abs(data[i + 2] - prev[i + 2]);
            motionSum += (dr + dg + db) / 3;
          }
          const avgMotion = motionSum / (data.length / 4);
          pendingMotion = Math.min(100, avgMotion * 3);

          // MediaPipe face detection (throttled to ~15fps)
          const now = performance.now();
          let faceDetected = false;
          let faceBBox: { x: number; y: number; width: number; height: number } | null = null;
          let faceConf = 0;
          let detectedLandmarks: { x: number; y: number; z?: number }[] = [];

          if (faceReady && now - lastDetectTime > 60) {
            lastDetectTime = now;
            const result = detectFace(video, now);
            faceDetected = result.detected;
            faceBBox = result.boundingBox;
            faceConf = result.confidence;
            detectedLandmarks = result.landmarks || [];
          } else if (!faceReady) {
            // Fallback: simple heuristic when MediaPipe not ready
            const centerStart = (H / 3) * W * 4;
            const centerEnd = (2 * H / 3) * W * 4;
            let centerVar = 0;
            let centerMean = 0;
            let count = 0;
            for (let i = centerStart; i < centerEnd; i += 4) {
              centerMean += (data[i] + data[i + 1] + data[i + 2]) / 3;
              count++;
            }
            centerMean /= count;
            for (let i = centerStart; i < centerEnd; i += 4) {
              centerVar += Math.pow((data[i] + data[i + 1] + data[i + 2]) / 3 - centerMean, 2);
            }
            centerVar = Math.sqrt(centerVar / count);
            faceDetected = centerVar > 15 && avgBright > 30 && avgBright < 230;
          }

          pendingFaceDetected = faceDetected;
          pendingFaceBox = faceBBox;
          pendingConfidence = Math.round(faceConf * 100);
          if (detectedLandmarks.length > 0) {
            pendingLandmarks = detectedLandmarks;
            pendingLandmarkCount = detectedLandmarks.length;
          } else {
            pendingLandmarks = [];
            pendingLandmarkCount = 0;
          }

          // ===== Focus Score Algorithm based on MediaPipe Face Mesh =====
          let score = 0;

          if (faceDetected && detectedLandmarks.length >= 468) {
            // 1. Eye Aspect Ratio (EAR) - detect eye openness
            const leftEAR = calcEAR(detectedLandmarks, 33, 160, 158, 133, 153, 144);
            const rightEAR = calcEAR(detectedLandmarks, 362, 385, 387, 263, 373, 380);
            const avgEAR = (leftEAR + rightEAR) / 2;
            const eyeScore = avgEAR > 0.2 ? 100 : avgEAR > 0.1 ? 50 : 0;

            // 2. Head pose stability
            let headStabilityScore = 100;
            if (faceBBox && lastFacePosRef.current) {
              const dx = Math.abs(faceBBox.x - lastFacePosRef.current.x);
              const dy = Math.abs(faceBBox.y - lastFacePosRef.current.y);
              const faceMovement = Math.sqrt(dx * dx + dy * dy);
              headStabilityScore = Math.max(0, 100 - faceMovement * 2);
            }

            // 3. Body motion score
            const motionScore = Math.max(0, 100 - avgMotion * 4);

            // 4. Face centeredness
            let centeredScore = 100;
            if (faceBBox && videoSize.w > 0) {
              const faceCenter = faceBBox.x + faceBBox.width / 2;
              const frameCenter = videoSize.w / 2;
              const offset = Math.abs(faceCenter - frameCenter) / videoSize.w;
              centeredScore = Math.max(0, 100 - offset * 200);
            }

            // Weighted combination
            score = eyeScore * 0.35 + headStabilityScore * 0.25 + motionScore * 0.25 + centeredScore * 0.15;
          } else if (!faceDetected) {
            score = 10;
          } else {
            score = Math.max(0, 100 - avgMotion * 4) * 0.5;
          }

          if (faceBBox) {
            lastFacePosRef.current = { x: faceBBox.x, y: faceBBox.y, w: faceBBox.width, h: faceBBox.height };
          }
          pendingFocusScore = Math.max(0, Math.min(100, Math.round(score)));

          // Throttle state updates to ~5fps (every 200ms) to prevent UI flickering
          frameCount++;
          if (now - lastStateUpdate > 200) {
            lastStateUpdate = now;
            setBrightness(pendingBrightness);
            setMotionLevel(pendingMotion);
            setPersonDetected(pendingFaceDetected);
            setFaceBox(pendingFaceBox);
            setConfidence(pendingConfidence);
            setFaceLandmarks(pendingLandmarks);
            setLandmarkCount(pendingLandmarkCount);
            setFocusScore(pendingFocusScore);

            focusHistoryRef.current.push(pendingFocusScore);
            if (focusHistoryRef.current.length > 60) focusHistoryRef.current.shift();
            setFocusHistory([...focusHistoryRef.current]);
            const avg = focusHistoryRef.current.reduce((s, v) => s + v, 0) / focusHistoryRef.current.length;
            setAvgFocus(Math.round(avg));
            setPeakFocus(Math.max(...focusHistoryRef.current));
          }
        }
        prevFrameRef.current = new Uint8ClampedArray(data);
      }
      rafRef.current = requestAnimationFrame(analyze);
    };
    analyze();
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, faceReady, detectFace]);

  useEffect(() => () => stopCamera(), [stopCamera]);

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
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                setVideoSize({ w: v.videoWidth, h: v.videoHeight });
              }}
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
                      <span className="text-xs font-medium tabular-nums">{formatSession(sessionTime)}</span>
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
              <div className="text-base font-bold tabular-nums">{formatSession(sessionTime)}</div>
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

// Face oval landmark indices (MediaPipe Face Mesh)
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362];
const LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];

function getFaceContourPath(landmarks: { x: number; y: number; z?: number }[]): string {
  if (landmarks.length === 0) return "";
  const points = FACE_OVAL.map((idx) => {
    if (idx >= landmarks.length) return null;
    const lm = landmarks[idx];
    return `${lm.x},${lm.y}`;
  }).filter(Boolean);
  return `M ${points.join(" L ")} Z`;
}

function getEyeContourPath(landmarks: { x: number; y: number; z?: number }[], side: "left" | "right"): string {
  if (landmarks.length === 0) return "";
  const indices = side === "left" ? LEFT_EYE : RIGHT_EYE;
  const points = indices.map((idx) => {
    if (idx >= landmarks.length) return null;
    const lm = landmarks[idx];
    return `${lm.x},${lm.y}`;
  }).filter(Boolean);
  return `M ${points.join(" L ")} Z`;
}

function getLipsContourPath(landmarks: { x: number; y: number; z?: number }[]): string {
  if (landmarks.length === 0) return "";
  const points = LIPS_OUTER.map((idx) => {
    if (idx >= landmarks.length) return null;
    const lm = landmarks[idx];
    return `${lm.x},${lm.y}`;
  }).filter(Boolean);
  return `M ${points.join(" L ")} Z`;
}

// Eye Aspect Ratio (EAR) calculation - detects eye openness
// EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
// p1=outer corner, p2=top, p3=top inner, p4=inner corner, p5=bottom inner, p6=bottom
function calcEAR(
  landmarks: { x: number; y: number; z?: number }[],
  p1: number, p2: number, p3: number, p4: number, p5: number, p6: number
): number {
  if (landmarks.length <= Math.max(p1, p2, p3, p4, p5, p6)) return 0;
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  const v1 = dist(landmarks[p2], landmarks[p6]);
  const v2 = dist(landmarks[p3], landmarks[p5]);
  const h = dist(landmarks[p1], landmarks[p4]);
  if (h === 0) return 0;
  return (v1 + v2) / (2 * h);
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

function formatSession(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
