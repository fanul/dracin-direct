import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // CORS headers for API routes
  // Production-safe defaults with env-configurable origin
  async headers() {
    const allowedOrigin = process.env.CORS_ALLOWED_ORIGIN ||
      (process.env.NODE_ENV === 'production'
        ? 'https://localhost:3000' // Restrictive default - configure CORS_ALLOWED_ORIGIN
        : 'http://localhost:3000');

    return [
      {
        // Apply to all API routes
        source: '/api/:path*',
        headers: [
          // CORS headers
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Request-Id' },
          { key: 'Access-Control-Max-Age', value: '86400' }, // 24 hours preflight cache

          // Security headers
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
