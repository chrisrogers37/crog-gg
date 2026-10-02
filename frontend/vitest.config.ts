import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { site } from "./scripts/vite-site";

export default defineConfig({
  // site() also lets tests read the site's files as @site/... (#188).
  // A commit of the tests' own, so the footer's link doesn't follow the shell.
  plugins: [react(), site({ commit: "c0ffee" })],
  resolve: {
    // Node's own resolution includes "module-sync"; vitest's doesn't, and
    // react-router's Node exports give ESM only under it. Without it, a test
    // loads "react-router" as CommonJS while "react-router/dom" requires the
    // ESM copy, and the two copies don't share a router context. vitest adds
    // its own "node" and "development|production" to these.
    conditions: ["module-sync"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
    },
  },
});
