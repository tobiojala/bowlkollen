import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.0.45'],
  async redirects() {
    return [
      { source: '/', destination: '/landing', permanent: false },
    ]
  },
};

export default nextConfig;
