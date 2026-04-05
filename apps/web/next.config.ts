import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: [
    "@cube-arcade/game-sdk",
    "@cube-arcade/game-engine",
    "@cube-arcade/smartcube",
    "@cube-arcade/testing",
    "@cube-arcade/ui",
  ],
};

export default nextConfig;
