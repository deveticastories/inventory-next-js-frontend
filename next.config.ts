import type { NextConfig } from "next";
import { BACKEND_URL } from "./src/constants/ApiConstants";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Proxy /api/* to the HTTP backend so the HTTPS site never makes a mixed-content request.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
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
