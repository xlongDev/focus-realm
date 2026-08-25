import type { ModuleId } from "./store";

/** Maps a module id to its real route path. Home is the root. */
export const pathFor = (id: ModuleId): string => (id === "home" ? "/" : `/${id}`);

/** Derives the current module id from a Next.js pathname. */
export const moduleFromPath = (pathname: string): ModuleId => {
  const normalized = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!normalized) return "home";
  return normalized as ModuleId;
};
