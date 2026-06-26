import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@prototype/auth', '@prototype/db'],
  serverExternalPackages: ['@prisma/client', 'pg'],
};

export default nextConfig;
