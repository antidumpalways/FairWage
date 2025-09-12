/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' to allow API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  
  // Production optimization
  swcMinify: true,
  experimental: {
    // Reduce memory usage
    isrMemoryCacheSize: 0,
  },
  
  // Configure for production deployment
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Output configuration for standalone deployment
  output: 'standalone',
  
  
  // Configure hostname and port via script parameters instead
  // Next.js doesn't support hostname/port in config for development
};

module.exports = nextConfig;
