import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acesso de rede local no dev server do Next.js sem bloquear chunks de JS
  allowedDevOrigins: [
    "192.168.15.10",
    "192.168.15.10:3000",
    "localhost",
    "localhost:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
