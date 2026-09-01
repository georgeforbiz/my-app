import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { isCloudSyncedProject } = require("./scripts/next-dist-dir.cjs");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cloudSynced = isCloudSyncedProject(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fewer parallel workers reduces flaky missing-chunk errors when `.next` lives on
  // a synced folder (OneDrive) or similar file-locking setups.
  experimental: {
    cpus: 1
  },
  async headers() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }
        ]
      }
    ];
  },
  async redirects() {
    return [
      // Auth aliases to prevent 404s from old/shared links.
      { source: "/signin", destination: "/login", permanent: false },
      { source: "/sign-in", destination: "/login", permanent: false },
      { source: "/signup", destination: "/register", permanent: false },
      { source: "/sign-up", destination: "/register", permanent: false },
      { source: "/registration", destination: "/register", permanent: false },
      { source: "/auth/login", destination: "/login", permanent: false },
      { source: "/auth/register", destination: "/register", permanent: false },
      { source: "/account/login", destination: "/login", permanent: false },
      { source: "/account/register", destination: "/register", permanent: false },
      // Trailing-slash normalization for core app routes.
      { source: "/login/", destination: "/login", permanent: true },
      { source: "/register/", destination: "/register", permanent: true },
      { source: "/dashboard/", destination: "/dashboard", permanent: true },
      { source: "/settings/", destination: "/settings", permanent: true },
      // Legacy deal links now use the agreement route.
      { source: "/deal/:id", destination: "/agreement/:id", permanent: false },
      // Common create-deal variants → dashboard (create flow lives there).
      { source: "/create-deal", destination: "/dashboard", permanent: false },
      { source: "/createDeal", destination: "/dashboard", permanent: false },
      { source: "/create_deal", destination: "/dashboard", permanent: false },
      { source: "/protect", destination: "/dashboard", permanent: false }
    ];
  },
  webpack: (config, { dev }) => {
    // OneDrive-synced folders can intermittently fail webpack pack cache writes.
    // Disable persistent cache in dev to avoid random runtime/build breakages.
    if (dev) {
      config.cache = false;
      if (cloudSynced) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
          ignored: ["**/node_modules/**", "**/.git/**"]
        };
      }
    }
    return config;
  }
};

export default nextConfig;
