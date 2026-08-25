"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent?: string;
  className?: string;
}

export function ModuleHeader({ title, desc, icon, accent, className }: ModuleHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-start gap-4", className)}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
        style={{ background: accent || "linear-gradient(135deg, var(--primary), var(--glow))" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{desc}</p>
      </div>
    </motion.div>
  );
}
