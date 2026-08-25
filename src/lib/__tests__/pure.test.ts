import { describe, it, expect } from "vitest";
import { formatTime, formatMs } from "../hooks";
import { translate } from "../i18n";
import { cn } from "../utils";
import { generateSchulteGrid } from "../schulte";

describe("formatTime (pomodoro timer)", () => {
  it("formats seconds as mm:ss", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(5)).toBe("00:05");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(599)).toBe("09:59");
  });
  it("clamps negative input to 00:00", () => {
    expect(formatTime(-10)).toBe("00:00");
  });
});

describe("formatMs", () => {
  it("formats sub-minute durations in seconds", () => {
    expect(formatMs(500)).toBe("0.5s");
    expect(formatMs(5000)).toBe("5.0s");
  });
  it("formats minute+ durations as m s", () => {
    expect(formatMs(65000)).toBe("1m 5s");
  });
});

describe("translate (i18n)", () => {
  it("falls back to the key when missing in any locale", () => {
    expect(translate("zh", "missing.key")).toBe("missing.key");
    expect(translate("en", "missing.key")).toBe("missing.key");
  });
  it("interpolates {params}", () => {
    expect(translate("zh", "hello {name}", { name: "A" })).toBe("hello A");
  });
});

describe("cn (class merge)", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("generateSchulteGrid", () => {
  it("produces n*n cells", () => {
    expect(generateSchulteGrid(3)).toHaveLength(9);
    expect(generateSchulteGrid(5)).toHaveLength(25);
  });
  it("is a permutation of 1..n*n", () => {
    const grid = generateSchulteGrid(4);
    const sorted = [...grid].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });
});
