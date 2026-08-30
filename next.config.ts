import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Produces a self-contained server bundle (.next/standalone) with only
  // the node_modules actually needed at runtime - the difference between a
  // ~1GB and a ~150MB container image, and Next's own recommended shape
  // for deploying behind a plain Dockerfile (Cloud Run, here).
  output: "standalone",
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
