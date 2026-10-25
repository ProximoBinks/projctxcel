import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", ".netlify/**", ".vercel/**", "coverage/**", "out/**", "build/**", "convex/_generated/**", "next-env.d.ts"]),
  { rules: { "@next/next/no-img-element": "off" } },
]);
