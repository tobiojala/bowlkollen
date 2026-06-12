import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.0.45'],
  async redirects() {
    if (process.env.NODE_ENV !== 'production') return []
    return [{ source: '/', destination: '/landing', permanent: false }]
  },
};
export default nextConfig;
