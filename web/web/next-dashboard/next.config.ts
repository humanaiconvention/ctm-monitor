import type { NextConfig } from "next";

// Power Pages integration: enable static export. All dynamic features should be client-side only.
// If you later introduce dynamic routes requiring server runtime, you may need an alternate deploy path.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // Optionally set a basePath if embedding under a subpath. Use env variable pattern if needed.
  // basePath: process.env.DASHBOARD_BASE_PATH || undefined,
  // Ensure trailingSlash for simpler static portal hosting (optional, commented out for now):
  // trailingSlash: true,
};

export default nextConfig;
