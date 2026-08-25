"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Liquid Glass Card
export const GlassCard = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    strong?: boolean;
    sheen?: boolean;
    glow?: boolean;
  }
>(({ className, strong, sheen = true, glow, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      strong ? "glass-strong" : "glass",
      sheen && "glass-sheen",
      glow && "glow-ring",
      "rounded-3xl",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
GlassCard.displayName = "GlassCard";

// Aurora animated background blobs
export function AuroraBackground() {
  return (
    <div className="aurora-bg" aria-hidden>
      <div
        className="aurora-blob"
        style={{
          width: "55vw",
          height: "55vw",
          top: "-15vw",
          left: "-10vw",
          background: "var(--aurora-1)",
          animation: "float-y 14s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: "50vw",
          height: "50vw",
          top: "20vh",
          right: "-15vw",
          background: "var(--aurora-2)",
          animation: "float-y 18s ease-in-out infinite reverse",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: "45vw",
          height: "45vw",
          bottom: "-15vw",
          left: "25vw",
          background: "var(--aurora-3)",
          animation: "float-y 16s ease-in-out infinite",
          animationDelay: "-4s",
        }}
      />
      <div className="absolute inset-0 grid-pattern" />
    </div>
  );
}
