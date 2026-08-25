"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useFaceDetection } from "@/lib/useFaceDetection";
import { useSfx } from "@/lib/hooks";
import { computeFocusScore, type BBox, type FacePos, type Landmark } from "@/lib/camera-math";

const W = 80;
const H = 60;

export interface FaceFocusState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  active: boolean;
  error: string | null;
  focusScore: number;
  motionLevel: number;
  brightness: number;
  personDetected: boolean;
  faceBox: BBox | null;
  confidence: number;
  videoSize: { w: number; h: number };
  sessionTime: number;
  focusHistory: number[];
  avgFocus: number;
  peakFocus: number;
  faceLandmarks: Landmark[];
  showLandmarks: boolean;
  setShowLandmarks: (v: boolean) => void;
  landmarkCount: number;
  faceLoading: boolean;
  faceReady: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  onVideoMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
}

// Encapsulates the camera + MediaPipe rAF analysis loop. The heavy work used to
// live inside a ~170-line useEffect in CameraModule; extracting it here keeps
// that component a thin view and lets the scoring logic stay testable.
export function useFaceFocus(): FaceFocusState {
  const { detect: detectFace, ready: faceReady, loading: faceLoading } = useFaceDetection();
  const sfx = useSfx();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const rafRef = useRef<number>(0);
  const focusHistoryRef = useRef<number[]>([]);
  const lastFacePosRef = useRef<FacePos | null>(null);

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusScore, setFocusScore] = useState(0);
  const [motionLevel, setMotionLevel] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [personDetected, setPersonDetected] = useState(false);
  const [faceBox, setFaceBox] = useState<BBox | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });
  const [sessionTime, setSessionTime] = useState(0);
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [avgFocus, setAvgFocus] = useState(0);
  const [peakFocus, setPeakFocus] = useState(0);
  const [faceLandmarks, setFaceLandmarks] = useState<Landmark[]>([]);
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

  // Motion detection & focus analysis with MediaPipe face detection.
  // Throttled to ~5fps for state updates to prevent UI flickering.
  // (videoSize.w is intentionally omitted from deps: it mirrors the original
  // closure-capture behaviour where centeredScore sees the effect-start value.)
  useEffect(() => {
    if (!active || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = W;
    canvas.height = H;

    let lastDetectTime = 0;
    let lastStateUpdate = 0;
    let pendingBrightness = 0;
    let pendingMotion = 0;
    let pendingFocusScore = 0;
    let pendingFaceDetected = false;
    let pendingFaceBox: BBox | null = null;
    let pendingConfidence = 0;
    let pendingLandmarks: Landmark[] = [];
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

        // motion detection (frame difference) + face analysis
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
          let faceBBox: BBox | null = null;
          let faceConf = 0;
          let detectedLandmarks: Landmark[] = [];

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

          pendingFocusScore = computeFocusScore({
            faceDetected,
            landmarks: detectedLandmarks,
            faceBBox,
            avgMotion,
            videoWidth: videoSize.w,
            lastFacePos: lastFacePosRef.current,
          });

          if (faceBBox) {
            lastFacePosRef.current = { x: faceBBox.x, y: faceBBox.y, w: faceBBox.width, h: faceBBox.height };
          }

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

  const onVideoMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setVideoSize({ w: v.videoWidth, h: v.videoHeight });
  }, []);

  return {
    videoRef,
    canvasRef,
    active,
    error,
    focusScore,
    motionLevel,
    brightness,
    personDetected,
    faceBox,
    confidence,
    videoSize,
    sessionTime,
    focusHistory,
    avgFocus,
    peakFocus,
    faceLandmarks,
    showLandmarks,
    setShowLandmarks,
    landmarkCount,
    faceLoading,
    faceReady,
    startCamera,
    stopCamera,
    onVideoMetadata,
  };
}
