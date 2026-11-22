import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nexconn/chat", "@nexconn/engine", "@nexconn/call"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
