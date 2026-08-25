"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface FaceDetectionResult {
  detected: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  confidence: number;
  landmarks: { x: number; y: number; z?: number }[];
}

export function useFaceDetection() {
  const detectorRef = useRef<FaceLandmarker | null>(null);
  const lastTimestampRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
        });
        if (!cancelled) {
          detectorRef.current = landmarker;
          setReady(true);
        }
      } catch {
        // Silently fail - app has fallback heuristic
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
      if (detectorRef.current) {
        try {
          detectorRef.current.close();
        } catch {}
        detectorRef.current = null;
      }
    };
  }, []);

  const detect = useCallback(
    (video: HTMLVideoElement, timestamp: number): FaceDetectionResult => {
      const empty: FaceDetectionResult = { detected: false, boundingBox: null, confidence: 0, landmarks: [] };
      if (!detectorRef.current || video.readyState < 2) {
        return empty;
      }
      try {
        // Ensure monotonically increasing timestamp
        const ts = Math.max(timestamp, lastTimestampRef.current + 1);
        lastTimestampRef.current = ts;
        const result = detectorRef.current.detectForVideo(video, ts);
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          // Compute bounding box from landmarks
          let minX = 1, minY = 1, maxX = 0, maxY = 0;
          for (const lm of landmarks) {
            if (lm.x < minX) minX = lm.x;
            if (lm.x > maxX) maxX = lm.x;
            if (lm.y < minY) minY = lm.y;
            if (lm.y > maxY) maxY = lm.y;
          }
          const bb = {
            x: minX * video.videoWidth,
            y: minY * video.videoHeight,
            width: (maxX - minX) * video.videoWidth,
            height: (maxY - minY) * video.videoHeight,
          };
          return {
            detected: true,
            boundingBox: bb,
            confidence: 0.95,
            landmarks: landmarks.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z })),
          };
        }
      } catch {
        // ignore detection errors
      }
      return empty;
    },
    []
  );

  return { detect, ready, loading };
}
