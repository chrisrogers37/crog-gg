# 09 - Technical Specifications

## Purpose
This document defines the technical contracts, data models, and API specifications for the portfolio enhancement project. Use this as a reference when implementing features.

---

## Table of Contents
1. [TypeScript Interfaces](#typescript-interfaces)
2. [API Specifications](#api-specifications)
3. [YAML Schemas](#yaml-schemas)
4. [Environment Variables](#environment-variables)
5. [Database/Storage](#databasestorage)
6. [Error Handling Standards](#error-handling-standards)

---

## TypeScript Interfaces

### Content Types

```typescript
// frontend/src/types/content.ts

/**
 * Bio data from bio.yaml
 */
export interface BioData {
  display_name: string;
  email: string;
  location: string;
  about_text: string;
  welcome_message: string;
  social_links: {
    github: string;
    linkedin: string;
    spotify: string;
    hoobe: string;
  };
}

/**
 * Experience item from experience.yaml
 */
export interface ExperienceItem {
  title: string;
  company: string;
  period: string;
  achievements: string[];
}

/**
 * Education item from education.yaml
 */
export interface EducationItem {
  school: string;
  degree: string;
  year: string;
}

/**
 * Skill item from skills.yaml
 */
export interface SkillItem {
  name: string;
  weight: number; // 1-9 scale for word cloud sizing
}

/**
 * Project from projects/*.yaml
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  url?: string;
  demo_url?: string;
  icon?: string;
  category?: string;
  technologies?: string[];
  featured?: boolean;
  order?: number;
  status?: 'Active' | 'Archived' | 'In Development';
}

/**
 * Complete content state
 */
export interface ContentState {
  bio: BioData;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: Project[];
}
```

### API Response Types

```typescript
// frontend/src/types/api.ts

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Regenerate endpoint request
 */
export interface RegenerateRequest {
  section: 'about' | 'experience' | 'education' | 'portfolio';
  current_content: {
    bio: BioData;
    experience: ExperienceItem[];
    education: EducationItem[];
  };
  use_fantasy: boolean;
}

/**
 * Regenerate endpoint response
 */
export interface RegenerateResponse {
  about_text?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  welcome_message?: string;
}

/**
 * GitHub repository response
 */
export interface GitHubRepository {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  license: {
    name: string;
    spdx_id: string;
  } | null;
  default_branch: string;
}

/**
 * GitHub language statistics
 */
export interface LanguageStats {
  [language: string]: number; // bytes of code
}

/**
 * GitHub contribution data
 */
export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionData {
  total: number;
  weeks: ContributionDay[][];
}
```

### Store Types

```typescript
// frontend/src/types/store.ts

/**
 * Content store state
 */
export interface ContentStoreState {
  // Data
  bio: BioData | null;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: Project[];

  // Original data for reset
  originalBio: BioData | null;
  originalExperience: ExperienceItem[];
  originalEducation: EducationItem[];

  // Loading states
  isLoading: boolean;
  isRegenerating: boolean;
  error: string | null;

  // Flags
  hasModifiedContent: boolean;
}

/**
 * Content store actions
 */
export interface ContentStoreActions {
  loadContent: () => Promise<void>;
  regenerateContent: (section: string, useFantasy: boolean) => Promise<void>;
  resetContent: () => void;
  clearError: () => void;
}

/**
 * UI store state
 */
export interface UIStoreState {
  activeSection: string;
  theme: 'light' | 'dark' | 'system';
  isMobileMenuOpen: boolean;
}

/**
 * UI store actions
 */
export interface UIStoreActions {
  setActiveSection: (section: string) => void;
  toggleSection: (section: string) => void;
  clearActiveSection: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}
```

---

## API Specifications

### Base Configuration

| Setting | Development | Production |
|---------|-------------|------------|
| Base URL | `http://localhost:5000` | `https://api.crog.gg` |
| CORS Origins | `http://localhost:5173` | `https://crog.gg` |
| Rate Limiting | Disabled | Enabled |

### Endpoints

#### POST /api/regenerate

Regenerate content using OpenAI.

**Request:**
```json
{
  "section": "about",
  "current_content": {
    "bio": { /* BioData */ },
    "experience": [ /* ExperienceItem[] */ ],
    "education": [ /* EducationItem[] */ ]
  },
  "use_fantasy": false
}
```

**Response (200 OK):**
```json
{
  "about_text": "Regenerated about text...",
  "experience": [ /* Optional: regenerated experience */ ],
  "education": [ /* Optional: regenerated education */ ]
}
```

**Error Response (500):**
```json
{
  "error": "Failed to regenerate content",
  "code": "OPENAI_ERROR"
}
```

**Rate Limit:** 5 requests per minute

---

#### GET /api/v1/github/repo/:name

Get repository information.

**Parameters:**
- `name` (path): Repository name

**Response (200 OK):**
```json
{
  "name": "shuffify",
  "full_name": "chrisrogers37/shuffify",
  "description": "A Spotify playlist shuffler",
  "html_url": "https://github.com/chrisrogers37/shuffify",
  "stargazers_count": 42,
  "forks_count": 5,
  "language": "TypeScript",
  "topics": ["spotify", "react", "typescript"],
  "updated_at": "2026-01-15T10:30:00Z"
}
```

**Rate Limit:** 30 requests per minute

---

#### GET /api/v1/github/readme/:name

Get repository README content (base64 encoded).

**Parameters:**
- `name` (path): Repository name

**Response (200 OK):**
```json
{
  "content": "IyBTaHVmZmlmeQoKQSBTcG90aWZ5...",
  "encoding": "base64",
  "sha": "abc123..."
}
```

**Response (404):**
```json
{
  "error": "README not found"
}
```

**Rate Limit:** 30 requests per minute

---

#### GET /api/v1/github/languages/:name

Get repository language breakdown.

**Parameters:**
- `name` (path): Repository name

**Response (200 OK):**
```json
{
  "TypeScript": 45000,
  "JavaScript": 12000,
  "CSS": 8000,
  "HTML": 2000
}
```

**Rate Limit:** 30 requests per minute

---

#### GET /api/v1/github/languages

Get aggregated language stats for all repositories.

**Response (200 OK):**
```json
{
  "Python": 150000,
  "TypeScript": 120000,
  "JavaScript": 80000,
  "Go": 45000,
  "CSS": 30000
}
```

**Rate Limit:** 10 requests per minute

---

#### GET /api/v1/github/contributions

Get contribution calendar data.

**Response (200 OK):**
```json
{
  "total": 847,
  "weeks": [
    [
      { "date": "2025-01-26", "count": 0, "level": 0 },
      { "date": "2025-01-27", "count": 3, "level": 1 },
      { "date": "2025-01-28", "count": 8, "level": 2 }
    ]
  ]
}
```

**Rate Limit:** 5 requests per minute

---

## YAML Schemas

### bio.yaml

```yaml
# Schema for frontend/src/content/bio.yaml
display_name: string (required)
email: string (required, email format)
location: string (required)
about_text: string (required, multiline)
welcome_message: string (required)
social_links:
  github: string (url)
  linkedin: string (url)
  spotify: string (url)
  hoobe: string (url)
```

**Example:**
```yaml
display_name: Chris Rogers
email: chris@example.com
location: San Francisco, CA
about_text: |
  Software engineer with a passion for building
  beautiful and functional web applications.
welcome_message: Welcome to my corner of the internet!
social_links:
  github: https://github.com/chrisrogers37
  linkedin: https://linkedin.com/in/chrisrogers37
  spotify: https://open.spotify.com/artist/xxx
  hoobe: https://hoobe.me/chris
```

---

### experience.yaml

```yaml
# Schema for frontend/src/content/experience.yaml
# Array of experience items
- title: string (required)
  company: string (required)
  period: string (required, e.g., "2020 - Present")
  achievements:
    - string (required, at least one)
```

**Example:**
```yaml
- title: Senior Software Engineer
  company: Tech Corp
  period: 2022 - Present
  achievements:
    - Led development of microservices architecture
    - Reduced API latency by 40%
    - Mentored team of 5 junior developers

- title: Software Engineer
  company: Startup Inc
  period: 2020 - 2022
  achievements:
    - Built React frontend from scratch
    - Implemented CI/CD pipeline
```

---

### education.yaml

```yaml
# Schema for frontend/src/content/education.yaml
# Array of education items
- school: string (required)
  degree: string (required)
  year: string (required)
```

**Example:**
```yaml
- school: University of California
  degree: B.S. Computer Science
  year: "2020"

- school: Online Academy
  degree: Machine Learning Certificate
  year: "2021"
```

---

### skills.yaml

```yaml
# Schema for frontend/src/content/skills.yaml
# Array of skill items
- name: string (required)
  weight: number (required, 1-9)
```

**Example:**
```yaml
- name: TypeScript
  weight: 9
- name: React
  weight: 8
- name: Python
  weight: 7
- name: Docker
  weight: 5
```

---

### projects/index.yaml

```yaml
# Schema for frontend/src/content/projects/index.yaml
projects:
  - string (filename without path)
```

**Example:**
```yaml
projects:
  - shuffify.yaml
  - city-cycles.yaml
  - hedwig.yaml
```

---

### projects/*.yaml

```yaml
# Schema for individual project files
id: string (required, URL-safe)
title: string (required)
description: string (required)
url: string (optional, URL)
demo_url: string (optional, URL)
icon: string (optional, emoji)
category: string (optional)
technologies:
  - string
featured: boolean (optional, default: false)
order: number (optional, for sorting)
status: string (optional, 'Active' | 'Archived' | 'In Development')
```

**Example:**
```yaml
id: shuffify
title: Shuffify
description: A Spotify playlist shuffler that creates truly random shuffles
url: https://github.com/chrisrogers37/shuffify
demo_url: https://shuffify.app
icon: 🎵
category: Web App
technologies:
  - React
  - TypeScript
  - Spotify API
  - Tailwind CSS
featured: true
order: 1
status: Active
```

---

## Environment Variables

### Frontend (.env)

```bash
# API Configuration
VITE_API_URL=https://api.crog.gg  # Backend API URL

# Analytics (optional)
VITE_PLAUSIBLE_DOMAIN=crog.gg
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Backend (.env)

```bash
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-secret-key-here

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=chrisrogers37

# CORS
CORS_ORIGINS=https://crog.gg,https://www.crog.gg

# Rate Limiting
RATELIMIT_STORAGE_URL=memory://  # or redis://localhost:6379
```

---

## Database/Storage

### Current Storage
This application uses **file-based storage** via YAML files. No database is required.

| Data Type | Storage Location | Format |
|-----------|------------------|--------|
| Bio | `frontend/src/content/bio.yaml` | YAML |
| Experience | `frontend/src/content/experience.yaml` | YAML |
| Education | `frontend/src/content/education.yaml` | YAML |
| Skills | `frontend/src/content/skills.yaml` | YAML |
| Projects | `frontend/src/content/projects/*.yaml` | YAML |
| User Preferences | Browser localStorage | JSON |

### Browser Storage

```typescript
// localStorage keys
{
  "ui-storage": {
    "state": {
      "theme": "light" | "dark" | "system"
    },
    "version": 0
  }
}
```

---

## Error Handling Standards

### Frontend Error Handling

```typescript
// Error boundary for component-level errors
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// API error handling pattern
async function fetchWithErrorHandling<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.message || 'Unknown error');
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new NetworkError('Network request failed');
  }
}

// Custom error classes
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

### Backend Error Handling

```python
# Flask error handlers
@app.errorhandler(400)
def bad_request(e):
    return jsonify(error=str(e.description)), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify(error='Resource not found'), 404

@app.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify(error='Rate limit exceeded', retry_after=e.description), 429

@app.errorhandler(500)
def internal_error(e):
    app.logger.error(f'Internal error: {e}')
    return jsonify(error='Internal server error'), 500

# Custom exception handling
class ValidationError(Exception):
    def __init__(self, message, field=None):
        self.message = message
        self.field = field

@app.errorhandler(ValidationError)
def handle_validation_error(e):
    return jsonify(error=e.message, field=e.field), 400
```

### Error Messages User Guide

| Error Type | User-Facing Message | Developer Action |
|------------|---------------------|------------------|
| Network Error | "Unable to connect. Please check your internet connection." | Retry with exponential backoff |
| API 404 | "The requested content was not found." | Check resource exists |
| API 429 | "Too many requests. Please wait a moment." | Implement rate limiting on client |
| API 500 | "Something went wrong. Please try again later." | Log error, alert monitoring |
| Validation | Show specific field error | Fix input validation |

---

*Document Version: 1.0.0*
*Last Updated: January 2026*
