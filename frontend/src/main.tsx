import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.tsx";

/**
 * Initialize theme from localStorage or system preference.
 * This runs before React renders to prevent flash of wrong theme.
 */
function initializeTheme() {
  const stored = localStorage.getItem("ui-storage");
  let theme = "light";

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      theme = parsed.state?.theme || "light";
    } catch {
      // Invalid JSON, use default
    }
  }

  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.remove("dark");
  }
}

// Initialize theme before render
initializeTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
