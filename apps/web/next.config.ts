import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'bits.swebowl.se' },
    ],
  },
  // Dev only: Next 16 blocks cross-origin requests to dev assets, which breaks
  // phone testing over LAN (JS chunks never load → no hydration, no taps).
  // Allow Bonjour hostnames and private network ranges.
  allowedDevOrigins: [
    '*.local',        // macbook-air-som-tillhor-carina.local etc.
    '10.*.*.*',
    '192.168.*.*',
    '172.20.10.*',    // iPhone personal hotspot
  ],
  async redirects() {
    if (process.env.NODE_ENV !== 'production') return []
    return [{ source: '/', destination: '/landing', permanent: false }]
  },
};
export default nextConfig;
