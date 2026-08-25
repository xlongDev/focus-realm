"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuroraBackground } from "@/components/ui/glass";
import { useThemeEffect, useAudioInit } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { HomeModule } from "@/components/modules/HomeModule";
import { PomodoroModule } from "@/components/modules/PomodoroModule";
import { SchulteModule } from "@/components/modules/SchulteModule";
import { MeditationModule } from "@/components/modules/MeditationModule";
import { BreathingModule } from "@/components/modules/BreathingModule";
import { CameraModule } from "@/components/modules/CameraModule";
import { SettingsModule } from "@/components/modules/SettingsModule";

export default function Home() {
  useThemeEffect();
  useAudioInit();
  const activeModule = useAppStore((s) => s.activeModule);

  return (
    <>
      <AuroraBackground />
      <AppShell>
        {activeModule === "home" && <HomeModule />}
        {activeModule === "pomodoro" && <PomodoroModule />}
        {activeModule === "schulte" && <SchulteModule />}
        {activeModule === "meditation" && <MeditationModule />}
        {activeModule === "breathing" && <BreathingModule />}
        {activeModule === "camera" && <CameraModule />}
        {activeModule === "settings" && <SettingsModule />}
      </AppShell>
    </>
  );
}
