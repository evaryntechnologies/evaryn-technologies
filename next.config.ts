import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Use standard dynamic rendering for authenticated portal routes.
  // Cache Components/instant-navigation prerendering is disabled to avoid
  // build-time blocking-prerender failures on request-dependent pages.
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
