import { useState } from "react";
import { useModalDialog } from "../../../hooks/useModalDialog";
import "./ProjectDemo.css";

type ProjectDemoProps = {
  url: string;
  title: string;
  height?: number;
};

/**
 * ProjectDemo
 *
 * Embeds a live demo of a web project in an iframe.
 * Includes loading state and fullscreen toggle.
 *
 * The site's Content-Security-Policy (`vercel.json`) allows frames only from
 * `https://open.spotify.com`, so a demo from any other host renders as a
 * blocked frame. A project shows this component when its `demo` differs from
 * its `url` (`hasLiveDemo` in utils/projectLinks.ts). A change that turns on a
 * live demo must add that demo's exact origin to `frame-src` in the same PR,
 * with no wildcards (#199). A demo this site serves can't be embedded at all:
 * every path sends `X-Frame-Options: DENY`.
 */
export function ProjectDemo({ url, title, height = 600 }: ProjectDemoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useModalDialog(isFullscreen, true);

  return (
    <dialog
      ref={dialogRef}
      open={!isFullscreen}
      className={`project-demo ${isFullscreen ? "fullscreen" : ""}`}
      aria-modal={isFullscreen}
      aria-label={`${title} demo`}
      onCancel={(event) => {
        event.preventDefault();
        setIsFullscreen(false);
      }}
    >
      <div className="demo-header">
        <div className="demo-actions">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="demo-link"
          >
            open in new tab
          </a>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="demo-fullscreen-btn"
            aria-pressed={isFullscreen}
            data-modal-focus
          >
            {isFullscreen ? "exit fullscreen" : "fullscreen"}
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
            <p>loading demo...</p>
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
    </dialog>
  );
}
