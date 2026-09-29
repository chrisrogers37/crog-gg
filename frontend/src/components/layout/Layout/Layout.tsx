import { useState } from "react";
import { Outlet, useMatches } from "react-router-dom";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";
import { MobileMenu } from "../MobileMenu";
import {
  SectionMenuContext,
  type SectionMenu,
} from "../MobileMenu/sectionMenu";
import { useContentLoader } from "../../../hooks";
import { useUIStore } from "../../../store";
import "./Layout.css";

/** Set on a route in router.tsx to opt out of the main column's padding. */
type RouteHandle = { fullBleed?: boolean };

/**
 * Layout Component
 *
 * Provides consistent structure across all pages:
 * - Compact header with navigation
 * - Main content area (via Outlet)
 * - Footer
 * - The mobile menu, which a page can add its own sections to
 *   (MobileMenu/sectionMenu.ts)
 */
export function Layout() {
  const fullBleed = useMatches().some(
    (match) => (match.handle as RouteHandle | undefined)?.fullBleed,
  );
  const [sectionMenu, setSectionMenu] = useState<SectionMenu | null>(null);
  const activeSection = useUIStore((state) => state.activeSection);

  // Load content here rather than in a page component: Layout wraps every
  // route, so content is fetched no matter which route the user enters on.
  useContentLoader();

  return (
    <SectionMenuContext.Provider value={setSectionMenu}>
      <div className="layout">
        <header className="compact-header">
          <Navigation />
        </header>

        {/* Main content - renders child routes */}
        <main className={`layout-main ${fullBleed ? "full-bleed" : ""}`}>
          <Outlet />
        </main>

        <Footer />

        <MobileMenu
          sections={sectionMenu?.sections}
          onSectionChange={sectionMenu?.onSectionChange}
          activeSection={activeSection}
        />
      </div>
    </SectionMenuContext.Provider>
  );
}
