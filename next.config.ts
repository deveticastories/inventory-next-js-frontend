import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Proxy /api/* to the HTTP backend so the HTTPS site never makes a mixed-content request.
  async rewrites() {
    const backend = process.env.API_BACKEND_URL ?? "http://3.107.18.59:4005";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
  partialPrefetching: true,
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
