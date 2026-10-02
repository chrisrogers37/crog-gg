import { useLayoutEffect, useState } from "react";
import {
  Outlet,
  useLocation,
  useMatches,
  useNavigationType,
} from "react-router-dom";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";
import { MobileMenu } from "../MobileMenu";
import {
  SectionMenuContext,
  type SectionMenu,
} from "../MobileMenu/sectionMenu";
import { useContentLoader } from "../../../hooks";
import "./Layout.css";

/**
 * A new page opens at the top; without this the window kept the last page's
 * scroll, so a link at the bottom of / opened /about halfway down.
 *
 * Instant, not smooth: index.css makes scrolling smooth for in-page links, and
 * a smooth scroll to the top stopped short when the new page's content moved
 * under it. React Router's ScrollRestoration can't be told otherwise, and it
 * also restored the first load's position on a plain `#quickstart` link.
 * Back and forward ("POP") keep the browser's own restoration, and a hash link
 * keeps its smooth scroll to the target.
 */
function useScrollToTopOnNavigate() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  useLayoutEffect(() => {
    if (navigationType === "POP" || hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navigationType]);
}

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
  useScrollToTopOnNavigate();

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

        <MobileMenu {...sectionMenu} />

      </div>
    </SectionMenuContext.Provider>
  );
}
