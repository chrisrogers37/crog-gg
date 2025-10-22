# Choose Your Own Chris - Site Update Plan

## Project Overview
This is an interactive portfolio website featuring dynamic content generation using OpenAI's GPT-3.5. The site showcases professional experience, projects, and musical endeavors with AI-powered content regeneration capabilities.

## Current Architecture
- **Frontend**: React + TypeScript + Vite (port 5173)
- **Backend**: Flask + OpenAI API (port 5001)
- **Deployment**: Systemd services on Ubuntu servers
- **Content Management**: Currently hardcoded in TypeScript files

## Phase 1: Bio Content Refactoring

### Current Problem
The bio content is currently stored as a single long string in `frontend/src/data/resume.ts`:
```typescript
bio: "I use data to tackle ambiguous business problems and deliver clear, actionable recommendations at the point of decision. I care deeply about building systems that make insight repeatable, whether that means automating workflows, designing scalable infrastructure, or creating tools that make analytics easier to deliver, use, and understand. I stay close to the cutting edge, regularly building and experimenting with AI-enriched processes, including retrieval-augmented generation (RAG), vector search, and other LLM-integrated approaches (click Summon New Lore to see one in action!).\n\nOutside of work, I spend a lot of time on music. I produce my own songs, experiment with audio engineering, and occasionally DJ around NYC. When I get the chance to escape the city, I enjoy traveling abroad to see new places or retreating to Maine to relax in nature with a few good books.\n\nFeel free to explore my experience, projects, and other interests by navigating through the other sections above."
```

### Proposed Solutions

#### Option 1: Markdown Files (Recommended)
- Create `content/` directory with markdown files
- Structure: `content/bio.md`, `content/experience.md`, etc.
- Use a markdown parser in the frontend
- Benefits: Human-readable, version controlled, easy to edit

#### Option 2: JSON with Better Structure
- Break bio into logical sections (professional, personal, call-to-action)
- Use structured JSON with separate fields
- Benefits: Maintains current architecture, easier to edit

#### Option 3: Headless CMS Integration
- Integrate with Strapi, Contentful, or Sanity
- Benefits: Full CMS capabilities, non-technical editing
- Drawbacks: Additional complexity, external dependency

### Implementation Steps

1. **Create New Branch**: `git checkout -b feature/bio-content-refactor`
2. **Implement Content Source**: Choose and implement one of the above options
3. **Update Frontend**: Modify components to read from new content source
4. **Test Locally**: Ensure all functionality works
5. **Update Backend**: Modify AI regeneration to work with new content structure

## Phase 2: Projects Refactoring & Update

### Current Projects Display
Located in `frontend/src/components/Portfolio.tsx` (lines 143-175):
- Shuffify (Spotify playlist management)
- City Cycles (NYC/London bike analytics)
- Hedwig (RAG-assisted email templates)
- GitHub (open source projects)

### Current Problem
Projects are hardcoded in the React component with static data:
```typescript
const LINKS = {
  github: "https://github.com/chrisrogers37/",
  shuffify: "https://shuffify.app",
  hoobe: "https://hoo.be/crog",
  spotify: "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn"
} as const;
```

### YAML Projects Directory Implementation

Create `frontend/src/content/projects/` directory with individual YAML files:
```
frontend/src/content/
├── bio.yaml
└── projects/
    ├── shuffify.yaml
    ├── city-cycles.yaml
    ├── hedwig.yaml
    ├── github.yaml
    └── new-project.yaml
```

Each project file structure:
```yaml
# Shuffify - Spotify Playlist Manager
id: shuffify
title: Shuffify
description: |
  A better way to manage your Spotify playlists with advanced 
  filtering, organization, and discovery features.
url: https://shuffify.app
icon: fas fa-music
category: web-app
technologies:
  - React
  - TypeScript
  - Spotify API
  - Node.js
featured: true
order: 1
# Optional fields
image: shuffify-screenshot.png
github: https://github.com/chrisrogers37/shuffify
demo: https://demo.shuffify.app
status: active
tags:
  - music
  - spotify
  - playlist-management
```

### YAML Benefits
- **Human Readable**: Clean, indented syntax, no quotes needed
- **Easy to Edit**: No brackets, braces, or comma management
- **Comments Support**: Can add explanatory comments
- **Multi-line Support**: Easy to write long descriptions with `|`
- **Array Syntax**: Clean list formatting with dashes
- **Error Resistant**: Much harder to break than JSON

### Implementation Setup
```typescript
// Add yaml parser dependency
npm install js-yaml
npm install @types/js-yaml

// Project loader utility
import yaml from 'js-yaml';
import fs from 'fs';

export const loadProjects = async (): Promise<Project[]> => {
  const projectsDir = 'content/projects/';
  const files = fs.readdirSync(projectsDir);
  
  return files
    .filter(file => file.endsWith('.yaml'))
    .map(file => {
      const content = fs.readFileSync(`${projectsDir}/${file}`, 'utf8');
      return yaml.load(content) as Project;
    })
    .sort((a, b) => a.order - b.order);
};
```

### Implementation Benefits

#### Easy Project Addition
1. **Drop-in Projects**: Simply add a new YAML file to `content/projects/`
2. **Automatic Discovery**: Frontend automatically discovers and displays new projects
3. **No Code Changes**: Adding projects requires no React component modifications
4. **Version Control**: Each project is tracked individually in git
5. **Human Friendly**: Non-technical users can easily edit YAML files

#### Enhanced Project Management
1. **Categorization**: Group projects by type (web-app, data-science, music, etc.)
2. **Featured Projects**: Highlight important projects
3. **Ordering**: Control display order without code changes
4. **Rich Metadata**: Store technologies, links, screenshots, etc.

#### Developer Experience
1. **Type Safety**: TypeScript interfaces for project structure
2. **Validation**: Runtime validation of project data
3. **Hot Reload**: Changes reflect immediately in development
4. **Error Handling**: Graceful handling of malformed project files

### Implementation Steps

1. **Install YAML Dependencies**
   ```bash
   cd frontend
   npm install js-yaml
   npm install @types/js-yaml
   ```

2. **Create Projects Directory Structure**
   ```bash
   mkdir -p frontend/src/content/projects
   ```

3. **Define Project Interface**
   ```typescript
   // types/Project.ts
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
     status?: 'active' | 'archived' | 'experimental';
     tags?: string[];
   }
   ```

4. **Create Project Loader Utility**
   ```typescript
   // utils/projectLoader.ts
   import yaml from 'js-yaml';
   import fs from 'fs';
   import { Project } from '../types/Project';

   export const loadProjects = async (): Promise<Project[]> => {
     const projectsDir = 'content/projects/';
     const files = fs.readdirSync(projectsDir);
     
     return files
       .filter(file => file.endsWith('.yaml'))
       .map(file => {
         const content = fs.readFileSync(`${projectsDir}/${file}`, 'utf8');
         return yaml.load(content) as Project;
       })
       .sort((a, b) => a.order - b.order);
   };
   ```

5. **Update Portfolio Component**
   - Replace hardcoded projects with dynamic YAML loading
   - Add project filtering and categorization
   - Implement responsive grid layout
   - Add project detail modals

6. **Migrate Existing Projects**
   - Convert hardcoded projects to YAML files
   - Test all project links and functionality
   - Verify responsive design

7. **Add Project Management Features**
   - Project search/filtering by category and tags
   - Featured project highlighting
   - Technology tag display with color coding
   - Responsive grid with auto-sizing

### Project Categories
- **Web Applications**: React, Vue, Angular apps
- **Data Science**: Analytics, ML, visualization projects
- **Music**: Audio production, DJ tools, streaming
- **Open Source**: GitHub contributions, libraries
- **Experiments**: Proof of concepts, learning projects

### Update Requirements
- Review and update existing project descriptions
- Add new projects using the new system
- Ensure all links are working
- Update project icons and styling
- Implement project categorization
- Add project filtering capabilities

## Phase 3: Deployment Process

### Pre-Deployment Checklist
- [ ] All changes tested locally
- [ ] No console errors
- [ ] All links working
- [ ] Mobile responsiveness verified
- [ ] AI regeneration functionality working

### Deployment Steps

#### Frontend Deployment (crog.gg)
```bash
# SSH into frontend server
ssh crog-frontend

# Navigate to project directory
cd /var/www/crog.gg

# Update code
git fetch origin
git reset --hard origin/main

# Build frontend
cd frontend
npm install
npm run build

# Restart nginx
sudo systemctl restart nginx
```

#### Backend Deployment (api.crog.gg)
```bash
# SSH into backend server
ssh crog-backend

# Navigate to backend repository
cd /var/www/api.crog.gg

# Update code
git fetch origin
git reset --hard origin/main

# Restart the Gunicorn service
cd systemd
./deploy-services.sh restart
```

### Quick Deployment Commands
```bash
# Frontend
ssh crog-frontend "cd /var/www/crog.gg && git fetch origin && git reset --hard origin/main && cd frontend && npm install && npm run build && sudo systemctl restart nginx"

# Backend
ssh crog-backend "cd /var/www/api.crog.gg && git fetch origin && git reset --hard origin/main && cd systemd && ./deploy-services.sh restart"
```

## Phase 4: Post-Deployment Recommendations

### Immediate Improvements
1. **Content Management**: Implement a simple admin interface for content editing
2. **Analytics**: Add Google Analytics or similar tracking
3. **Performance**: Implement lazy loading for images and components
4. **SEO**: Add meta tags, structured data, and sitemap

### Long-term Enhancements
1. **CMS Integration**: Consider headless CMS for non-technical content management
2. **A/B Testing**: Implement content variation testing
3. **User Analytics**: Track which content variations perform best
4. **Automated Deployment**: Set up CI/CD pipeline
5. **Content Versioning**: Implement content versioning and rollback capabilities

### Technical Debt
1. **Error Handling**: Improve error boundaries and user feedback
2. **Loading States**: Add skeleton loaders for better UX
3. **Accessibility**: Audit and improve accessibility compliance
4. **Testing**: Add unit and integration tests
5. **Documentation**: Create comprehensive documentation

## Risk Assessment

### Low Risk
- Content structure changes (if using markdown files)
- Project updates
- Styling improvements

### Medium Risk
- Backend API changes
- Database schema changes (if applicable)
- Third-party integrations

### High Risk
- Core architecture changes
- Authentication/authorization changes
- Payment processing (if applicable)

## Success Metrics
- [ ] Bio content is easily editable by non-technical users
- [ ] All projects display correctly with updated information
- [ ] Site loads without errors
- [ ] AI regeneration functionality works with new content structure
- [ ] Mobile responsiveness maintained
- [ ] Page load times remain under 3 seconds

## Enhanced Projects System Benefits

### Drop-in Project Addition
With the new system, adding projects becomes incredibly simple:

1. **Create New Project File**
   ```bash
   # Add a new project
   touch content/projects/my-new-project.json
   ```

2. **Fill in Project Details**
   ```json
   {
     "id": "my-new-project",
     "title": "My Amazing Project",
     "description": "A revolutionary new application",
     "url": "https://my-new-project.com",
     "icon": "fas fa-rocket",
     "category": "web-app",
     "technologies": ["React", "Node.js", "MongoDB"],
     "featured": true,
     "order": 5
   }
   ```

3. **Automatic Site Update**
   - Project appears on the site immediately
   - No code changes required
   - Version controlled automatically
   - Responsive layout maintained

### Advanced Project Features

#### Project Filtering & Search
- Filter by category (web-app, data-science, music, etc.)
- Search by technology stack
- Featured projects section
- Sort by date, popularity, or custom order

#### Rich Project Metadata
- Technology tags with color coding
- Project screenshots/gifs
- GitHub repository links
- Live demo links
- Project status (active, archived, experimental)

#### Responsive Project Grid
- Auto-sizing grid layout
- Hover effects and animations
- Mobile-optimized display
- Lazy loading for performance

## Timeline Estimate
- **Phase 1**: 2-3 hours (bio content refactoring)
- **Phase 2**: 3-4 hours (projects refactoring with new system)
- **Phase 3**: 1 hour (deployment)
- **Phase 4**: 2-4 hours (recommendations implementation)

**Total Estimated Time**: 8-12 hours

### Phase 2 Breakdown (Projects Refactoring)
- **Project Interface & Types**: 30 minutes
- **Project Loader Utility**: 1 hour
- **Portfolio Component Update**: 1.5 hours
- **Migrate Existing Projects**: 30 minutes
- **Testing & Refinement**: 1 hour

## Next Steps
1. Start with Phase 1 (bio content refactoring)
2. Test thoroughly before moving to Phase 2
3. Deploy changes incrementally
4. Monitor for issues after each deployment
5. Document any issues or improvements needed
