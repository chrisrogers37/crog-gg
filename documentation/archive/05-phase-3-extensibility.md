# 05 - Phase 3: Extensibility

## Overview

**Goal**: Enable the application to host GitHub projects as dedicated pages with dynamic content loading.

**Estimated Effort**: 21 story points

**Prerequisites**:
- Phase 1 and Phase 2 completed
- Understanding of React Router dynamic routes

**Deliverables**:
1. Projects listing page at `/projects`
2. Individual project detail pages at `/projects/:slug`
3. Dynamic YAML loading (no hardcoded file lists)
4. Project page template component
5. Layout component with shared navigation

---

## Table of Contents
1. [Task 3.1: Create Layout Component](#task-31-create-layout-component)
2. [Task 3.2: Update Router Configuration](#task-32-update-router-configuration)
3. [Task 3.3: Create Projects Listing Page](#task-33-create-projects-listing-page)
4. [Task 3.4: Create Project Detail Page](#task-34-create-project-detail-page)
5. [Task 3.5: Dynamic YAML Loading](#task-35-dynamic-yaml-loading)
6. [Task 3.6: Project Template Component](#task-36-project-template-component)
7. [Task 3.7: Navigation Breadcrumbs](#task-37-navigation-breadcrumbs)
8. [Verification Checklist](#verification-checklist)
9. [Common Issues](#common-issues)

---

## Task 3.1: Create Layout Component

### What We're Doing
Creating a shared layout component that wraps all pages with consistent header and navigation.

### Why This Is Needed
- Consistent header/footer across all pages
- Navigation visible on project detail pages
- Outlet pattern for nested routes

### Create File: `frontend/src/components/layout/Layout/Layout.tsx`

```typescript
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../Header';
import { Navigation } from '../Navigation';
import { Footer } from '../Footer';
import './Layout.css';

/**
 * Layout Component
 *
 * Provides consistent structure across all pages:
 * - Header with profile info (on home) or compact header (on other pages)
 * - Navigation for moving between pages
 * - Main content area (via Outlet)
 * - Footer
 */
export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="layout">
      {/* Full header on home, compact on other pages */}
      {isHomePage ? (
        <Header />
      ) : (
        <header className="compact-header">
          <Navigation />
        </header>
      )}

      {/* Main content - renders child routes */}
      <main className="layout-main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
```

### Create File: `frontend/src/components/layout/Layout/Layout.css`

```css
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-main {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.compact-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

@media (max-width: 768px) {
  .layout-main {
    padding: 1rem;
  }
}
```

### Create File: `frontend/src/components/layout/Navigation/Navigation.tsx`

```typescript
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

/**
 * Navigation Component
 *
 * Top-level navigation for moving between main pages.
 * Highlights the current active page.
 */
export function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/projects', label: 'Projects' },
  ];

  return (
    <nav className="main-navigation" aria-label="Main navigation">
      <Link to="/" className="nav-logo">
        Chris Rogers
      </Link>

      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`nav-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### Create File: `frontend/src/components/layout/Navigation/Navigation.css`

```css
.main-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-logo {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  text-decoration: none;
}

.nav-logo:hover {
  color: #2563eb;
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
}

.nav-link:hover {
  color: #1e293b;
}

.nav-link.active {
  color: #2563eb;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #2563eb;
}

@media (max-width: 640px) {
  .nav-links {
    gap: 1rem;
  }
}
```

### Create File: `frontend/src/components/layout/Footer/Footer.tsx`

```typescript
import './Footer.css';

/**
 * Footer Component
 *
 * Simple footer with copyright and links.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-copyright">
          &copy; {currentYear} Chris Rogers. All rights reserved.
        </p>
        <div className="footer-links">
          <a
            href="https://github.com/chrisrogers37"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/chrisrogers37"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
```

### Create Index Files

```typescript
// frontend/src/components/layout/Layout/index.ts
export { Layout } from './Layout';

// frontend/src/components/layout/Navigation/index.ts
export { Navigation } from './Navigation';

// frontend/src/components/layout/Footer/index.ts
export { Footer } from './Footer';
```

---

## Task 3.2: Update Router Configuration

### What We're Doing
Adding project routes and using the Layout component.

### Update File: `frontend/src/router.tsx`

```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layout
import { Layout } from './components/layout/Layout';

// Pages
import { HomePage } from './pages/Home';
import { ProjectsPage } from './pages/Projects';
import { ProjectDetailPage } from './pages/Projects/ProjectDetailPage';
import { NotFoundPage } from './pages/NotFound';

/**
 * Application Router Configuration
 *
 * Routes:
 * /                    - Home page (portfolio)
 * /projects            - Projects listing
 * /projects/:slug      - Individual project detail
 * /*                   - 404 Not Found
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'projects',
        children: [
          {
            index: true,
            element: <ProjectsPage />,
          },
          {
            path: ':slug',
            element: <ProjectDetailPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

### Route Explanation

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Full portfolio with sections |
| `/projects` | ProjectsPage | Grid of all projects |
| `/projects/:slug` | ProjectDetailPage | Single project (slug = project id) |
| `*` | NotFoundPage | 404 handler |

---

## Task 3.3: Create Projects Listing Page

### What We're Doing
Creating a dedicated page that lists all projects with filtering and search.

### Create Directory

```bash
mkdir -p frontend/src/pages/Projects
```

### Create File: `frontend/src/pages/Projects/ProjectsPage.tsx`

```typescript
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../../store';
import { Project } from '../../types';
import './ProjectsPage.css';

/**
 * ProjectsPage
 *
 * Displays all projects in a grid with filtering capabilities.
 * Each project card links to its detail page.
 */
export function ProjectsPage() {
  const projects = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract unique categories from projects
  const categories = useMemo(() => {
    const cats = new Set(projects.map((p) => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [projects]);

  // Filter projects based on search and category
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchQuery === '' ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.technologies?.some((tech) =>
          tech.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'all' || project.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [projects, searchQuery, selectedCategory]);

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1 className="projects-title">Projects</h1>
        <p className="projects-subtitle">
          A collection of my work, side projects, and experiments.
        </p>
      </header>

      {/* Filters */}
      <div className="projects-filters">
        <input
          type="search"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category-button ${
                selectedCategory === category ? 'active' : ''
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <ProjectListCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No projects match your search criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="clear-filters"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * ProjectListCard
 *
 * Card component for the projects listing page.
 * Links to the project detail page.
 */
function ProjectListCard({ project }: { project: Project }) {
  return (
    <Link to={`/projects/${project.id}`} className="project-list-card">
      <div className="card-icon">{project.icon || '📁'}</div>

      <div className="card-content">
        <h2 className="card-title">{project.title}</h2>
        <p className="card-description">{project.description}</p>

        {project.technologies && project.technologies.length > 0 && (
          <div className="card-technologies">
            {project.technologies.slice(0, 4).map((tech) => (
              <span key={tech} className="tech-tag">
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="tech-tag more">
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="card-arrow">→</div>
    </Link>
  );
}
```

### Create File: `frontend/src/pages/Projects/ProjectsPage.css`

```css
.projects-page {
  max-width: 1000px;
  margin: 0 auto;
}

.projects-header {
  text-align: center;
  margin-bottom: 3rem;
}

.projects-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.projects-subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin: 0;
}

/* Filters */
.projects-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: capitalize;
}

.category-button:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.category-button.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

/* Projects Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Project Card */
.project-list-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.project-list-card:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.card-description {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-technologies {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.tech-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
}

.tech-tag.more {
  background: #e2e8f0;
}

.card-arrow {
  font-size: 1.25rem;
  color: #cbd5e1;
  transition: color 0.2s, transform 0.2s;
}

.project-list-card:hover .card-arrow {
  color: #2563eb;
  transform: translateX(4px);
}

/* No Results */
.no-results {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.clear-filters {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.clear-filters:hover {
  background: #1e40af;
}

/* Responsive */
@media (max-width: 640px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }

  .projects-title {
    font-size: 2rem;
  }
}
```

### Create File: `frontend/src/pages/Projects/index.ts`

```typescript
export { ProjectsPage } from './ProjectsPage';
export { ProjectDetailPage } from './ProjectDetailPage';
```

---

## Task 3.4: Create Project Detail Page

### What We're Doing
Creating the individual project page that will show project details and (in Phase 6) README content from GitHub.

### Create File: `frontend/src/pages/Projects/ProjectDetailPage.tsx`

```typescript
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProjects } from '../../store';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import './ProjectDetailPage.css';

/**
 * ProjectDetailPage
 *
 * Displays detailed information about a single project.
 * The slug parameter maps to project.id from the YAML data.
 *
 * In Phase 6, this will also display the GitHub README.
 */
export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const projects = useProjects();

  // Find the project by slug (id)
  const project = projects.find((p) => p.id === slug);

  // Handle project not found
  if (!project) {
    return (
      <div className="project-not-found">
        <h1>Project Not Found</h1>
        <p>The project "{slug}" could not be found.</p>
        <Link to="/projects" className="back-link">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', path: '/' },
          { label: 'Projects', path: '/projects' },
          { label: project.title },
        ]}
      />

      {/* Project Header */}
      <header className="project-header">
        <div className="project-icon-large">{project.icon || '📁'}</div>
        <div className="project-header-content">
          <h1 className="project-title">{project.title}</h1>
          <p className="project-description">{project.description}</p>

          {/* Links */}
          <div className="project-links">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="project-link primary"
              >
                {project.url.includes('github.com')
                  ? '🔗 View on GitHub'
                  : '🔗 View Project'}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Technologies */}
      {project.technologies && project.technologies.length > 0 && (
        <section className="project-section">
          <h2 className="section-title">Technologies</h2>
          <div className="technologies-list">
            {project.technologies.map((tech) => (
              <span key={tech} className="technology-badge">
                {tech}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* README Placeholder - Will be implemented in Phase 6 */}
      <section className="project-section readme-section">
        <h2 className="section-title">About This Project</h2>
        <div className="readme-placeholder">
          <p>
            Project README will be loaded from GitHub in a future update.
          </p>
          <p>
            For now, visit the{' '}
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              project repository
            </a>{' '}
            to learn more.
          </p>
        </div>
      </section>

      {/* Back Button */}
      <div className="project-footer">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Go Back
        </button>
        <Link to="/projects" className="all-projects-link">
          View All Projects
        </Link>
      </div>
    </div>
  );
}
```

### Create File: `frontend/src/pages/Projects/ProjectDetailPage.css`

```css
.project-detail-page {
  max-width: 800px;
  margin: 0 auto;
}

.project-not-found {
  text-align: center;
  padding: 4rem 2rem;
}

.project-not-found h1 {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.project-not-found p {
  color: #64748b;
  margin-bottom: 2rem;
}

.back-link {
  color: #2563eb;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

/* Header */
.project-header {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  margin: 2rem 0;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.project-icon-large {
  font-size: 4rem;
  flex-shrink: 0;
}

.project-header-content {
  flex: 1;
}

.project-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.75rem;
}

.project-description {
  font-size: 1.125rem;
  color: #64748b;
  margin: 0 0 1.5rem;
  line-height: 1.6;
}

.project-links {
  display: flex;
  gap: 1rem;
}

.project-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.project-link.primary {
  background: #1e293b;
  color: white;
}

.project-link.primary:hover {
  background: #0f172a;
}

/* Sections */
.project-section {
  margin: 2rem 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem;
}

/* Technologies */
.technologies-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.technology-badge {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  color: #475569;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
}

/* README Placeholder */
.readme-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 2rem;
}

.readme-placeholder {
  text-align: center;
  color: #64748b;
}

.readme-placeholder a {
  color: #2563eb;
}

/* Footer */
.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.back-button {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.all-projects-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.all-projects-link:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 640px) {
  .project-header {
    flex-direction: column;
    text-align: center;
  }

  .project-title {
    font-size: 1.5rem;
  }

  .project-links {
    justify-content: center;
  }
}
```

---

## Task 3.5: Dynamic YAML Loading

### What We're Doing
Replacing hardcoded file lists with dynamic glob-based loading.

### Current Problem

**Location**: `frontend/vite.config.ts`

The current Vite plugin manually copies files. We need to:
1. Load project list from index.yaml
2. Dynamically load each project's YAML
3. No hardcoded file paths

### Update File: `frontend/src/utils/projectLoader.ts`

```typescript
import yaml from 'js-yaml';
import { Project } from '../types';

interface ProjectIndex {
  projects: string[];
}

/**
 * Load all projects from YAML files.
 *
 * This loader:
 * 1. Fetches /content/projects/index.yaml to get list of project files
 * 2. Fetches each individual project YAML file
 * 3. Returns array of Project objects
 *
 * This approach allows adding new projects by:
 * 1. Creating a new YAML file in /content/projects/
 * 2. Adding the filename to index.yaml
 *
 * No code changes required to add new projects.
 */
export async function loadProjects(): Promise<Project[]> {
  try {
    // Step 1: Load the index file
    const indexResponse = await fetch('/content/projects/index.yaml');
    if (!indexResponse.ok) {
      console.error('Failed to fetch projects index');
      return [];
    }

    const indexContent = await indexResponse.text();
    const index = yaml.load(indexContent) as ProjectIndex;

    if (!index.projects || !Array.isArray(index.projects)) {
      console.error('Invalid projects index format');
      return [];
    }

    // Step 2: Load each project file
    const projectPromises = index.projects.map(async (filename) => {
      try {
        const response = await fetch(`/content/projects/${filename}`);
        if (!response.ok) {
          console.warn(`Failed to load project: ${filename}`);
          return null;
        }

        const content = await response.text();
        const project = yaml.load(content) as Project;

        // Ensure id exists (use filename without extension as fallback)
        if (!project.id) {
          project.id = filename.replace('.yaml', '');
        }

        return project;
      } catch (error) {
        console.warn(`Error loading project ${filename}:`, error);
        return null;
      }
    });

    const projects = await Promise.all(projectPromises);

    // Filter out failed loads and sort by order (if specified)
    return projects
      .filter((p): p is Project => p !== null)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

/**
 * Load a single project by ID.
 *
 * Useful for loading project details without fetching all projects.
 */
export async function loadProjectById(id: string): Promise<Project | null> {
  try {
    const response = await fetch(`/content/projects/${id}.yaml`);
    if (!response.ok) {
      return null;
    }

    const content = await response.text();
    const project = yaml.load(content) as Project;
    project.id = project.id || id;

    return project;
  } catch (error) {
    console.error(`Error loading project ${id}:`, error);
    return null;
  }
}
```

### Update Vite Config for Recursive Copy

**Location**: `frontend/vite.config.ts`

The existing plugin already handles recursive copying. Verify it includes subdirectories:

```typescript
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';

function copyContentPlugin(): Plugin {
  return {
    name: 'copy-content',
    writeBundle() {
      const srcDir = resolve(__dirname, 'src/content');
      const destDir = resolve(__dirname, 'dist/content');

      const copyRecursive = (src: string, dest: string) => {
        if (!existsSync(src)) return;

        const stats = statSync(src);

        if (stats.isDirectory()) {
          mkdirSync(dest, { recursive: true });
          readdirSync(src).forEach((file) => {
            copyRecursive(resolve(src, file), resolve(dest, file));
          });
        } else {
          copyFileSync(src, dest);
        }
      };

      copyRecursive(srcDir, destDir);
      console.log('✓ Content files copied to dist/content/');
    },
  };
}

export default defineConfig({
  plugins: [react(), copyContentPlugin()],
});
```

---

## Task 3.6: Project Template Component

### What We're Doing
Creating a reusable template for project pages that can be extended in Phase 6.

### Create File: `frontend/src/components/templates/ProjectTemplate/ProjectTemplate.tsx`

```typescript
import { ReactNode } from 'react';
import { Project } from '../../../types';
import { Breadcrumbs } from '../../common/Breadcrumbs';
import './ProjectTemplate.css';

interface ProjectTemplateProps {
  project: Project;
  children?: ReactNode;
  readme?: ReactNode;
}

/**
 * ProjectTemplate
 *
 * Reusable template for project detail pages.
 * Provides consistent structure with slots for custom content.
 *
 * Props:
 * - project: The project data
 * - children: Additional content to render
 * - readme: README content (added in Phase 6)
 */
export function ProjectTemplate({ project, children, readme }: ProjectTemplateProps) {
  return (
    <article className="project-template">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Home', path: '/' },
          { label: 'Projects', path: '/projects' },
          { label: project.title },
        ]}
      />

      {/* Project Hero */}
      <header className="project-hero">
        <div className="hero-icon">{project.icon || '📁'}</div>
        <h1 className="hero-title">{project.title}</h1>
        <p className="hero-description">{project.description}</p>

        {/* Status Badge */}
        {project.status && (
          <span className={`status-badge status-${project.status.toLowerCase()}`}>
            {project.status}
          </span>
        )}
      </header>

      {/* Quick Links */}
      <nav className="project-quick-links">
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link"
          >
            <span className="link-icon">🔗</span>
            <span className="link-text">
              {project.url.includes('github.com') ? 'GitHub' : 'Website'}
            </span>
          </a>
        )}
      </nav>

      {/* Technologies */}
      {project.technologies && project.technologies.length > 0 && (
        <section className="project-technologies">
          <h2 className="section-heading">Built With</h2>
          <ul className="tech-list">
            {project.technologies.map((tech) => (
              <li key={tech} className="tech-item">
                {tech}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* README Content (Phase 6) */}
      {readme && (
        <section className="project-readme">
          <h2 className="section-heading">Documentation</h2>
          <div className="readme-content">{readme}</div>
        </section>
      )}

      {/* Additional Content */}
      {children}
    </article>
  );
}
```

---

## Task 3.7: Navigation Breadcrumbs

### What We're Doing
Creating a breadcrumb component for project page navigation.

### Create File: `frontend/src/components/common/Breadcrumbs/Breadcrumbs.tsx`

```typescript
import { Link } from 'react-router-dom';
import './Breadcrumbs.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs Component
 *
 * Displays navigation breadcrumbs for hierarchical pages.
 * The last item is displayed as text (current page), others as links.
 *
 * @example
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', path: '/' },
 *     { label: 'Projects', path: '/projects' },
 *     { label: 'My Project' },  // No path = current page
 *   ]}
 * />
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.label} className="breadcrumb-item">
              {item.path && !isLast ? (
                <Link to={item.path} className="breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <span
                  className="breadcrumb-current"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

### Create File: `frontend/src/components/common/Breadcrumbs/Breadcrumbs.css`

```css
.breadcrumbs {
  margin-bottom: 1.5rem;
}

.breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-link {
  color: #64748b;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: #2563eb;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  color: #cbd5e1;
}

.breadcrumb-current {
  color: #1e293b;
  font-weight: 500;
}
```

### Create Index File: `frontend/src/components/common/Breadcrumbs/index.ts`

```typescript
export { Breadcrumbs } from './Breadcrumbs';
```

---

## Verification Checklist

### Route Tests

- [ ] **Home page**: `/` loads the portfolio home page
- [ ] **Projects page**: `/projects` shows all projects in a grid
- [ ] **Project detail**: `/projects/shuffify` shows Shuffify project details
- [ ] **404 handling**: `/projects/nonexistent` shows "Project Not Found"
- [ ] **Global 404**: `/anything` shows NotFoundPage

### Navigation Tests

- [ ] **Header links**: Navigation shows on all pages
- [ ] **Breadcrumbs work**: Can navigate back via breadcrumbs
- [ ] **Browser back**: Back button works correctly
- [ ] **Deep linking**: Direct URL access works for all routes

### Data Loading Tests

- [ ] **Projects load**: All projects appear on listing page
- [ ] **Search works**: Filtering projects by search works
- [ ] **Category filter**: Filtering by category works
- [ ] **Individual load**: Project detail page shows correct data

### File Structure

```
frontend/src/
├── components/
│   ├── common/
│   │   └── Breadcrumbs/         ✓ NEW
│   ├── layout/
│   │   ├── Layout/              ✓ NEW
│   │   ├── Navigation/          ✓ NEW
│   │   └── Footer/              ✓ NEW
│   └── templates/
│       └── ProjectTemplate/     ✓ NEW
├── pages/
│   └── Projects/
│       ├── ProjectsPage.tsx     ✓ NEW
│       ├── ProjectDetailPage.tsx ✓ NEW
│       └── index.ts             ✓ NEW
└── router.tsx                   ✓ UPDATED
```

---

## Common Issues

### Issue: Project detail page shows "Not Found" for valid project

**Cause**: Project ID doesn't match URL slug.

**Solution**: Ensure project YAML has `id` field matching the URL:
```yaml
# /content/projects/shuffify.yaml
id: shuffify  # This must match /projects/shuffify URL
title: Shuffify
```

### Issue: Layout not showing on project pages

**Cause**: Layout component not wrapping routes.

**Solution**: Verify router.tsx has Layout as parent with Outlet:
```typescript
{
  path: '/',
  element: <Layout />,  // Must use Outlet
  children: [...]
}
```

### Issue: Breadcrumbs don't show on home page

**Expected behavior**: Breadcrumbs are for hierarchical pages, not the home page.

---

## Next Steps

After completing Phase 3:

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Phase 3: Add project pages and dynamic content loading"
   ```

2. **Proceed to Phase 4**: [06-phase-4-visual-design.md](./06-phase-4-visual-design.md)

---

*Document Version: 1.0.0*
*Last Updated: January 2026*
