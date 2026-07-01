import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@prototype/auth', '@prototype/db', '@prototype/icons', '@prototype/ide-tools'],
  // `chromadb` dynamically `import()`s its optional embedding-function
  // provider packages (e.g. `@chroma-core/default-embed`) by a computed
  // specifier. We always pass embeddings explicitly (see
  // packages/memory/src/store/chroma-store.ts) and never rely on that
  // fallback, so those imports are dead code for us. Marking the package
  // external keeps it out of the server bundle (resolved from node_modules
  // at runtime instead), which is what actually matters at runtime.
  serverExternalPackages: ['@prisma/client', 'pg', 'chromadb'],
  webpack: (config) => {
    // Even though chromadb is external at runtime (see above), webpack still
    // does a static pass over its source to build the external module stub,
    // which surfaces two known-benign warnings for its dead optional-import
    // code paths. Silence only those exact warnings so real ones still show.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      (warning: { module?: { resource?: string }; message: string }) =>
        /chromadb[\\/]dist[\\/]chromadb\.mjs/.test(warning.module?.resource ?? '') &&
        (/Critical dependency: the request of a dependency is an expression/.test(warning.message) ||
          /Can't resolve '@chroma-core\/default-embed'/.test(warning.message)),
    ];
    return config;
  },
};

export default nextConfig;
