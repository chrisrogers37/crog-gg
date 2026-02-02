# 11 - Migration Checklist

## Purpose
This document provides a step-by-step checklist for implementing each phase of the portfolio enhancement. Use this to track progress and verify each step is complete before moving forward.

---

## How to Use This Checklist

1. Complete items in order within each phase
2. Check off items as you complete them
3. Run verification steps before marking a phase complete
4. Don't skip phases - they have dependencies
5. If blocked, note the blocker and seek help

---

## Pre-Migration Checklist

Before starting any phase, ensure:

- [ ] You have read [01-current-state-analysis.md](./01-current-state-analysis.md)
- [ ] You have read [02-architecture-roadmap.md](./02-architecture-roadmap.md)
- [ ] Local development environment is working
  ```bash
  cd frontend && npm install && npm run dev
  ```
- [ ] You can access the running app at http://localhost:5173
- [ ] Git is configured and you're on a feature branch
- [ ] Backend API is accessible (for regeneration testing)

---

## Phase 1: Foundation

**Reference**: [03-phase-1-foundation.md](./03-phase-1-foundation.md)

### 1.1 Install React Router
- [ ] Run `npm install react-router-dom`
- [ ] Verify package.json includes `"react-router-dom": "^6.x.x"`
- [ ] Run `npm install` to update lock file

### 1.2 Create Router Configuration
- [ ] Create file: `src/router.tsx`
- [ ] Import createBrowserRouter and RouterProvider
- [ ] Configure root route with HomePage
- [ ] Configure 404 catch-all route
- [ ] Export AppRouter component

### 1.3 Create ContentState Interface
- [ ] Create file: `src/types/content.ts`
- [ ] Define ContentState interface
- [ ] Define PartialContentState interface
- [ ] Define ContentProps interface
- [ ] Create barrel export: `src/types/index.ts`

### 1.4 Create HomePage Component
- [ ] Create directory: `src/pages/Home/`
- [ ] Create file: `src/pages/Home/HomePage.tsx`
- [ ] Move state from App.tsx to HomePage
- [ ] Move data loading logic to HomePage
- [ ] Move regeneration handlers to HomePage
- [ ] Move rendering logic to HomePage
- [ ] Create barrel export: `src/pages/Home/index.ts`

### 1.5 Extract ActionButtons Component
- [ ] Create directory: `src/components/ActionButtons/`
- [ ] Create file: `src/components/ActionButtons/ActionButtons.tsx`
- [ ] Create file: `src/components/ActionButtons/ActionButtons.css`
- [ ] Define ActionButtonsProps interface
- [ ] Implement SUMMON NEW LORE button
- [ ] Implement SUMMON FANTASY LORE button
- [ ] Implement DISPEL ENCHANTMENT button
- [ ] Create barrel export: `src/components/ActionButtons/index.ts`

### 1.6 Update App.tsx
- [ ] Remove all state and handlers from App.tsx
- [ ] Import AppRouter from router.tsx
- [ ] Render only AppRouter in App component
- [ ] File should be < 15 lines

### 1.7 Create NotFoundPage
- [ ] Create directory: `src/pages/NotFound/`
- [ ] Create file: `src/pages/NotFound/NotFoundPage.tsx`
- [ ] Create file: `src/pages/NotFound/NotFoundPage.css`
- [ ] Implement 404 UI with link to home
- [ ] Create barrel export: `src/pages/NotFound/index.ts`

### Phase 1 Verification
- [ ] `npm run build` succeeds without errors
- [ ] `npm run lint` shows no errors
- [ ] Home page loads at http://localhost:5173/
- [ ] All sections work (About, Experience, Skills, Education, Projects, Music)
- [ ] Regeneration works (API call succeeds)
- [ ] Reset works (content reverts)
- [ ] 404 page shows at http://localhost:5173/nonexistent
- [ ] No TypeScript `any` types in new files
- [ ] No console errors in browser

### Phase 1 Commit
```bash
git add .
git commit -m "Phase 1: Add React Router and extract initial components

- Install react-router-dom for client-side routing
- Create HomePage component from App.tsx
- Extract ActionButtons component
- Add NotFoundPage for 404 handling
- Create ContentState TypeScript interfaces
- Simplify App.tsx to router shell"
```

---

## Phase 2: Modularity

**Reference**: [04-phase-2-modularity.md](./04-phase-2-modularity.md)

### 2.1 Install Zustand
- [ ] Run `npm install zustand`
- [ ] Verify package.json includes `"zustand": "^4.x.x"`

### 2.2 Create Content Store
- [ ] Create directory: `src/store/`
- [ ] Create file: `src/store/contentStore.ts`
- [ ] Define ContentStoreState interface
- [ ] Define ContentStoreActions interface
- [ ] Implement loadContent action
- [ ] Implement regenerateContent action
- [ ] Implement resetContent action
- [ ] Export selector hooks (useBio, useExperience, etc.)

### 2.3 Create UI Store
- [ ] Create file: `src/store/uiStore.ts`
- [ ] Define UIStoreState interface
- [ ] Implement setActiveSection action
- [ ] Implement toggleSection action
- [ ] Implement setTheme action
- [ ] Add localStorage persistence for theme
- [ ] Create barrel export: `src/store/index.ts`

### 2.4 Split Portfolio Component
- [ ] Create directory: `src/components/sections/Experience/`
- [ ] Create Experience.tsx component
- [ ] Create ExperienceCard.tsx component
- [ ] Create Experience.css styles
- [ ] Create directory: `src/components/sections/Education/`
- [ ] Create Education.tsx component
- [ ] Create EducationCard.tsx component
- [ ] Create Education.css styles
- [ ] Create directory: `src/components/sections/Projects/`
- [ ] Create Projects.tsx component
- [ ] Create ProjectCard.tsx component
- [ ] Create GitHubStats.tsx component
- [ ] Create Projects.css styles
- [ ] Create directory: `src/components/sections/Music/`
- [ ] Create Music.tsx component
- [ ] Create Music.css styles
- [ ] Create barrel export: `src/components/sections/index.ts`
- [ ] Delete or archive old Portfolio.tsx

### 2.5 Extract Layout Components
- [ ] Create directory: `src/components/layout/Header/`
- [ ] Create Header.tsx component
- [ ] Create SocialLinks.tsx component
- [ ] Create Header.css styles
- [ ] Create barrel export: `src/components/layout/index.ts`

### 2.6 Create Custom Hooks
- [ ] Create directory: `src/hooks/`
- [ ] Create file: `src/hooks/useContentLoader.ts`
- [ ] Create file: `src/hooks/useRegeneration.ts`
- [ ] Create file: `src/hooks/useScrollToSection.ts`
- [ ] Create barrel export: `src/hooks/index.ts`

### 2.7 Update HomePage to Use Stores
- [ ] Import useContentLoader hook
- [ ] Import useUIStore for activeSection
- [ ] Import useRegeneration hook
- [ ] Remove local state for content
- [ ] Remove local state for activeSection
- [ ] Update section rendering to use new components

### 2.8 Remove CustomEvent Pattern
- [ ] Remove `window.dispatchEvent(new CustomEvent(...))` calls
- [ ] Remove `window.addEventListener('contentRegenerated', ...)` listeners
- [ ] Update About.tsx to use store directly
- [ ] Verify `grep -r "CustomEvent" src/` returns no results

### Phase 2 Verification
- [ ] `npm run build` succeeds without errors
- [ ] Redux DevTools shows store updates
- [ ] All sections render correctly
- [ ] Regeneration updates store (visible in DevTools)
- [ ] Reset updates store (visible in DevTools)
- [ ] No CustomEvent references in codebase
- [ ] Each section component is < 150 lines
- [ ] No prop drilling more than 2 levels

### Phase 2 Commit
```bash
git add .
git commit -m "Phase 2: Implement Zustand stores and split components

- Add Zustand for state management
- Create contentStore for all content data
- Create uiStore for UI state with persistence
- Split Portfolio into Experience, Education, Projects, Music
- Extract Header and layout components
- Create custom hooks for content loading and regeneration
- Remove CustomEvent pattern in favor of store subscriptions"
```

---

## Phase 3: Extensibility

**Reference**: [05-phase-3-extensibility.md](./05-phase-3-extensibility.md)

### 3.1 Create Layout Component
- [ ] Create directory: `src/components/layout/Layout/`
- [ ] Create Layout.tsx with Outlet
- [ ] Create Navigation.tsx component
- [ ] Create Footer.tsx component
- [ ] Create Layout.css styles

### 3.2 Update Router Configuration
- [ ] Add Layout as parent route element
- [ ] Add /projects route
- [ ] Add /projects/:slug route
- [ ] Update children array structure

### 3.3 Create Projects Listing Page
- [ ] Create file: `src/pages/Projects/ProjectsPage.tsx`
- [ ] Implement search filter
- [ ] Implement category filter
- [ ] Create project grid with cards
- [ ] Create file: `src/pages/Projects/ProjectsPage.css`

### 3.4 Create Project Detail Page
- [ ] Create file: `src/pages/Projects/ProjectDetailPage.tsx`
- [ ] Implement breadcrumb navigation
- [ ] Display project metadata
- [ ] Add placeholder for README (Phase 6)
- [ ] Create file: `src/pages/Projects/ProjectDetailPage.css`
- [ ] Create barrel export: `src/pages/Projects/index.ts`

### 3.5 Dynamic YAML Loading
- [ ] Update `src/utils/projectLoader.ts`
- [ ] Load project list from index.yaml
- [ ] Dynamically load each project YAML
- [ ] Handle missing/invalid files gracefully
- [ ] Add loadProjectById function

### 3.6 Create Project Template Component
- [ ] Create directory: `src/components/templates/`
- [ ] Create ProjectTemplate.tsx
- [ ] Define slots for metadata, readme, demo
- [ ] Create ProjectTemplate.css

### 3.7 Create Breadcrumbs Component
- [ ] Create directory: `src/components/common/Breadcrumbs/`
- [ ] Create Breadcrumbs.tsx
- [ ] Support dynamic items array
- [ ] Create Breadcrumbs.css
- [ ] Create barrel export

### Phase 3 Verification
- [ ] `/` loads home page
- [ ] `/projects` shows all projects
- [ ] `/projects/shuffify` shows project detail
- [ ] Search filter works on projects page
- [ ] Category filter works on projects page
- [ ] Breadcrumbs navigate correctly
- [ ] Back button works
- [ ] Direct URL access works (deep linking)

### Phase 3 Commit
```bash
git add .
git commit -m "Phase 3: Add project pages and dynamic content loading

- Create Layout component with shared navigation
- Add projects listing page with search/filter
- Add project detail page with breadcrumbs
- Implement dynamic YAML loading
- Create reusable Breadcrumbs component
- Create ProjectTemplate component"
```

---

## Phase 4: Visual Design

**Reference**: [06-phase-4-visual-design.md](./06-phase-4-visual-design.md)

### 4.1 Install Tailwind CSS
- [ ] Run `npm install -D tailwindcss postcss autoprefixer`
- [ ] Run `npx tailwindcss init -p`
- [ ] Create tailwind.config.js with custom theme
- [ ] Update src/index.css with Tailwind directives
- [ ] Install `npm install -D @tailwindcss/typography`

### 4.2 Create Design Tokens
- [ ] Create file: `src/styles/tokens.ts`
- [ ] Define color tokens
- [ ] Define spacing tokens
- [ ] Define animation tokens

### 4.3 Install Framer Motion
- [ ] Run `npm install framer-motion`
- [ ] Create file: `src/utils/animations.ts`
- [ ] Define fadeIn variant
- [ ] Define fadeInUp variant
- [ ] Define staggerContainer variant

### 4.4 Implement Dark Mode
- [ ] Add theme toggle to UI store (if not done)
- [ ] Create ThemeToggle component
- [ ] Add dark mode classes to Tailwind config
- [ ] Initialize theme on app load
- [ ] Test system preference detection

### 4.5 Animate Page Transitions
- [ ] Create AnimatedRoutes component
- [ ] Replace Outlet with AnimatedRoutes in Layout
- [ ] Add AnimatePresence wrapper
- [ ] Test page transition animations

### 4.6 Animate Components
- [ ] Add entrance animations to cards
- [ ] Add hover animations to cards
- [ ] Add stagger animations to lists
- [ ] Update Skills word cloud with animation

### 4.7 Create Hero Section
- [ ] Create Hero.tsx component
- [ ] Add animated gradient background
- [ ] Add profile photo with animation
- [ ] Add scroll indicator
- [ ] Create Hero.css styles

### 4.8 Refresh Card Designs
- [ ] Update ProjectCard with Tailwind
- [ ] Update ExperienceCard with Tailwind
- [ ] Update EducationCard with Tailwind
- [ ] Add hover states and transitions

### 4.9 Responsive Improvements
- [ ] Test on mobile (< 640px)
- [ ] Test on tablet (640-1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Fix any layout issues
- [ ] Verify touch targets are 44px+

### Phase 4 Verification
- [ ] Dark mode toggle works
- [ ] System preference is respected
- [ ] Page transitions animate smoothly
- [ ] Card hover effects work
- [ ] Animations run at 60fps (check DevTools)
- [ ] Mobile layout looks good
- [ ] Lighthouse performance > 90

### Phase 4 Commit
```bash
git add .
git commit -m "Phase 4: Visual design refresh with Tailwind and animations

- Add Tailwind CSS with custom theme
- Implement dark mode with persistence
- Add Framer Motion animations
- Create animated page transitions
- Design new Hero section
- Refresh all card designs
- Improve responsive layouts"
```

---

## Phase 5: SEO & Content

**Reference**: [07-phase-5-seo-content.md](./07-phase-5-seo-content.md)

### 5.1 Install React Helmet
- [ ] Run `npm install react-helmet-async`
- [ ] Add HelmetProvider to main.tsx

### 5.2 Create SEO Component
- [ ] Create file: `src/components/SEO/SEO.tsx`
- [ ] Implement meta tags
- [ ] Implement Open Graph tags
- [ ] Implement Twitter Card tags

### 5.3 Add SEO to Pages
- [ ] Add SEO component to HomePage
- [ ] Add SEO component to ProjectsPage
- [ ] Add SEO component to ProjectDetailPage
- [ ] Add SEO component to NotFoundPage

### 5.4 Add Structured Data
- [ ] Create StructuredData.tsx
- [ ] Add Person schema to home page
- [ ] Add SoftwareApplication schema to project pages
- [ ] Add BreadcrumbList schema

### 5.5 Generate Sitemap
- [ ] Create public/sitemap.xml
- [ ] Create public/robots.txt
- [ ] Create sitemap generation script
- [ ] Add to build process

### 5.6 Add Analytics
- [ ] Choose analytics provider (Plausible recommended)
- [ ] Add tracking script to index.html
- [ ] Create usePageTracking hook
- [ ] Add to Layout component

### 5.7 Performance Optimization
- [ ] Convert images to WebP
- [ ] Add lazy loading to images
- [ ] Implement code splitting
- [ ] Add preload hints to index.html

### 5.8 Accessibility Audit
- [ ] Add skip link to Layout
- [ ] Verify color contrast
- [ ] Test keyboard navigation
- [ ] Add ARIA labels to icon buttons
- [ ] Test with screen reader

### Phase 5 Verification
- [ ] View source shows meta tags
- [ ] Facebook Debugger shows OG data
- [ ] Twitter Card Validator passes
- [ ] Google Rich Results Test passes
- [ ] /sitemap.xml is accessible
- [ ] Lighthouse SEO > 95
- [ ] Lighthouse Accessibility > 95

### Phase 5 Commit
```bash
git add .
git commit -m "Phase 5: SEO optimization and accessibility improvements

- Add React Helmet for meta tags
- Implement Open Graph and Twitter Cards
- Add JSON-LD structured data
- Generate sitemap and robots.txt
- Add analytics tracking
- Optimize images and code splitting
- Improve accessibility (skip link, ARIA, contrast)"
```

---

## Phase 6: GitHub Integration

**Reference**: [08-phase-6-github-integration.md](./08-phase-6-github-integration.md)

### 6.1 Install Markdown Dependencies
- [ ] Run `npm install react-markdown remark-gfm rehype-highlight rehype-raw`

### 6.2 Create GitHub Service
- [ ] Create file: `src/services/githubService.ts`
- [ ] Implement getRepository method
- [ ] Implement getReadme method
- [ ] Implement getLanguages method
- [ ] Implement getContributions method
- [ ] Add caching layer

### 6.3 Add Backend Endpoints
- [ ] Add `GITHUB_TOKEN` to backend .env
- [ ] Create `/api/v1/github/repo/:name` endpoint
- [ ] Create `/api/v1/github/readme/:name` endpoint
- [ ] Create `/api/v1/github/languages/:name` endpoint
- [ ] Create `/api/v1/github/contributions` endpoint
- [ ] Add rate limiting to endpoints
- [ ] Test endpoints with curl

### 6.4 Create README Component
- [ ] Create GitHubReadme.tsx
- [ ] Implement markdown rendering
- [ ] Add syntax highlighting
- [ ] Handle relative image URLs
- [ ] Create GitHubReadme.css

### 6.5 Create RepoStats Component
- [ ] Create RepoStats.tsx
- [ ] Display stars, forks, watchers
- [ ] Display language and license
- [ ] Display last updated date
- [ ] Create RepoStats.css

### 6.6 Create Contribution Graph
- [ ] Create ContributionGraph.tsx
- [ ] Implement heatmap visualization
- [ ] Add animation on load
- [ ] Create ContributionGraph.css

### 6.7 Create Live Demo Component
- [ ] Create ProjectDemo.tsx
- [ ] Implement iframe embedding
- [ ] Add loading state
- [ ] Add fullscreen toggle
- [ ] Create ProjectDemo.css

### 6.8 Update Project Detail Page
- [ ] Add GitHubReadme component
- [ ] Add RepoStats component
- [ ] Add ProjectDemo component (if demo_url exists)
- [ ] Update Project type with demo_url field
- [ ] Update project YAML files with demo_url

### Phase 6 Verification
- [ ] README renders on project pages
- [ ] Code blocks have syntax highlighting
- [ ] Repo stats display correctly
- [ ] Contribution graph animates
- [ ] Demo embed works (if applicable)
- [ ] API caching works (second load is faster)
- [ ] Error states display gracefully

### Phase 6 Commit
```bash
git add .
git commit -m "Phase 6: GitHub integration with README rendering

- Add GitHub API endpoints to backend
- Create GitHub service with caching
- Implement GitHubReadme component with syntax highlighting
- Add RepoStats component
- Add ContributionGraph component
- Add ProjectDemo embedding
- Update project pages with GitHub data"
```

---

## Post-Migration Checklist

After completing all phases:

### Final Verification
- [ ] All pages load without errors
- [ ] All features work as expected
- [ ] No console errors
- [ ] No TypeScript errors (`npm run build`)
- [ ] No lint errors (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)

### Performance Check
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 95
- [ ] Lighthouse Best Practices > 90
- [ ] Lighthouse SEO > 95
- [ ] Core Web Vitals pass

### Documentation
- [ ] README updated with new features
- [ ] Environment variables documented
- [ ] Deployment instructions updated

### Deployment
- [ ] Build succeeds in CI
- [ ] Deploy to staging
- [ ] Test all features on staging
- [ ] Deploy to production
- [ ] Verify production site works
- [ ] Monitor error logs for 24 hours

---

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate rollback**: Revert to previous commit
   ```bash
   git revert HEAD --no-edit
   git push
   ```

2. **Identify issue**: Check error logs, reproduce locally

3. **Fix forward**: If possible, fix the issue and deploy again

4. **Partial rollback**: If a specific feature is broken, disable it with feature flag

---

## Support

If you encounter issues not covered in this documentation:

1. Check the [Common Issues](#) section in each phase document
2. Search existing GitHub issues
3. Create a new issue with:
   - Phase and task number
   - Error message or unexpected behavior
   - Steps to reproduce
   - Environment details

---

*Document Version: 1.0.0*
*Last Updated: January 2026*
