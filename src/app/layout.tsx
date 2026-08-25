import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "专注境 Focus Realm — 液态玻璃专注力监控系统",
  description:
    "融合番茄工作法、舒尔特方格、正念冥想、呼吸训练与摄像头专注监测的全功能专注力训练系统，采用液态玻璃美学设计。",
  keywords: [
    "专注力",
    "番茄钟",
    "舒尔特方格",
    "正念冥想",
    "呼吸训练",
    "Focus",
    "Pomodoro",
    "Schulte",
    "Meditation",
    "Liquid Glass",
  ],
  authors: [{ name: "xlongDev" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon.svg" }],
  },
  manifest: undefined,
  openGraph: {
    title: "专注境 Focus Realm",
    description: "液态玻璃专注力监控系统",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#141828" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
