import type { NextConfig } from "next";

// Next 16 blocks cross-origin access to dev resources (HMR + hydration) by default.
// Allow local hosts, plus any preview/proxy hosts listed in DEV_ORIGINS (comma-separated).
const devOrigins = [
  "127.0.0.1",
  "0.0.0.0",
  ...(process.env.DEV_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
