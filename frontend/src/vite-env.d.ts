/// <reference types="vite/client" />

interface ViteTypeOptions {
  // A misspelt env key is a compile error, not an `any`.
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

/** The commit the build is from, or "" (scripts/vite-site.ts, #188). */
declare const __SITE_COMMIT__: string;

/** site/site.yaml, checked at build time (scripts/vite-site.ts, #188). */
declare module "virtual:site-config" {
  const config: import("./config/schema").SiteConfig;
  export default config;
}
