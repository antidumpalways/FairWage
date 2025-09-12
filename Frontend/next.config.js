/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' to allow API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Configure hostname and port via script parameters instead
  // Next.js doesn't support hostname/port in config for development
};

module.exports = nextConfig;
