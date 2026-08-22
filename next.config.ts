import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/knowledge-hub",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
