import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

// `eslint-config-next`'s `core-web-vitals.js`/`typescript.js` entrypoints still
// ship legacy eslintrc-style objects (`{ extends: [...] }`), not flat-config
// arrays, so they can't be spread directly into a flat config. FlatCompat
// converts them for us — this is the approach documented by Next.js for
// ESLint 9 flat config until `eslint-config-next` ships native flat exports.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // User-generated static sites managed by the public-dev IDE — not app source.
    "sites/**",
  ]),
]);

export default eslintConfig;
