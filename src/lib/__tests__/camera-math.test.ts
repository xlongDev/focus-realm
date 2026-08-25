import { describe, it, expect } from "vitest";
import {
  calcEAR,
  computeFocusScore,
  getFaceContourPath,
  getEyeContourPath,
  getLipsContourPath,
  type Landmark,
} from "@/lib/camera-math";

describe("calcEAR", () => {
  it("returns 0 when landmarks are too few", () => {
    expect(calcEAR([], 33, 160, 158, 133, 153, 144)).toBe(0);
    const few: Landmark[] = [{ x: 0, y: 0 }];
    expect(calcEAR(few, 33, 160, 158, 133, 153, 144)).toBe(0);
  });

  it("returns 0 when horizontal distance is 0 (division guard)", () => {
    const lm: Landmark[] = [
      { x: 0, y: 0 }, // p1
      { x: 0, y: 2 }, // p2
      { x: 0, y: 2 }, // p3
      { x: 0, y: 0 }, // p4 -> same as p1 => h === 0
      { x: 0, y: 0 }, // p5
      { x: 0, y: 0 }, // p6
    ];
    expect(calcEAR(lm, 0, 1, 2, 3, 4, 5)).toBe(0);
  });

  it("computes EAR = (|p2-p6| + |p3-p5|) / (2*|p1-p4|)", () => {
    const lm: Landmark[] = [
      { x: 0, y: 0 }, // p1
      { x: 0, y: 2 }, // p2
      { x: 0, y: 2 }, // p3
      { x: 10, y: 0 }, // p4
      { x: 0, y: 0 }, // p5
      { x: 0, y: 0 }, // p6
    ];
    // (2 + 2) / (2 * 10) = 0.2
    expect(calcEAR(lm, 0, 1, 2, 3, 4, 5)).toBeCloseTo(0.2, 5);
  });
});

describe("computeFocusScore", () => {
  it("returns 10 when no face is detected", () => {
    expect(
      computeFocusScore({
        faceDetected: false,
        landmarks: [],
        faceBBox: null,
        avgMotion: 0,
        videoWidth: 0,
        lastFacePos: null,
      })
    ).toBe(10);
  });

  it("falls back to motion-based score when face detected but <468 landmarks", () => {
    // avgMotion 0 -> max(0, 100) * 0.5 = 50
    expect(
      computeFocusScore({
        faceDetected: true,
        landmarks: [{ x: 0, y: 0 }],
        faceBBox: null,
        avgMotion: 0,
        videoWidth: 0,
        lastFacePos: null,
      })
    ).toBe(50);
    // high motion clamps toward 0
    expect(
      computeFocusScore({
        faceDetected: true,
        landmarks: [{ x: 0, y: 0 }],
        faceBBox: null,
        avgMotion: 100,
        videoWidth: 0,
        lastFacePos: null,
      })
    ).toBe(0);
  });

  it("returns a clamped 0-100 score for the full mesh branch", () => {
    const landmarks: Landmark[] = Array.from({ length: 470 }, () => ({ x: 0, y: 0 }));
    const score = computeFocusScore({
      faceDetected: true,
      landmarks,
      faceBBox: { x: 0, y: 0, width: 10, height: 10 },
      avgMotion: 0,
      videoWidth: 20,
      lastFacePos: { x: 0, y: 0, w: 10, h: 10 },
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    // eyeScore=0, headStable=100, motion=100, center=50 -> 57.5 -> 58
    expect(score).toBe(58);
  });
});

describe("face contour path generators", () => {
  const lms: Landmark[] = Array.from({ length: 400 }, (_, i) => ({ x: i, y: i }));

  it("returns empty string for no landmarks", () => {
    expect(getFaceContourPath([])).toBe("");
    expect(getEyeContourPath([], "left")).toBe("");
    expect(getLipsContourPath([])).toBe("");
  });

  it("builds a closed SVG path from face mesh indices", () => {
    const path = getFaceContourPath(lms);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path).toContain("10,10"); // first FACE_OVAL index
  });

  it("builds left/right eye contours", () => {
    const left = getEyeContourPath(lms, "left");
    const right = getEyeContourPath(lms, "right");
    expect(left.startsWith("M")).toBe(true);
    expect(left.endsWith("Z")).toBe(true);
    expect(left).toContain("33,33"); // first LEFT_EYE index
    expect(right).toContain("362,362"); // first RIGHT_EYE index
  });

  it("builds lips contour", () => {
    const path = getLipsContourPath(lms);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path).toContain("61,61"); // first LIPS_OUTER index
  });
});
