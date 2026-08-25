"use client";

import { useThemeEffect, useAudioInit } from "@/lib/hooks";
import { AuroraBackground } from "@/components/ui/glass";
import { AppShell } from "@/components/layout/AppShell";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useThemeEffect();
  useAudioInit();
  return (
    <>
      <AuroraBackground />
      <AppShell>{children}</AppShell>
    </>
  );
}
