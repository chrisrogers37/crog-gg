# CLAUDE.md - Project Instructions for Claude Code

This file provides project-specific guidance for Claude Code. Update this file whenever Claude does something incorrectly so it learns not to repeat mistakes.

## Project Overview

**Choose Your Own Chris** - An interactive portfolio website featuring dynamic content generation using OpenAI's GPT-3.5. Built with React + TypeScript frontend and Flask backend.

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand for state
- **Backend**: Flask, OpenAI API, Python 3.10+, Gunicorn
- **Testing**: Vitest + React Testing Library (unit), Playwright (E2E)
- **Deployment**: Frontend on crog.gg, Backend API on api.crog.gg

## Development Workflow

Give Claude verification loops for 2-3x quality improvement:

1. Make changes
2. Run typecheck: `cd frontend && npm run build` (tsc is part of build)
3. Run tests: `cd frontend && npm run test:run`
4. Lint before committing: `cd frontend && npm run lint`
5. Before creating PR: run full lint and test suite

## Commands Reference

```sh
# Frontend commands (run from /frontend directory)
npm run dev              # Start dev server (localhost:5173)
npm run build            # TypeScript check + Vite build
npm run lint             # ESLint
npm run test             # Vitest in watch mode
npm run test:run         # Vitest single run
npm run test:coverage    # Vitest with coverage
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:headed  # E2E tests with visible browser

# Backend commands (run from /backend directory)
python app.py            # Start Flask dev server
source venv/bin/activate # Activate Python venv

# Git workflow
git status              # Check current state
git diff                # Review changes before commit
```

## Code Style & Conventions

### TypeScript/React

- Prefer `type` over `interface`; never use `enum` (use string literal unions instead)
- Use functional components with hooks
- Keep components small and focused
- Use Zustand for global state management
- Follow existing patterns in the codebase

### Python/Flask

- Follow PEP 8 style guide
- Use type hints where possible
- Keep Flask routes clean and focused

### General

- Use descriptive variable names
- Write tests for new functionality
- Handle errors explicitly, don't swallow them
- Keep functions small and focused

## Things Claude Should NOT Do

- Don't use `any` type in TypeScript without explicit approval
- Don't skip error handling
- Don't commit without running tests first
- Don't make breaking API changes without discussion
- Don't modify .env files or commit secrets
- Don't add dependencies without discussing why
- Don't use `enum` in TypeScript - use string literal unions instead

## Project-Specific Patterns

### State Management

- Use Zustand stores in `frontend/src/stores/`
- Follow existing store patterns for consistency

### API Integration

- API URL configured via `VITE_API_URL` env var
- Backend runs on port 5001

### Styling

- Use Tailwind CSS classes
- CSS variables for theming defined in global styles
- Use Framer Motion for animations

### Testing

- Unit tests co-located with components in `__tests__` directories
- E2E tests in `frontend/e2e/`
- Mock external APIs in tests

### E2E Test Philosophy (IMPORTANT)

Tests should verify **structure and behavior**, not specific content:

- **DO**: Test that elements exist (headings, buttons, inputs)
- **DO**: Test that interactions work (clicking toggles state, forms accept input)
- **DO**: Use flexible selectors that match patterns, not exact classes
- **DO**: Skip tests gracefully when optional data isn't available
- **DON'T**: Test for exact text content that changes frequently
- **DON'T**: Hard-code copy like "hey there!" or "Welcome to my site"
- **DON'T**: Require specific data to load (projects, etc.) - make tests resilient

Example - Bad:

```typescript
await expect(page.getByText(/hey there!/i)).toBeVisible();
```

Example - Good:

```typescript
const welcomeArea = page.locator('.welcome-typewriter, [class*="welcome"]');
await expect(welcomeArea).toBeVisible();
```

### Content Files

- Content lives in `frontend/public/content/` as YAML files
- Bio, experience, education, skills, projects all loaded from YAML
- Projects are in `frontend/public/content/projects/` directory

## Deployment

### CI/CD Workflows

- **CI** (`ci.yml`): Runs automatically on push - lint, test, build
- **Deploy** (`deploy.yml`): Manual trigger (`workflow_dispatch`)
  - Requires GitHub secrets: `DEPLOY_SSH_KEY`, `FRONTEND_HOST`, `BACKEND_HOST`, `DEPLOY_USER`, `FRONTEND_PATH`, `BACKEND_PATH`
  - Frontend deploys to: 209.97.158.198 at /var/www/crog.gg
  - Backend deploys to: 167.172.233.207 at /var/www/api.crog.gg

### Manual Deploy Command

```bash
ssh crog-frontend "cd /var/www/crog.gg && git fetch origin && git reset --hard origin/main && cd frontend && npm install && npm run build && sudo systemctl restart nginx"
```

## Tone & Content Style

Chris prefers a **casual, lowercase tone** in content:

- Use lowercase for casual/friendly copy
- **NEVER use em-dashes** (—) - use regular dashes or ellipses instead
- Keep it conversational, not corporate
- Example: "alright, here goes..." not "Here's what makes me tick—"

## Image Handling

When working with images:

- **DON'T rotate images** unless explicitly requested - images are usually oriented correctly
- Use **CSS `object-position`** for cropping (e.g., `object-position: top` to hide bottom of image)
- Use **CSS `object-fit: cover`** for responsive image sizing
- Profile photos are in `frontend/public/profile-photos/`

Example - cropping with CSS (not image manipulation):

```css
.profile-photo {
  object-fit: cover;
  object-position: top; /* Shows top of image, crops bottom */
}
```

---

_Update this file continuously. Every mistake Claude makes is a learning opportunity._
