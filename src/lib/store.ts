"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "./i18n";

export type ThemeName = "system" | "aurora" | "midnight" | "sunset" | "forest" | "rose" | "ocean" | "lavender" | "amber";
export type ModuleId = "home" | "pomodoro" | "schulte" | "meditation" | "breathing" | "camera" | "settings";

export interface PomodoroTask {
  id: string;
  title: string;
  estPomodoros: number;
  completedPomodoros: number;
  done: boolean;
  createdAt: number;
}

export interface PomodoroSession {
  id: string;
  type: "focus" | "shortBreak" | "longBreak";
  durationSec: number;
  completedAt: number;
  taskId?: string;
}

export interface SchulteRecord {
  id: string;
  gridSize: number;
  durationMs: number;
  errors: number;
  accuracy: number;
  createdAt: number;
}

export interface BreathingSession {
  id: string;
  pattern: string;
  cycles: number;
  totalSec: number;
  createdAt: number;
}

export interface MeditationSession {
  id: string;
  durationSec: number;
  ambient: string;
  completedAt: number;
}

interface AppState {
  // Navigation
  activeModule: ModuleId;
  setActiveModule: (m: ModuleId) => void;

  // Theme & i18n
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  locale: Locale;
  setLocale: (l: Locale) => void;

  // Sound
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  masterVolume: number;
  setMasterVolume: (v: number) => void;

  // Pomodoro settings
  pomoFocusMin: number;
  pomoShortBreakMin: number;
  pomoLongBreakMin: number;
  pomoRoundsBeforeLong: number;
  pomoAutoStartBreaks: boolean;
  pomoAutoStartFocus: boolean;
  setPomoFocusMin: (v: number) => void;
  setPomoShortBreakMin: (v: number) => void;
  setPomoLongBreakMin: (v: number) => void;
  setPomoRoundsBeforeLong: (v: number) => void;
  setPomoAutoStartBreaks: (v: boolean) => void;
  setPomoAutoStartFocus: (v: boolean) => void;

  // Pomodoro data
  pomoTasks: PomodoroTask[];
  addPomoTask: (task: PomodoroTask) => void;
  togglePomoTask: (id: string) => void;
  deletePomoTask: (id: string) => void;
  incrementPomoTask: (id: string) => void;
  pomoSessions: PomodoroSession[];
  addPomoSession: (s: PomodoroSession) => void;

  // Schulte
  schulteRecords: SchulteRecord[];
  addSchulteRecord: (r: SchulteRecord) => void;

  // Breathing
  breathingSessions: BreathingSession[];
  addBreathingSession: (s: BreathingSession) => void;

  // Meditation
  meditationSessions: MeditationSession[];
  addMeditationSession: (s: MeditationSession) => void;

  // Reset
  resetAllData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeModule: "home",
      setActiveModule: (m) => set({ activeModule: m }),

      theme: "system",
      setTheme: (t) => set({ theme: t }),
      locale: "zh",
      setLocale: (l) => set({ locale: l }),

      soundEnabled: true,
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      masterVolume: 0.7,
      setMasterVolume: (v) => set({ masterVolume: v }),

      pomoFocusMin: 25,
      pomoShortBreakMin: 5,
      pomoLongBreakMin: 15,
      pomoRoundsBeforeLong: 4,
      pomoAutoStartBreaks: false,
      pomoAutoStartFocus: false,
      setPomoFocusMin: (v) => set({ pomoFocusMin: v }),
      setPomoShortBreakMin: (v) => set({ pomoShortBreakMin: v }),
      setPomoLongBreakMin: (v) => set({ pomoLongBreakMin: v }),
      setPomoRoundsBeforeLong: (v) => set({ pomoRoundsBeforeLong: v }),
      setPomoAutoStartBreaks: (v) => set({ pomoAutoStartBreaks: v }),
      setPomoAutoStartFocus: (v) => set({ pomoAutoStartFocus: v }),

      pomoTasks: [],
      addPomoTask: (task) =>
        set((st) => ({ pomoTasks: [...st.pomoTasks, task] })),
      togglePomoTask: (id) =>
        set((st) => ({
          pomoTasks: st.pomoTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      deletePomoTask: (id) =>
        set((st) => ({ pomoTasks: st.pomoTasks.filter((t) => t.id !== id) })),
      incrementPomoTask: (id) =>
        set((st) => ({
          pomoTasks: st.pomoTasks.map((t) =>
            t.id === id ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
          ),
        })),
      pomoSessions: [],
      addPomoSession: (s) => set((st) => ({ pomoSessions: [s, ...st.pomoSessions].slice(0, 500) })),

      schulteRecords: [],
      addSchulteRecord: (r) =>
        set((st) => ({ schulteRecords: [r, ...st.schulteRecords].slice(0, 500) })),

      breathingSessions: [],
      addBreathingSession: (s) =>
        set((st) => ({ breathingSessions: [s, ...st.breathingSessions].slice(0, 200) })),

      meditationSessions: [],
      addMeditationSession: (s) =>
        set((st) => ({ meditationSessions: [s, ...st.meditationSessions].slice(0, 200) })),

      resetAllData: () =>
        set({
          pomoTasks: [],
          pomoSessions: [],
          schulteRecords: [],
          breathingSessions: [],
          meditationSessions: [],
        }),
    }),
    {
      name: "focus-realm-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (st) => ({
        theme: st.theme,
        locale: st.locale,
        soundEnabled: st.soundEnabled,
        masterVolume: st.masterVolume,
        pomoFocusMin: st.pomoFocusMin,
        pomoShortBreakMin: st.pomoShortBreakMin,
        pomoLongBreakMin: st.pomoLongBreakMin,
        pomoRoundsBeforeLong: st.pomoRoundsBeforeLong,
        pomoAutoStartBreaks: st.pomoAutoStartBreaks,
        pomoAutoStartFocus: st.pomoAutoStartFocus,
        pomoTasks: st.pomoTasks,
        pomoSessions: st.pomoSessions,
        schulteRecords: st.schulteRecords,
        breathingSessions: st.breathingSessions,
        meditationSessions: st.meditationSessions,
      }),
    }
  )
);
