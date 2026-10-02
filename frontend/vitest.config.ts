import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

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
