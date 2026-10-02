import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  // Global ignores (replaces ignorePatterns)
  {
    ignores: ["dist/"],
  },

  // Base recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Project-specific config for TS/TSX files
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Disable React Compiler rules (requires React 19 + React Compiler)
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      // react-router's own RouterProvider lacks react-dom's flushSync, and
      // editors offer it first (#198 M73).
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-router",
              importNames: ["RouterProvider"],
              message: "Use RouterProvider from react-router/dom.",
            },
          ],
        },
      ],
    },
  },
);
