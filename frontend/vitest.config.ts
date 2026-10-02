import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { site } from "./scripts/vite-site";

export default defineConfig({
  plugins: [react()],
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
    // Two projects, each with its own site() (#191). A test reads its site as
    // `virtual:site-config` and `@site/...`.
    projects: [
      {
        extends: true,
        // The fictional site.example, so the owner's own edits to site/ can't
        // turn these red, and a fork's tests pass before it changes anything.
        // A commit of the tests' own, so the footer's link doesn't follow
        // the shell.
        plugins: [site({ dir: "site.example", commit: "c0ffee" })],
        test: {
          name: "unit",
          include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
          exclude: [...configDefaults.exclude, "src/site-check/**"],
        },
      },
      {
        extends: true,
        // The active site (SITE_DIR, else site/): the rules its own content
        // must meet. `npm run site:check` runs this project alone.
        plugins: [site()],
        test: {
          name: "site",
          include: ["src/site-check/**/*.{test,spec}.{js,ts,jsx,tsx}"],
        },
      },
    ],
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
