import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Shared workspace package ships raw TS — Next must transpile it.
  transpilePackages: ['@bowlkollen/core'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'bits.swebowl.se' },
      // Ball catalog photos (bowwwl.com API — attribution shown in-app).
      { protocol: 'https', hostname: 'www.bowwwl.com' },
      // Supabase Storage — player profile photos in the `avatars` bucket.
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
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
};
export default nextConfig;
