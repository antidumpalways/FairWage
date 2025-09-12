/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' to allow API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Allow all hosts for Replit proxy environment
  experimental: {
    allowedHosts: true,
  },
  // Configure hostname for development
  hostname: '0.0.0.0',
  port: 5000,
};

module.exports = nextConfig;
