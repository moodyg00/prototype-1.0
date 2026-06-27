import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@prototype/auth', '@prototype/db'],
  serverExternalPackages: ['@prisma/client', 'pg', 'playwright', 'playwright-core'],
  experimental: {
    // Disable eager route loading at startup — agent has heavy deps (langchain,
    // playwright) that would significantly delay port binding on shared hosting.
    preloadEntriesOnStart: false,
  },
};

export default nextConfig;
