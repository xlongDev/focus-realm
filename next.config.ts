import type { NextConfig } from "next";

// When building for GitHub Pages the site is served from a sub-path
// (https://xlongDev.github.io/focus-realm/). We only apply the base path
// during the CI build (GITHUB_PAGES=true) so local `next dev` stays at root.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/focus-realm" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  images: {
    // GitHub Pages cannot run the Next.js image optimizer.
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
