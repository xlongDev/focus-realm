"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

// ===== Floating Orbs (ambient particles) =====
export function FloatingOrbs({ count = 6, active = true }: { count?: number; active?: boolean }) {
  const orbs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 20 + Math.random() * 60,
        duration: 8 + Math.random() * 8,
        delay: Math.random() * 4,
        hue: [175, 60, 330, 145, 90][i % 5],
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full blur-xl"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, oklch(0.7 0.15 ${orb.hue} / 0.3) 0%, transparent 70%)`,
          }}
          animate={
            active
              ? {
                  x: [0, 30, -20, 0],
                  y: [0, -25, 15, 0],
                  scale: [1, 1.2, 0.9, 1],
                  opacity: [0.3, 0.6, 0.3, 0.3],
                }
              : { opacity: 0.2 }
          }
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ===== Confetti / Firework burst =====
interface Particle {
  id: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
  delay: number;
}

export function ConfettiBurst({ trigger, colors }: { trigger: number; colors?: string[] }) {
  const [bursts, setBursts] = useState<{ id: number; particles: Particle[] }[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const palette = colors ?? ["oklch(0.72 0.16 175)", "oklch(0.7 0.16 60)", "oklch(0.65 0.2 330)", "oklch(0.78 0.16 90)", "oklch(0.7 0.16 145)"];
    const particles: Particle[] = Array.from({ length: 36 }, (_, i) => ({
      id: i,
      angle: (i / 36) * Math.PI * 2 + Math.random() * 0.3,
      distance: 80 + Math.random() * 140,
      color: palette[i % palette.length],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.1,
    }));
    const id = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBursts((b) => [...b, { id, particles }]);
    const timer = setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1600);
    return () => clearTimeout(timer);
  }, [trigger, colors]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      <AnimatePresence>
        {bursts.map((burst) => (
          <div key={burst.id} className="absolute inset-0 flex items-center justify-center">
            {burst.particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(p.angle) * p.distance,
                  y: Math.sin(p.angle) * p.distance + 60,
                  opacity: 0,
                  scale: 0.3,
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 1.4, delay: p.delay, ease: [0.2, 0.6, 0.3, 1] }}
                className="absolute rounded-sm"
                style={{ width: p.size, height: p.size * 0.6, background: p.color }}
              />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ===== Floating particles (ambient) =====
export function FloatingParticles({ count = 20, colors }: { count?: number; colors?: string[] }) {
  const palette = colors ?? ["var(--primary)", "var(--accent)", "var(--chart-3)"];
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 5,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 8,
        color: palette[i % palette.length],
        drift: (Math.random() - 0.5) * 40,
      })),
    [count, palette]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            filter: "blur(0.5px)",
            opacity: 0.4,
          }}
          animate={{
            y: [0, -80, 0],
            x: [0, p.drift, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ===== Pulsing glow ring =====
export function GlowRing({ color, size = 200, active = true }: { color: string; size?: number; active?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {active && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            border: `2px solid ${color}`,
          }}
          animate={{
            scale: [1, 1.8],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 3,
            delay: i * 1,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ===== Orbiting dots =====
export function OrbitDots({ color, count = 3, radius = 60, duration = 8 }: { color: string; count?: number; radius?: number; duration?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 8,
            height: 8,
            background: color,
            boxShadow: `0 0 12px ${color}`,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: "linear",
          }}
          // position the dot at radius, then rotate the wrapper
          // we use transform-origin trick: wrapper rotates, dot offset
        >
          <div
            style={{
              position: "absolute",
              left: radius,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 12px ${color}`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ===== Ripple effect on click =====
export function Ripple({ trigger, color = "var(--primary)" }: { trigger: number; color?: string }) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    if (trigger === 0) return;
    const id = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRipples((r) => [...r, { id, x: 50, y: 50 }]);
    const timer = setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 800);
    return () => clearTimeout(timer);
  }, [trigger, color]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute rounded-full"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: 100,
              height: 100,
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, ${color}66 0%, transparent 70%)`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ===== Shimmer text =====
export function ShimmerText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <span className="relative z-10">{children}</span>
      <span
        className="absolute inset-0 shimmer-text-bg bg-clip-text text-transparent"
        aria-hidden
      >
        {children}
      </span>
    </span>
  );
}

// ===== Number counter animation =====
export function AnimatedNumber({ value, duration = 0.8, className }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + diff * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{Math.round(display)}</span>;
}
