import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        { source: "/chamber", destination: "/chamber.html" },
        { source: "/bench", destination: "/bench.html" },
        { source: "/ledger", destination: "/ledger.html" },
        { source: "/verdict", destination: "/verdict.html" },
        { source: "/verdict/:id", destination: "/verdict.html?id=:id" },
        { source: "/method", destination: "/method.html" },
        { source: "/disclaimer", destination: "/disclaimer.html" },
        { source: "/legal/disclaimer", destination: "/disclaimer.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
