"use client";

import dynamic from "next/dynamic";

// Camera pulls in the MediaPipe ML runtime; load it on demand so it stays
// out of the initial bundle. Browser-only, hence ssr:false.
const CameraModule = dynamic(
  () => import("@/components/modules/CameraModule").then((m) => m.CameraModule),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        加载摄像头模块…
      </div>
    ),
  }
);

export default function Page() {
  return <CameraModule />;
}
