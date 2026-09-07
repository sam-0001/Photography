import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "mongodb-memory-server", "bcryptjs"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
