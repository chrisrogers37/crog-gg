/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** The repo this site is built from; the footer links to it when set. */
  readonly VITE_SOURCE_REPO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
