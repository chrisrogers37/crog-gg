import { useState } from "react";
import "./ProjectDemo.css";

interface ProjectDemoProps {
  url: string;
  title: string;
  height?: number;
}

/**
 * ProjectDemo
 *
 * Embeds a live demo of a web project in an iframe.
 * Includes loading state and fullscreen toggle.
 *
 * The site's Content-Security-Policy (`vercel.json`) allows frames only from
 * `https://open.spotify.com`, so a demo from any other host renders as a
 * blocked frame. A change that turns on a live demo must add that demo's exact
 * origin to `frame-src` in the same PR, with no wildcards (#199).
 */
export function ProjectDemo({ url, title, height = 600 }: ProjectDemoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`project-demo ${isFullscreen ? "fullscreen" : ""}`}>
      <div className="demo-header">
        <h3 className="demo-title">Live Demo</h3>
        <div className="demo-actions">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="demo-link"
          >
            Open in new tab
          </a>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="demo-fullscreen-btn"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div
        className="demo-container"
        style={{ height: isFullscreen ? "80vh" : height }}
      >
        {isLoading && (
          <div className="demo-loading">
            <div className="spinner" />
            <p>Loading demo...</p>
          </div>
        )}
        <iframe
          src={url}
          title={title}
          className="demo-iframe"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
