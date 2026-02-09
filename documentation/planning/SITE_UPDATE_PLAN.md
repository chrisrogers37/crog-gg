# Choose Your Own Chris - Site Update Plan

> **Last Updated**: February 2, 2026
> **Status**: Phases 1-3 Complete, Phase 4 In Progress

## Project Overview

This is an interactive portfolio website featuring dynamic content generation using OpenAI's GPT-3.5. The site showcases professional experience, projects, and musical endeavors with AI-powered content regeneration capabilities.

## Current Architecture

- **Frontend**: React + TypeScript + Vite (port 5173)
- **Backend**: Flask + OpenAI API (port 5001)
- **Deployment**: GitHub Actions CI/CD + Systemd services on Ubuntu servers
- **Content Management**: YAML files in `frontend/public/content/`

---

## Phase 1: Bio Content Refactoring ✅ COMPLETED

### Implementation Status

- [x] Created `frontend/public/content/` directory with YAML files
- [x] Implemented `bioLoader.ts` utility for dynamic loading
- [x] Bio content stored in `bio.yaml` with structured fields
- [x] Frontend components read from YAML source
- [x] Backend AI regeneration works with new content structure

### Files Created

```
frontend/public/content/
├── bio.yaml           # Personal bio and social links
├── education.yaml     # Education history
├── experience.yaml    # Work experience
└── skills.yaml        # Skills list
```

### Loader Utilities

```
frontend/src/utils/
├── bioLoader.ts
├── educationLoader.ts
├── experienceLoader.ts
└── skillsLoader.ts
```

---

## Phase 2: Projects Refactoring & Update ✅ COMPLETED

### Implementation Status

- [x] Created `frontend/public/content/projects/` directory
- [x] Individual YAML files for each project
- [x] Project interface defined in `types/Project.ts`
- [x] `projectLoader.ts` utility for dynamic loading
- [x] Projects loaded dynamically from YAML files
- [x] Migrated existing projects to YAML format
- [ ] Project filtering by category (not yet implemented)
- [ ] Project search functionality (not yet implemented)
- [ ] Technology tag color coding (not yet implemented)

### Project Files

```
frontend/public/content/projects/
├── index.yaml         # Project index/metadata
├── shuffify.yaml      # Spotify playlist manager
├── city-cycles.yaml   # NYC/London bike analytics
├── hedwig.yaml        # RAG-assisted email templates
├── github.yaml        # Open source projects
├── 30-day-abs.yaml    # Fitness app
└── shitpost-alpha.yaml # Creative project
```

### Project Interface (Implemented)

```typescript
// frontend/src/types/Project.ts
export interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  technologies: string[];
  featured: boolean;
  order: number;
  image?: string;
  github?: string;
  demo?: string;
  status?: "active" | "archived" | "experimental";
  tags?: string[];
}
```

### Future Enhancements (Pending)

- [ ] Project filtering & search UI
- [ ] Category-based grouping
- [ ] Featured projects section
- [ ] Technology tag display with color coding

---

## Phase 3: Deployment Process ✅ COMPLETED

### CI/CD Pipeline

- [x] GitHub Actions CI workflow (`ci.yml`)
  - Runs on every push
  - Frontend linting, unit tests, E2E tests
  - Backend linting
- [x] GitHub Actions Deploy workflow (`deploy.yml`)
  - Manual trigger (workflow_dispatch)
  - SSH deployment to frontend and backend servers
  - Runs CI checks before deployment

### Pre-Deployment Checklist

- [x] All changes tested locally
- [x] No console errors
- [x] All links working
- [x] Mobile responsiveness verified
- [x] AI regeneration functionality working

### Deployment Commands

#### Automated (Recommended)

Trigger the Deploy workflow from GitHub Actions UI.

#### Manual Fallback

```bash
# Frontend (crog.gg)
ssh crog-frontend "cd /var/www/crog.gg && git fetch origin && git reset --hard origin/main && cd frontend && npm install && npm run build && sudo systemctl restart nginx"

# Backend (api.crog.gg)
ssh crog-backend "cd /var/www/api.crog.gg && git fetch origin && git reset --hard origin/main && source venv/bin/activate && pip install -r requirements.txt && cd systemd && ./deploy-services.sh restart"
```

### GitHub Secrets Required

| Secret           | Description                         |
| ---------------- | ----------------------------------- |
| `FRONTEND_HOST`  | Frontend server IP (209.97.158.198) |
| `BACKEND_HOST`   | Backend server IP (167.172.233.207) |
| `DEPLOY_USER`    | SSH user (root)                     |
| `DEPLOY_SSH_KEY` | Contents of deploy private key      |
| `FRONTEND_PATH`  | /var/www/crog.gg                    |
| `BACKEND_PATH`   | /var/www/api.crog.gg                |

---

## Phase 4: Post-Deployment Recommendations

### Testing Infrastructure ✅ COMPLETED

- [x] Vitest unit testing framework
- [x] Playwright E2E testing
- [x] E2E tests for navigation, home page, projects
- [x] CI runs tests on every push

### Immediate Improvements

- [ ] **Content Management**: Implement admin interface for content editing
- [ ] **Analytics**: Add Google Analytics or similar tracking
- [x] **Performance**: Code splitting implemented via Vite
- [ ] **SEO**: Add meta tags, structured data, and sitemap

### Long-term Enhancements

- [ ] **CMS Integration**: Consider headless CMS for non-technical content management
- [ ] **A/B Testing**: Implement content variation testing
- [ ] **User Analytics**: Track which content variations perform best
- [x] **Automated Deployment**: CI/CD pipeline implemented
- [ ] **Content Versioning**: Implement content versioning and rollback

### Technical Debt

- [ ] **Error Handling**: Improve error boundaries and user feedback
- [ ] **Loading States**: Add skeleton loaders for better UX
- [ ] **Accessibility**: Audit and improve accessibility compliance
- [x] **Testing**: Unit and E2E tests added
- [x] **Documentation**: CLAUDE.md maintained with project context

---

## Risk Assessment

### Low Risk ✅

- Content structure changes (YAML files)
- Project updates
- Styling improvements

### Medium Risk ⚠️

- Backend API changes
- Third-party integrations (OpenAI API key management)

### High Risk 🔴

- Core architecture changes
- Authentication/authorization changes

---

## Success Metrics

- [x] Bio content is easily editable (YAML files)
- [x] All projects display correctly with updated information
- [x] Site loads without errors
- [x] AI regeneration functionality works with new content structure
- [x] Mobile responsiveness maintained
- [x] CI/CD pipeline operational

---

## Adding New Projects

With the current system, adding projects is simple:

1. **Create new YAML file**

   ```bash
   touch frontend/public/content/projects/my-new-project.yaml
   ```

2. **Fill in project details**

   ```yaml
   id: my-new-project
   title: My New Project
   description: |
     A description of what this project does.
   url: https://my-project.com
   icon: fas fa-rocket
   category: web-app
   technologies:
     - React
     - TypeScript
   featured: true
   order: 10
   ```

3. **Deploy**
   - Push to main and trigger Deploy workflow
   - Project appears automatically

---

## Summary

| Phase                         | Status         | Notes                                      |
| ----------------------------- | -------------- | ------------------------------------------ |
| Phase 1: Bio Refactoring      | ✅ Complete    | YAML-based content system                  |
| Phase 2: Projects Refactoring | ✅ Complete    | Dynamic project loading, filtering pending |
| Phase 3: Deployment           | ✅ Complete    | GitHub Actions CI/CD operational           |
| Phase 4: Enhancements         | ⏳ In Progress | Testing done, other items pending          |
