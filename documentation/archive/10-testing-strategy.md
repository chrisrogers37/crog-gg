# 10 - Testing Strategy

## Purpose

This document outlines the testing approach for the portfolio enhancement project, including test types, tools, coverage requirements, and examples.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [Tools & Setup](#tools--setup)
4. [Test Coverage Requirements](#test-coverage-requirements)
5. [Writing Tests](#writing-tests)
6. [Running Tests](#running-tests)
7. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

### Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Write Tests First for Bugs**: When fixing a bug, write a failing test first
3. **Keep Tests Fast**: Unit tests should run in milliseconds
4. **Test the Happy Path First**: Then add edge cases
5. **Don't Mock What You Don't Own**: Use integration tests for external APIs

### Testing Pyramid

```
        /\
       /  \      E2E Tests (5%)
      /    \     - Full user journeys
     /------\    - Critical paths only
    /        \
   /  Integ   \  Integration Tests (25%)
  /   Tests    \ - Component interactions
 /--------------\ - API integration
/                \
/   Unit Tests    \ Unit Tests (70%)
/------------------\ - Functions
                     - Components
                     - Hooks
```

---

## Test Types

### Unit Tests

Test individual functions, components, and hooks in isolation.

**What to Test:**

- Pure functions (utils, helpers)
- React components (rendering, props)
- Custom hooks (state, effects)
- Store actions and selectors

**What NOT to Test:**

- Third-party libraries
- Simple pass-through components
- CSS styling

### Integration Tests

Test how components work together.

**What to Test:**

- Component with store integration
- Form submissions
- Navigation flows
- API data fetching

### End-to-End Tests

Test complete user journeys.

**What to Test:**

- Home page loads and displays content
- Navigation between pages
- Content regeneration flow
- Project detail page with GitHub data

---

## Tools & Setup

### Frontend Testing Stack

| Tool                        | Purpose                     | Version |
| --------------------------- | --------------------------- | ------- |
| Vitest                      | Test runner                 | ^1.2.0  |
| @testing-library/react      | Component testing           | ^14.2.0 |
| @testing-library/user-event | User interaction simulation | ^14.5.0 |
| MSW                         | API mocking                 | ^2.1.0  |
| Playwright                  | E2E testing                 | ^1.41.0 |

### Installation

```bash
cd frontend

# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitest/ui @vitest/coverage-v8
npm install -D msw
npm install -D playwright @playwright/test

# Initialize Playwright
npx playwright install
```

### Configuration

**vitest.config.ts:**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*"],
    },
  },
});
```

**src/test/setup.ts:**

```typescript
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll } from "vitest";
import { server } from "./mocks/server";

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

**src/test/mocks/server.ts:**

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

**src/test/mocks/handlers.ts:**

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock content loading
  http.get("/content/bio.yaml", () => {
    return HttpResponse.text(`
display_name: Test User
email: test@example.com
location: Test City
about_text: Test about text
welcome_message: Welcome!
social_links:
  github: https://github.com/test
  linkedin: https://linkedin.com/in/test
  spotify: https://spotify.com/test
  hoobe: https://hoobe.me/test
    `);
  }),

  // Mock API endpoints
  http.post("*/api/regenerate", () => {
    return HttpResponse.json({
      about_text: "Regenerated content",
    });
  }),

  http.get("*/api/v1/github/repo/:name", ({ params }) => {
    return HttpResponse.json({
      name: params.name,
      full_name: `chrisrogers37/${params.name}`,
      description: "Test repo description",
      stargazers_count: 42,
      forks_count: 5,
    });
  }),
];
```

---

## Test Coverage Requirements

### Minimum Coverage Thresholds

| Metric     | Threshold | Rationale            |
| ---------- | --------- | -------------------- |
| Statements | 70%       | Basic code execution |
| Branches   | 60%       | Conditional logic    |
| Functions  | 70%       | Feature completeness |
| Lines      | 70%       | Overall coverage     |

### Critical Path Coverage (Must be 100%)

- [ ] Content loading from YAML
- [ ] Section navigation
- [ ] Content regeneration API call
- [ ] Content reset functionality
- [ ] Route navigation
- [ ] Error boundary catch

---

## Writing Tests

### Unit Test Examples

**Testing a Utility Function:**

```typescript
// src/utils/helpers.test.ts
import { describe, it, expect } from "vitest";
import { formatDate, truncateText } from "./helpers";

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = "2026-01-15T10:30:00Z";
    expect(formatDate(date)).toBe("Jan 15, 2026");
  });

  it("handles invalid date", () => {
    expect(formatDate("invalid")).toBe("Invalid Date");
  });
});

describe("truncateText", () => {
  it("truncates long text", () => {
    const text = "This is a very long text that should be truncated";
    expect(truncateText(text, 20)).toBe("This is a very long...");
  });

  it("does not truncate short text", () => {
    const text = "Short text";
    expect(truncateText(text, 20)).toBe("Short text");
  });
});
```

**Testing a React Component:**

```typescript
// src/components/common/Card/Card.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Test content</Card>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText('Content').parentElement).toHaveClass('custom-class');
  });

  it('applies hover styles when hover prop is true', () => {
    const { container } = render(<Card hover>Content</Card>);
    expect(container.firstChild).toHaveClass('hover:shadow-md');
  });
});
```

**Testing a Custom Hook:**

```typescript
// src/hooks/useRegeneration.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useRegeneration } from "./useRegeneration";

// Mock the stores
vi.mock("../store", () => ({
  useContentStore: vi.fn(() => ({
    regenerateContent: vi.fn(),
    resetContent: vi.fn(),
    isRegenerating: false,
    hasModifiedContent: false,
  })),
  useUIStore: vi.fn(() => ({
    activeSection: "about",
  })),
}));

describe("useRegeneration", () => {
  it("calls regenerateContent with correct params", async () => {
    const mockRegenerate = vi.fn();
    vi.mocked(useContentStore).mockReturnValue({
      regenerateContent: mockRegenerate,
      resetContent: vi.fn(),
      isRegenerating: false,
      hasModifiedContent: false,
    });

    const { result } = renderHook(() => useRegeneration());

    act(() => {
      result.current.regenerate(true);
    });

    expect(mockRegenerate).toHaveBeenCalledWith("about", true);
  });

  it("returns isRegenerating state", () => {
    vi.mocked(useContentStore).mockReturnValue({
      regenerateContent: vi.fn(),
      resetContent: vi.fn(),
      isRegenerating: true,
      hasModifiedContent: false,
    });

    const { result } = renderHook(() => useRegeneration());
    expect(result.current.isRegenerating).toBe(true);
  });
});
```

### Integration Test Examples

**Testing Component with Store:**

```typescript
// src/components/sections/About/About.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { About } from './About';

// Wrap with providers if needed
const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui);
};

describe('About Section', () => {
  beforeEach(() => {
    // Reset store state
  });

  it('displays about text from store', async () => {
    renderWithProviders(<About />);

    await waitFor(() => {
      expect(screen.getByText(/Test about text/)).toBeInTheDocument();
    });
  });

  it('shows loading overlay when regenerating', async () => {
    // Set isRegenerating to true in mock store
    renderWithProviders(<About />);

    expect(screen.getByText('Regenerating...')).toBeInTheDocument();
  });
});
```

**Testing Navigation:**

```typescript
// src/pages/Home/HomePage.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('navigates between sections', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Click on Experience section
    await user.click(screen.getByRole('button', { name: /experience/i }));

    // Verify Experience section is visible
    expect(screen.getByRole('heading', { name: /experience/i })).toBeInTheDocument();
  });

  it('toggles section on second click', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const aboutButton = screen.getByRole('button', { name: /about/i });

    // First click - show section
    await user.click(aboutButton);
    expect(screen.getByText(/about text/i)).toBeInTheDocument();

    // Second click - hide section
    await user.click(aboutButton);
    expect(screen.queryByText(/about text/i)).not.toBeInTheDocument();
  });
});
```

### E2E Test Examples

**playwright/home.spec.ts:**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays profile information", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /chris rogers/i }),
    ).toBeVisible();
    await expect(page.getByText(/software engineer/i)).toBeVisible();
  });

  test("section navigation works", async ({ page }) => {
    // Click About section
    await page.getByRole("button", { name: /about/i }).click();

    // Verify section is visible
    await expect(page.getByText(/about me/i)).toBeVisible();
  });

  test("can navigate to projects page", async ({ page }) => {
    await page.getByRole("link", { name: /projects/i }).click();

    await expect(page).toHaveURL("/projects");
    await expect(
      page.getByRole("heading", { name: /projects/i }),
    ).toBeVisible();
  });
});

test.describe("Content Regeneration", () => {
  test("regenerates about section content", async ({ page }) => {
    await page.goto("/");

    // Select About section
    await page.getByRole("button", { name: /about/i }).click();

    // Get original text
    const originalText = await page.getByTestId("about-text").textContent();

    // Click regenerate
    await page.getByRole("button", { name: /summon new lore/i }).click();

    // Wait for loading to complete
    await expect(page.getByText(/summoning/i)).toBeVisible();
    await expect(page.getByText(/summoning/i)).not.toBeVisible({
      timeout: 30000,
    });

    // Verify text changed
    const newText = await page.getByTestId("about-text").textContent();
    expect(newText).not.toBe(originalText);
  });
});
```

**playwright/projects.spec.ts:**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Projects Page", () => {
  test("displays all projects", async ({ page }) => {
    await page.goto("/projects");

    // Wait for projects to load
    await expect(page.getByRole("link", { name: /shuffify/i })).toBeVisible();
  });

  test("can filter projects by search", async ({ page }) => {
    await page.goto("/projects");

    // Type in search
    await page.getByPlaceholder(/search projects/i).fill("spotify");

    // Only matching projects should be visible
    await expect(page.getByText(/shuffify/i)).toBeVisible();
    await expect(page.getByText(/city cycles/i)).not.toBeVisible();
  });

  test("project detail page loads README", async ({ page }) => {
    await page.goto("/projects/shuffify");

    // Wait for README to load
    await expect(
      page.getByRole("heading", { name: /documentation/i }),
    ).toBeVisible();

    // README content should be visible
    await expect(page.locator(".readme-content")).toBeVisible();
  });
});
```

---

## Running Tests

### Commands

```bash
# Run all unit/integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

**.github/workflows/test.yml:**

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run tests
        working-directory: frontend
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: frontend/coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Install Playwright
        working-directory: frontend
        run: npx playwright install --with-deps

      - name: Build app
        working-directory: frontend
        run: npm run build

      - name: Run E2E tests
        working-directory: frontend
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report
```

### Pre-commit Hook

**package.json:**

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

**.husky/pre-commit:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

cd frontend && npm test -- --run
```

---

## Test File Organization

```
frontend/
├── src/
│   ├── components/
│   │   └── Button/
│   │       ├── Button.tsx
│   │       ├── Button.test.tsx    # Unit test next to component
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useRegeneration.ts
│   │   └── useRegeneration.test.ts
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── helpers.test.ts
│   └── test/
│       ├── setup.ts               # Test setup
│       ├── mocks/
│       │   ├── handlers.ts        # MSW handlers
│       │   └── server.ts
│       └── utils.tsx              # Test utilities
├── playwright/
│   ├── home.spec.ts               # E2E tests
│   ├── projects.spec.ts
│   └── fixtures/                  # Test data
└── playwright.config.ts
```

---

_Document Version: 1.0.0_
_Last Updated: January 2026_
