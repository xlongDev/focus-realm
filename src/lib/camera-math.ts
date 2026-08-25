// Pure, framework-agnostic helpers for the camera focus module.
// Extracted from CameraModule so the focus algorithm, eye-aspect-ratio and
// face-contour path generators can be unit-tested without a camera or DOM.

export type Landmark = { x: number; y: number; z?: number };
export type BBox = { x: number; y: number; width: number; height: number };
export type FacePos = { x: number; y: number; w: number; h: number };

// Face oval landmark indices (MediaPipe Face Mesh)
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362];
const LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];

function pointsToPath(landmarks: Landmark[], indices: number[]): string {
  const points = indices
    .map((idx) => {
      if (idx >= landmarks.length) return null;
      const lm = landmarks[idx];
      return `${lm.x},${lm.y}`;
    })
    .filter(Boolean);
  return points.length ? `M ${points.join(" L ")} Z` : "";
}

export function getFaceContourPath(landmarks: Landmark[]): string {
  return pointsToPath(landmarks, FACE_OVAL);
}

export function getEyeContourPath(landmarks: Landmark[], side: "left" | "right"): string {
  return pointsToPath(landmarks, side === "left" ? LEFT_EYE : RIGHT_EYE);
}

export function getLipsContourPath(landmarks: Landmark[]): string {
  return pointsToPath(landmarks, LIPS_OUTER);
}

// Eye Aspect Ratio (EAR) - detects eye openness.
// EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
// p1=outer corner, p2=top, p3=top inner, p4=inner corner, p5=bottom inner, p6=bottom
export function calcEAR(
  landmarks: Landmark[],
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

export interface FocusScoreInput {
  faceDetected: boolean;
  landmarks: Landmark[];
  faceBBox: BBox | null;
  avgMotion: number;
  videoWidth: number;
  lastFacePos: FacePos | null;
}

// Weighted focus score (0-100) from face mesh + motion + centering.
export function computeFocusScore(input: FocusScoreInput): number {
  const { faceDetected, landmarks, faceBBox, avgMotion, videoWidth, lastFacePos } = input;
  let score = 0;

  if (faceDetected && landmarks.length >= 468) {
    const leftEAR = calcEAR(landmarks, 33, 160, 158, 133, 153, 144);
    const rightEAR = calcEAR(landmarks, 362, 385, 387, 263, 373, 380);
    const avgEAR = (leftEAR + rightEAR) / 2;
    const eyeScore = avgEAR > 0.2 ? 100 : avgEAR > 0.1 ? 50 : 0;

    let headStabilityScore = 100;
    if (faceBBox && lastFacePos) {
      const dx = Math.abs(faceBBox.x - lastFacePos.x);
      const dy = Math.abs(faceBBox.y - lastFacePos.y);
      const faceMovement = Math.sqrt(dx * dx + dy * dy);
      headStabilityScore = Math.max(0, 100 - faceMovement * 2);
    }

    const motionScore = Math.max(0, 100 - avgMotion * 4);

    let centeredScore = 100;
    if (faceBBox && videoWidth > 0) {
      const faceCenter = faceBBox.x + faceBBox.width / 2;
      const frameCenter = videoWidth / 2;
      const offset = Math.abs(faceCenter - frameCenter) / videoWidth;
      centeredScore = Math.max(0, 100 - offset * 200);
    }

    score = eyeScore * 0.35 + headStabilityScore * 0.25 + motionScore * 0.25 + centeredScore * 0.15;
  } else if (!faceDetected) {
    score = 10;
  } else {
    score = Math.max(0, 100 - avgMotion * 4) * 0.5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
