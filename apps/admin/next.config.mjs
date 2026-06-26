/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@prototype/auth', '@prototype/db', '@prototype/media'],
  serverExternalPackages: ['@prisma/client', 'pg'],
};

export default nextConfig;
