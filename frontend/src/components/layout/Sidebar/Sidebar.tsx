import { useLocation, useNavigate } from "react-router-dom";
import { useUIStore } from "../../../store/uiStore";
import { Send, Music, Menu, X, Compass } from "lucide-react";

function GitHubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function TwitterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
import "./Sidebar.css";

const NAV_ITEMS = [
  { id: "about", label: "About", href: "/#about" },
  { id: "journey", label: "Journey", href: "/journey" },
  { id: "projects", label: "Projects", href: "/projects" },
  { id: "claudfather", label: "Claudfather", href: "/claudfather" },
  { id: "music", label: "Music", href: "/music" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SOCIAL_LINKS: { icon: any; href: string; label: string }[] = [
  { icon: TwitterIcon, href: "https://x.com/crogers37", label: "Twitter/X" },
  {
    icon: GitHubIcon,
    href: "https://github.com/chrisrogers37",
    label: "GitHub",
  },
  {
    icon: GitHubIcon,
    href: "https://github.com/Claudfather",
    label: "Claudfather Org",
  },
  {
    icon: LinkedInIcon,
    href: "https://linkedin.com/in/chrisrogers37",
    label: "LinkedIn",
  },
  { icon: Send, href: "https://t.me/crogers37", label: "Telegram" },
  {
    icon: Music,
    href: "https://open.spotify.com/artist/crog",
    label: "Spotify",
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSection, scrollProgress, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useUIStore();

  const handleNavClick = (item: (typeof NAV_ITEMS)[number]) => {
    closeMobileMenu();
    if (item.href.startsWith("/#")) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          document
            .getElementById(item.id)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        document
          .getElementById(item.id)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(item.href);
    }
  };

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.href.startsWith("/#")) {
      return location.pathname === "/" && activeSection === item.id;
    }
    return location.pathname.startsWith(item.href);
  };

  // Compass rotation: full rotation maps to scroll progress (0-1)
  const compassRotation = scrollProgress * 360;

  return (
    <>
      {/* Mobile top bar */}
      <div className="sidebar-mobile-bar">
        <div className="sidebar-mobile-bar-inner">
          <div>
            <span className="sidebar-name">Christopher Rogers</span>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="sidebar-mobile-toggle"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar (desktop: always visible, mobile: slide-in) */}
      <aside className={`sidebar ${isMobileMenuOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-content">
          {/* Identity */}
          <div className="sidebar-identity">
            <h1 className="sidebar-name">Christopher Rogers</h1>
            <p className="sidebar-headline">
              i build things that build things
            </p>
          </div>

          {/* Nav */}
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`sidebar-nav-item ${isActive(item) ? "sidebar-nav-item--active" : ""}`}
              >
                {isActive(item) && (
                  <Compass
                    size={14}
                    className="sidebar-compass"
                    style={{ transform: `rotate(${compassRotation}deg)` }}
                  />
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Social links */}
          <div className="sidebar-social">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-social-link"
                aria-label={link.label}
              >
                <link.icon size={18} />
              </a>
            ))}
          </div>

          {/* Cortana avatar placeholder */}
          <div className="sidebar-cortana">
            <div className="cortana-avatar" aria-label="AI assistant (coming soon)">
              <div className="cortana-avatar-inner" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={closeMobileMenu} />
      )}
    </>
  );
}
