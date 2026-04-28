/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fewer parallel workers reduces flaky missing-chunk errors when `.next` lives on
  // a synced folder (OneDrive) or similar file-locking setups.
  experimental: {
    cpus: 1
  },
  async redirects() {
    return [
      // Auth aliases to prevent 404s from old/shared links.
      { source: "/signin", destination: "/login", permanent: false },
      { source: "/sign-in", destination: "/login", permanent: false },
      { source: "/signup", destination: "/register", permanent: false },
      { source: "/sign-up", destination: "/register", permanent: false },
      { source: "/registration", destination: "/register", permanent: false },
      // Legacy deal links now use the agreement route.
      { source: "/deal/:id", destination: "/agreement/:id", permanent: false },
      // Common create-deal variants.
      { source: "/createDeal", destination: "/create-deal", permanent: false },
      { source: "/create_deal", destination: "/create-deal", permanent: false }
    ];
  },
  webpack: (config, { dev }) => {
    // OneDrive-synced folders can intermittently fail webpack pack cache writes.
    // Disable persistent cache in dev to avoid random runtime/build breakages.
    if (dev) {
      config.cache = false;
    }
    return config;
  }
};

export default nextConfig;
