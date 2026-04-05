import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@cube-arcade/game-engine",
    "@cube-arcade/smartcube",
    "@cube-arcade/testing",
    "@cube-arcade/ui",
  ],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;

