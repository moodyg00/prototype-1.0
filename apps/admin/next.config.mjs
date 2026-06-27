import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@prototype/auth', '@prototype/db', '@prototype/media'],
  serverExternalPackages: ['@prisma/client', 'pg'],
};

export default nextConfig;
