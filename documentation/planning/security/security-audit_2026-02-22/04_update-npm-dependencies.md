# Phase 04: Update npm Dependencies and Resolve Audit Advisories

**Status:** ✅ COMPLETE
**Started:** 2026-02-22
**Completed:** 2026-02-22

| Field                  | Value                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| **PR Title**           | chore: update npm dependencies and resolve audit advisories                                          |
| **Risk Level**         | Medium (ESLint config format migration, Vite 4→7 major version jump)                                 |
| **Effort**             | Medium (3-4 hours)                                                                                   |
| **Files Modified**     | 4 (`frontend/package.json`, `frontend/package-lock.json`, `package.json`, `frontend/vite.config.ts`) |
| **Files Created**      | 1 (`frontend/eslint.config.js`)                                                                      |
| **Files Deleted**      | 1 (`frontend/.eslintrc.cjs`)                                                                         |
| **Findings Addressed** | #8 (MEDIUM - 13 high-severity npm advisories), #11 (LOW - 20 outdated packages)                      |
| **Dependencies**       | None                                                                                                 |
| **Unlocks**            | None                                                                                                 |

---

## Context

The npm audit reports 20 advisories total: 13 high-severity (from `minimatch` via `@eslint/eslintrc` and `@humanwhocodes/config-array` - transitive dependencies of ESLint 8.x), 6 moderate (Vite `server.fs.deny` bypasses + `@babel/helpers` RegExp complexity), and 1 low. Additionally, 20 npm packages are outdated.

Upgrading ESLint 8 to 9 eliminates the vulnerable transitive deps entirely, resolving all 13 high advisories. Upgrading Vite 4→7 and `@vitejs/plugin-react` 4→5 resolves the 6 moderate advisories (Vite fs bypasses fixed, and v5 switches from Babel to Oxc, eliminating `@babel/helpers`). In total, this phase resolves 19 of 20 advisories. ESLint 9 drops support for the legacy `.eslintrc` format and requires migrating to flat config (`eslint.config.js`).

React 18 to 19 is explicitly **not** part of this PR.

---

## Dependencies

- **Depends on:** None.
- **Unlocks:** None.
- **Parallel safety:** Touches `frontend/package.json`, `frontend/.eslintrc.cjs`, `frontend/eslint.config.js`, `frontend/vite.config.ts`, and root `package.json`. No other security phase touches these files.

---

## Detailed Implementation Plan

Split into three sequential sub-phases within the same branch.

### Phase A: Safe Patch/Minor Updates

**Step A1: Update patch-level dependencies**

```bash
cd frontend
npm update framer-motion js-yaml zustand autoprefixer
```

Expected: framer-motion 12.29.2->12.34.3, js-yaml 4.1.0->4.1.1, zustand 5.0.10->5.0.11, autoprefixer 10.4.23->10.4.24

**Step A2: Update TypeScript**

```bash
npm install typescript@~5.9.3 --save-dev
```

**Step A3: Update Playwright**

```bash
npm install @playwright/test@latest --save-dev
npx playwright install
```

**Step A4: Verify baseline**

```bash
npm run build && npm run test:run && npm run lint
```

All must pass before proceeding.

---

### Phase B: ESLint Ecosystem Upgrade (Resolves 13 High-Severity Advisories)

**Step B1: Install new ESLint packages**

```bash
cd frontend
npm install --save-dev \
  eslint@^9.39.0 \
  @eslint/js@^9.0.0 \
  typescript-eslint@^8.0.0 \
  eslint-plugin-react-hooks@^7.0.0 \
  eslint-plugin-react-refresh@^0.5.0 \
  globals@^16.0.0

npm uninstall @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

**Step B2: Delete old config**

```bash
rm frontend/.eslintrc.cjs
```

**Step B3: Create new flat config**

Create `frontend/eslint.config.js`:

```javascript
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
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
```

**Step B4: Update lint script in `frontend/package.json`**

**Before:**

```json
"lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
```

**After:**

```json
"lint": "eslint src --report-unused-disable-directives --max-warnings 0",
```

ESLint 9 does not support `--ext`. File matching is controlled by the `files` property in the config.

**Step B5: Update lint-staged in root `package.json`**

**Before (root `package.json` line 14-16):**

```json
"lint-staged": {
  "frontend/src/**/*.{ts,tsx}": [
    "frontend/node_modules/.bin/eslint --max-warnings 0"
  ]
}
```

**After:**

```json
"lint-staged": {
  "frontend/src/**/*.{ts,tsx}": [
    "frontend/node_modules/.bin/eslint --max-warnings 0 --config frontend/eslint.config.js"
  ]
}
```

ESLint 9 searches for config from CWD upward. lint-staged runs from repo root, so it needs `--config` to find the frontend config.

**Step B6: Verify**

```bash
cd frontend && npm run lint
```

Must pass cleanly. If new rules from `tseslint.configs.recommended` v8 flag issues, fix them or disable specific rules.

**Step B7: Verify audit**

```bash
npm audit
```

The 13 high-severity `minimatch` advisories should be gone.

---

### Phase C: Vite + Plugin Upgrade

**Step C1: Install**

```bash
cd frontend
npm install --save-dev vite@^7.3.0 @vitejs/plugin-react@^5.1.0
```

**Step C2: Verify**

```bash
npm run dev    # Dev server starts, visit localhost:5173
npm run build  # Production build succeeds
```

The `vite.config.ts` uses standard APIs (`defineConfig`, `manualChunks`, `server.proxy`) that are unchanged across Vite 4→7. The `@vitejs/plugin-react` v5 switches from Babel to Oxc internally but the API is the same (no custom Babel plugins in this project). This also eliminates the `@babel/helpers` moderate advisory.

**Step C2.5: Verify vitest compatibility**

If vitest breaks with Vite 7, update it: `npm install vitest@latest --save-dev`. Vitest 4.x doesn't declare Vite as a peer dep, so this should be a non-issue.

**Step C3: Full test suite**

```bash
npm run build && npm run test:run && npm run lint
```

---

## Test Plan

No new tests needed. Run existing suite:

1. `cd frontend && npm run test:run` - Unit tests
2. `cd frontend && npm run lint` - ESLint with new flat config
3. `cd frontend && npm run build` - TypeScript + Vite build
4. `cd frontend && npm run test:e2e` - E2E tests (recommended)

### Manual Verification

1. `npm audit` shows 0 high-severity and 0 moderate-severity advisories
2. `npm outdated` shows only React 18 packages as outdated
3. Dev server starts and HMR works
4. `npx lint-staged --dry-run` works from repo root
5. Production build output in `dist/` has expected structure

---

## Stress Testing & Edge Cases

- **New ESLint rules**: `typescript-eslint` v8 enables new defaults. Fix genuine issues, disable overly strict rules in config.
- **Vitest compatibility**: Vitest 4.0.18 does not declare Vite as a peer dep, so Vite 7 should work. If tests break, update vitest: `npm install vitest@latest --save-dev`.
- **`eslint-plugin-react-refresh` v0.5**: `customHOCs` renamed to `extraHOCs`. Not used in this project.
- **`__dirname` in vite.config.ts**: Vite 7 config files provide CJS shims, so `__dirname` continues to work.

---

## Verification Checklist

```bash
cd frontend

# Clean install
rm -rf node_modules package-lock.json && npm install

# Verify audit
npm audit  # 0 high-severity

# Verify lint
npm run lint  # 0 errors, 0 warnings

# Verify build
npm run build  # clean, no errors

# Verify tests
npm run test:run  # all pass

# Verify dev server
npm run dev  # starts on localhost:5173, HMR works

# Verify lint-staged (from repo root)
cd .. && npx lint-staged --dry-run

# Verify outdated
cd frontend && npm outdated  # only React 18 packages
```

---

## What NOT To Do

1. **Do NOT upgrade React 18 to 19.** Major migration, separate PR.
2. **Do NOT upgrade `@types/react` or `@types/react-dom` to v19.** Must match React 18 runtime.
3. **Do NOT use `FlatCompat` from `@eslint/eslintrc`.** Defeats the purpose - keeps vulnerable package in tree.
4. **Do NOT keep `.eslintrc.cjs` alongside `eslint.config.js`.** Delete the old file.
5. **Do NOT use `--ext` in the lint script.** ESLint 9 removed it.
6. **Do NOT run bare `npm update`.** Specify packages explicitly to avoid unintended upgrades.
7. **Do NOT skip verifying `npm audit` after Phase B.** The whole point is eliminating the minimatch chain.
8. **Do NOT use `tseslint.configs.recommendedTypeChecked`.** Significantly slower, may surface many new errors. Use `recommended` (non-type-checked).
9. **Do NOT forget to update lint-staged.** Without `--config`, lint-staged can't find the config from repo root.
10. **Do NOT assume patch versions are always safe.** Run the full test suite after every sub-phase.

---

_Remediation doc for Security Audit 2026-02-22, Phase 04. Addresses findings #8 and #11._
