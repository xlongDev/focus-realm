"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        style: {
          background: "var(--glass-bg, rgba(255,255,255,0.45))",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid var(--glass-border, rgba(255,255,255,0.6))",
          borderRadius: "1.5rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.4)",
          color: "var(--foreground)",
        },
      }}
      style={
        {
          "--normal-bg": "var(--glass-bg, rgba(255,255,255,0.45))",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--glass-border, rgba(255,255,255,0.6))",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
