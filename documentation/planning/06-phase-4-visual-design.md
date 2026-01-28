# 06 - Phase 4: Visual Design

## Overview

**Goal**: Transform the portfolio into a visually stunning, modern website with smooth animations, dark mode support, and a cohesive design system.

**Estimated Effort**: 34 story points

**Prerequisites**:
- Phase 2 completed (component modularity)
- Can run in parallel with Phase 3 after Phase 2

**Deliverables**:
1. Tailwind CSS integration
2. Design token system
3. Framer Motion animations
4. Dark mode support
5. Responsive design improvements
6. Component visual refresh

---

## Table of Contents
1. [Task 4.1: Install Tailwind CSS](#task-41-install-tailwind-css)
2. [Task 4.2: Create Design Tokens](#task-42-create-design-tokens)
3. [Task 4.3: Install Framer Motion](#task-43-install-framer-motion)
4. [Task 4.4: Implement Dark Mode](#task-44-implement-dark-mode)
5. [Task 4.5: Animate Page Transitions](#task-45-animate-page-transitions)
6. [Task 4.6: Animate Components](#task-46-animate-components)
7. [Task 4.7: Create Hero Section](#task-47-create-hero-section)
8. [Task 4.8: Refresh Card Designs](#task-48-refresh-card-designs)
9. [Task 4.9: Responsive Improvements](#task-49-responsive-improvements)
10. [Design Reference](#design-reference)
11. [Verification Checklist](#verification-checklist)

---

## Task 4.1: Install Tailwind CSS

### What We're Doing
Adding Tailwind CSS for utility-first styling and a consistent design system.

### Installation Steps

```bash
cd frontend

# Install Tailwind and dependencies
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind config
npx tailwindcss init -p
```

### Create File: `frontend/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      // Custom color palette
      colors: {
        // Primary blue
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Accent purple (for fantasy mode)
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Neutral grays
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },

      // Typography
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'monospace',
        ],
      },

      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // Border radius
      borderRadius: {
        '4xl': '2rem',
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },

      // Box shadows
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
      },

      // Backdrop blur
      backdropBlur: {
        xs: '2px',
      },

      // Typography plugin configuration
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.slate.700'),
            a: {
              color: theme('colors.primary.600'),
              '&:hover': {
                color: theme('colors.primary.700'),
              },
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.slate.300'),
            a: {
              color: theme('colors.primary.400'),
              '&:hover': {
                color: theme('colors.primary.300'),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
```

### Update File: `frontend/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom base styles */
@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-slate-50 text-slate-800 antialiased;
    @apply dark:bg-slate-900 dark:text-slate-200;
  }

  /* Focus styles for accessibility */
  *:focus-visible {
    @apply outline-2 outline-offset-2 outline-primary-500;
  }
}

/* Custom component classes */
@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2;
    @apply px-4 py-2 rounded-lg font-medium;
    @apply transition-all duration-200;
    @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
  }

  .btn-primary {
    @apply bg-primary-600 text-white;
    @apply hover:bg-primary-700;
    @apply focus-visible:ring-primary-500;
  }

  .btn-secondary {
    @apply bg-slate-100 text-slate-700;
    @apply hover:bg-slate-200;
    @apply dark:bg-slate-800 dark:text-slate-200;
    @apply dark:hover:bg-slate-700;
    @apply focus-visible:ring-slate-500;
  }

  .btn-ghost {
    @apply bg-transparent text-slate-600;
    @apply hover:bg-slate-100;
    @apply dark:text-slate-400 dark:hover:bg-slate-800;
  }

  .card {
    @apply bg-white rounded-xl border border-slate-200 shadow-soft;
    @apply dark:bg-slate-800 dark:border-slate-700;
  }

  .section-heading {
    @apply text-2xl font-bold text-slate-900;
    @apply dark:text-white;
  }

  .link {
    @apply text-primary-600 hover:text-primary-700;
    @apply dark:text-primary-400 dark:hover:text-primary-300;
    @apply transition-colors;
  }

  .input {
    @apply w-full px-4 py-2 rounded-lg;
    @apply border border-slate-300 bg-white;
    @apply focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20;
    @apply dark:border-slate-600 dark:bg-slate-800;
    @apply transition-colors;
  }
}

/* Custom utility classes */
@layer utilities {
  .text-gradient {
    @apply bg-clip-text text-transparent;
    @apply bg-gradient-to-r from-primary-600 to-accent-600;
  }

  .bg-gradient-radial {
    background: radial-gradient(ellipse at center, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%);
  }
}
```

### Install Typography Plugin

```bash
npm install -D @tailwindcss/typography
```

---

## Task 4.2: Create Design Tokens

### What We're Doing
Establishing a consistent set of design tokens for spacing, colors, and typography.

### Create File: `frontend/src/styles/tokens.ts`

```typescript
/**
 * Design Tokens
 *
 * Central source of truth for design values.
 * Use these in JavaScript when Tailwind classes aren't suitable.
 */

export const tokens = {
  // Colors (matching Tailwind config)
  colors: {
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    accent: {
      main: '#7c3aed',
      light: '#8b5cf6',
      dark: '#6b21a8',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },

  // Spacing scale (in pixels, for JS usage)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  // Animation durations
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Animation easings
  easing: {
    easeOut: [0.0, 0.0, 0.2, 1],
    easeIn: [0.4, 0.0, 1, 1],
    easeInOut: [0.4, 0.0, 0.2, 1],
    spring: [0.175, 0.885, 0.32, 1.275],
  },

  // Breakpoints (matching Tailwind)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
  },
};

export type Tokens = typeof tokens;
```

---

## Task 4.3: Install Framer Motion

### What We're Doing
Adding Framer Motion for smooth, declarative animations.

### Installation

```bash
npm install framer-motion
```

### Create Animation Utilities: `frontend/src/utils/animations.ts`

```typescript
import { Variants, Transition } from 'framer-motion';

/**
 * Common animation variants for Framer Motion.
 * Import and use these in components for consistent animations.
 */

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
  exit: { opacity: 0 },
};

// Fade in with upward movement
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -20 },
};

// Fade in with downward movement
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Scale in animation
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// Slide in from right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// Slide in from left
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// Stagger children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Stagger item (for use with staggerContainer)
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// Hover scale effect
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

// Tap scale effect
export const tapScale = {
  scale: 0.98,
};

// Spring transition preset
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

// Page transition preset
export const pageTransition: Transition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1],
};
```

---

## Task 4.4: Implement Dark Mode

### What We're Doing
Adding dark mode support with system preference detection and manual toggle.

### Update UI Store: `frontend/src/store/uiStore.ts`

Add the theme functionality (already included in Phase 2, verify):

```typescript
// Theme management
setTheme: (theme: Theme) => {
  set({ theme });

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // System preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
},
```

### Create Theme Toggle Component: `frontend/src/components/common/ThemeToggle/ThemeToggle.tsx`

```typescript
import { motion } from 'framer-motion';
import { useUIStore } from '../../../store';
import './ThemeToggle.css';

/**
 * ThemeToggle
 *
 * Button to cycle through light/dark/system theme modes.
 * Uses icons to indicate current state.
 */
export function ThemeToggle() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '💻';
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'System preference';
    }
  };

  return (
    <motion.button
      onClick={cycleTheme}
      className="theme-toggle"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
      title={getLabel()}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {getIcon()}
      </motion.span>
    </motion.button>
  );
}
```

### Create CSS: `frontend/src/components/common/ThemeToggle/ThemeToggle.css`

```css
.theme-toggle {
  @apply w-10 h-10 flex items-center justify-center;
  @apply rounded-full bg-slate-100 dark:bg-slate-800;
  @apply border border-slate-200 dark:border-slate-700;
  @apply text-xl cursor-pointer;
  @apply transition-colors duration-200;
}

.theme-toggle:hover {
  @apply bg-slate-200 dark:bg-slate-700;
}
```

### Initialize Theme on App Load

Update `frontend/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize theme from localStorage or system preference
function initializeTheme() {
  const stored = localStorage.getItem('ui-storage');
  let theme = 'system';

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      theme = parsed.state?.theme || 'system';
    } catch {
      // Invalid JSON, use default
    }
  }

  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}

initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Task 4.5: Animate Page Transitions

### What We're Doing
Adding smooth transitions when navigating between pages.

### Create AnimatedRoutes Component: `frontend/src/components/AnimatedRoutes.tsx`

```typescript
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { pageTransition } from '../utils/animations';

/**
 * AnimatedRoutes
 *
 * Wrapper that animates route transitions using Framer Motion.
 * Replace <Outlet /> with this component in Layout.
 */
export function AnimatedRoutes() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={pageTransition}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Update Layout to Use AnimatedRoutes

```typescript
// frontend/src/components/layout/Layout/Layout.tsx
import { AnimatedRoutes } from '../../AnimatedRoutes';

export function Layout() {
  // ...

  return (
    <div className="layout">
      {/* Header */}

      <main className="layout-main">
        <AnimatedRoutes />  {/* Replace <Outlet /> */}
      </main>

      {/* Footer */}
    </div>
  );
}
```

---

## Task 4.6: Animate Components

### What We're Doing
Adding micro-interactions and entrance animations to components.

### Example: Animated Card Component

```typescript
// frontend/src/components/common/AnimatedCard/AnimatedCard.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className = '', delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  );
}
```

### Example: Animated List

```typescript
// frontend/src/components/common/AnimatedList/AnimatedList.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { staggerContainer, staggerItem } from '../../../utils/animations';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className = '' }: AnimatedListProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className = '' }: AnimatedListItemProps) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}
```

### Update Skills Word Cloud with Animation

```typescript
// frontend/src/components/Skills/Skills.tsx
import { motion } from 'framer-motion';
import { useSkills } from '../../store';

export function Skills() {
  const skills = useSkills();

  return (
    <section className="skills-section">
      <h2>Skills</h2>
      <motion.div
        className="skill-cloud"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
          },
        }}
      >
        {skills.map((skill, index) => (
          <motion.span
            key={skill.name}
            className="skill-tag"
            style={{ fontSize: `${12 + skill.weight * 3}px` }}
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { type: 'spring', stiffness: 300, damping: 20 },
              },
            }}
            whileHover={{ scale: 1.1, color: '#2563eb' }}
          >
            {skill.name}
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
}
```

---

## Task 4.7: Create Hero Section

### What We're Doing
Designing an eye-catching hero section for the home page.

### Create File: `frontend/src/components/sections/Hero/Hero.tsx`

```typescript
import { motion } from 'framer-motion';
import { useBio } from '../../../store';
import { Typewriter } from '../../Typewriter';
import './Hero.css';

/**
 * Hero Section
 *
 * Eye-catching introduction with animated gradient background,
 * profile photo, and typewriter welcome message.
 */
export function Hero() {
  const bio = useBio();

  if (!bio) return null;

  return (
    <section className="hero">
      {/* Animated gradient background */}
      <div className="hero-background">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
      </div>

      <div className="hero-content">
        {/* Profile Photo */}
        <motion.div
          className="hero-photo-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <img
            src="/headshot.png"
            alt={bio.display_name}
            className="hero-photo"
          />
          <div className="hero-photo-ring" />
        </motion.div>

        {/* Name and Title */}
        <motion.div
          className="hero-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="hero-name">
            <span className="text-gradient">{bio.display_name}</span>
          </h1>
          <p className="hero-tagline">Software Engineer & Creator</p>
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          className="hero-welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Typewriter text={bio.welcome_message} speed={30} delay={800} />
        </motion.div>

        {/* Quick Links */}
        <motion.div
          className="hero-links"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <a href={bio.social_links.github} className="hero-link github">
            GitHub
          </a>
          <a href={bio.social_links.linkedin} className="hero-link linkedin">
            LinkedIn
          </a>
          <a href={`mailto:${bio.email}`} className="hero-link email">
            Contact
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span>Scroll to explore</span>
        <motion.div
          className="scroll-arrow"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          ↓
        </motion.div>
      </motion.div>
    </section>
  );
}
```

### Create File: `frontend/src/components/sections/Hero/Hero.css`

```css
.hero {
  @apply relative min-h-screen flex items-center justify-center;
  @apply overflow-hidden;
}

/* Animated gradient background */
.hero-background {
  @apply absolute inset-0 -z-10;
  @apply bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50;
  @apply dark:from-slate-900 dark:via-slate-900 dark:to-slate-800;
}

.gradient-orb {
  @apply absolute rounded-full opacity-30 blur-3xl;
  @apply animate-pulse-slow;
}

.orb-1 {
  @apply w-96 h-96 bg-primary-400;
  @apply -top-48 -left-48;
}

.orb-2 {
  @apply w-80 h-80 bg-accent-400;
  @apply top-1/2 -right-40;
  animation-delay: 1s;
}

.orb-3 {
  @apply w-64 h-64 bg-primary-300;
  @apply -bottom-32 left-1/3;
  animation-delay: 2s;
}

.hero-content {
  @apply relative z-10 text-center px-4;
  @apply max-w-2xl mx-auto;
}

/* Profile Photo */
.hero-photo-container {
  @apply relative inline-block mb-6;
}

.hero-photo {
  @apply w-40 h-40 md:w-48 md:h-48 rounded-full;
  @apply object-cover border-4 border-white;
  @apply shadow-soft-lg;
}

.hero-photo-ring {
  @apply absolute inset-0 rounded-full;
  @apply border-4 border-primary-400/30;
  @apply animate-pulse-slow;
  transform: scale(1.1);
}

/* Text */
.hero-name {
  @apply text-4xl md:text-5xl lg:text-6xl font-bold mb-2;
}

.hero-tagline {
  @apply text-xl md:text-2xl text-slate-600 dark:text-slate-400;
  @apply mb-6;
}

.hero-welcome {
  @apply text-lg text-slate-700 dark:text-slate-300;
  @apply max-w-xl mx-auto mb-8;
  @apply min-h-[4rem];
}

/* Links */
.hero-links {
  @apply flex flex-wrap justify-center gap-4;
}

.hero-link {
  @apply px-6 py-3 rounded-full font-medium;
  @apply transition-all duration-200;
}

.hero-link.github {
  @apply bg-slate-900 text-white;
  @apply hover:bg-slate-800 hover:shadow-lg;
  @apply dark:bg-white dark:text-slate-900;
  @apply dark:hover:bg-slate-100;
}

.hero-link.linkedin {
  @apply bg-blue-600 text-white;
  @apply hover:bg-blue-700 hover:shadow-lg;
}

.hero-link.email {
  @apply bg-white text-slate-700 border border-slate-200;
  @apply hover:border-primary-300 hover:text-primary-600;
  @apply dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700;
}

/* Scroll indicator */
.scroll-indicator {
  @apply absolute bottom-8 left-1/2 -translate-x-1/2;
  @apply text-slate-400 text-sm;
  @apply flex flex-col items-center gap-2;
}

.scroll-arrow {
  @apply text-xl;
}
```

---

## Task 4.8: Refresh Card Designs

### What We're Doing
Updating card components with modern design patterns.

### Example: Modern Project Card

```typescript
// Updated ProjectCard with Tailwind and Motion
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Project } from '../../../types';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/projects/${project.id}`}
        className="group block"
      >
        <div className="
          relative overflow-hidden rounded-2xl
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          p-6 h-full
          transition-all duration-300
          hover:shadow-soft-lg hover:border-primary-200
          dark:hover:border-primary-800
          hover:-translate-y-1
        ">
          {/* Icon */}
          <div className="
            w-12 h-12 rounded-xl mb-4
            bg-gradient-to-br from-primary-500 to-accent-500
            flex items-center justify-center text-2xl
          ">
            {project.icon || '📁'}
          </div>

          {/* Content */}
          <h3 className="
            text-lg font-semibold text-slate-900 dark:text-white
            group-hover:text-primary-600 dark:group-hover:text-primary-400
            transition-colors mb-2
          ">
            {project.title}
          </h3>

          <p className="
            text-slate-600 dark:text-slate-400
            text-sm line-clamp-2 mb-4
          ">
            {project.description}
          </p>

          {/* Technologies */}
          <div className="flex flex-wrap gap-2">
            {project.technologies?.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="
                  px-2 py-1 text-xs rounded-md
                  bg-slate-100 dark:bg-slate-700
                  text-slate-600 dark:text-slate-400
                "
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Arrow indicator */}
          <div className="
            absolute bottom-6 right-6
            text-slate-300 dark:text-slate-600
            group-hover:text-primary-500
            group-hover:translate-x-1
            transition-all duration-200
          ">
            →
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
```

---

## Task 4.9: Responsive Improvements

### Responsive Design Checklist

Update components to use these Tailwind responsive patterns:

```typescript
// Responsive grid example
<div className="
  grid gap-6
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
">
  {/* Cards */}
</div>

// Responsive typography
<h1 className="
  text-2xl
  sm:text-3xl
  md:text-4xl
  lg:text-5xl
">
  Title
</h1>

// Responsive padding
<section className="
  px-4 py-8
  sm:px-6 sm:py-12
  md:px-8 md:py-16
  lg:px-12 lg:py-20
">
  Content
</section>

// Responsive flex direction
<div className="
  flex flex-col
  md:flex-row
  gap-4 md:gap-8
">
  {/* Items */}
</div>
```

---

## Design Reference

### Color Palette

| Color | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| Primary | #2563eb | #3b82f6 | CTAs, links, active states |
| Accent | #7c3aed | #8b5cf6 | Fantasy mode, highlights |
| Background | #f8fafc | #0f172a | Page background |
| Surface | #ffffff | #1e293b | Cards, containers |
| Text Primary | #1e293b | #f8fafc | Headings |
| Text Secondary | #64748b | #94a3b8 | Body text |
| Border | #e2e8f0 | #334155 | Dividers, card borders |

### Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2.5rem (40px) | 700 | 1.2 |
| H2 | 1.5rem (24px) | 600 | 1.3 |
| H3 | 1.25rem (20px) | 600 | 1.4 |
| Body | 1rem (16px) | 400 | 1.6 |
| Small | 0.875rem (14px) | 400 | 1.5 |
| Caption | 0.75rem (12px) | 500 | 1.4 |

### Spacing Scale

| Name | Value | Usage |
|------|-------|-------|
| xs | 0.25rem (4px) | Tight spacing |
| sm | 0.5rem (8px) | Compact elements |
| md | 1rem (16px) | Default spacing |
| lg | 1.5rem (24px) | Section padding |
| xl | 2rem (32px) | Large gaps |
| 2xl | 3rem (48px) | Section margins |

---

## Verification Checklist

### Visual Tests

- [ ] **Dark mode toggle**: Switches between light/dark/system
- [ ] **System preference**: Follows OS dark mode setting
- [ ] **Animations play**: Page transitions, card hovers work
- [ ] **Hero section**: Gradient background and animations work
- [ ] **Responsive**: Layout works on mobile, tablet, desktop

### Performance Tests

- [ ] **No layout shift**: CLS score under 0.1
- [ ] **Animation performance**: 60fps animations (check DevTools)
- [ ] **Bundle size**: Tailwind purged CSS is small

### Accessibility Tests

- [ ] **Color contrast**: All text passes WCAG AA
- [ ] **Focus states**: Visible focus indicators
- [ ] **Reduced motion**: Respects `prefers-reduced-motion`

---

## Next Steps

After completing Phase 4:

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Phase 4: Visual design refresh with Tailwind and animations"
   ```

2. **Proceed to Phase 5**: [07-phase-5-seo-content.md](./07-phase-5-seo-content.md)

---

*Document Version: 1.0.0*
*Last Updated: January 2026*
