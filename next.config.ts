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
        { source: "/overview", destination: "/index.html" },
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
  async redirects() {
    return [
      { source: "/index.html", destination: "/overview", permanent: true },
      { source: "/index", destination: "/overview", permanent: true },
      { source: "/chamber.html", destination: "/chamber", permanent: true },
      { source: "/bench.html", destination: "/bench", permanent: true },
      { source: "/ledger.html", destination: "/ledger", permanent: true },
      { source: "/verdict.html", destination: "/verdict", permanent: true },
      { source: "/method.html", destination: "/method", permanent: true },
      { source: "/disclaimer.html", destination: "/disclaimer", permanent: true },
    ];
  },
};

export default nextConfig;
