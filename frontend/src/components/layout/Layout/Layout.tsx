import { useLayoutEffect, useState } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";
import { MobileMenu } from "../MobileMenu";
import {
  SectionMenuContext,
  type SectionMenu,
} from "../MobileMenu/sectionMenu";
import { useContentLoader, useFeatures } from "../../../hooks";
import "./Layout.css";

/**
 * A new page opens at the top; without this the window kept the last page's
 * scroll, so a link at the bottom of / opened /projects halfway down.
 *
 * Instant, not smooth: index.css makes scrolling smooth for in-page links, and
 * a smooth scroll to the top stopped short when the new page's content moved
 * under it. React Router's ScrollRestoration can't be told otherwise, and it
 * also restored the first load's position on a plain `#contact` link.
 * Back and forward ("POP") keep the browser's own restoration, and a hash link
 * keeps its smooth scroll to the target.
 *
 * An in-page link's smooth scroll can still be moving when the visitor
 * leaves, and in Chromium one instant scrollTo doesn't stop it: it carried
 * on down the new page. So smooth scrolling is off for the jump, the jump
 * says it's instant (one that names no behavior can land after layout, once
 * smooth scrolling is back on), and it's made again on the next frame, after
 * the old animation's last step.
 */
function useScrollToTopOnNavigate() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  useLayoutEffect(() => {
    if (navigationType === "POP" || hash) return;
    const root = document.documentElement;
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    root.style.scrollBehavior = "auto";
    toTop();
    requestAnimationFrame(() => {
      toTop();
      root.style.scrollBehavior = "";
    });
  }, [pathname, hash, navigationType]);
}

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
  const [sectionMenu, setSectionMenu] = useState<SectionMenu | null>(null);
  useScrollToTopOnNavigate();

  // Load content here rather than in a page component: Layout wraps every
  // route, so content is fetched no matter which route the user enters on.
  useContentLoader();
  useFeatures();

  return (
    <SectionMenuContext.Provider value={setSectionMenu}>
      <div className="layout">
        <header className="compact-header">
          <Navigation />
        </header>

        {/* Main content - renders child routes */}
        <main className="layout-main">
          <Outlet />
        </main>

        <Footer />

        <MobileMenu {...sectionMenu} />

      </div>
    </SectionMenuContext.Provider>
  );
}
