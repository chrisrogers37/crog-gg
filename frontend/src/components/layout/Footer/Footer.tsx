import "./Footer.css";

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
