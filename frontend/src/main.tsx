import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import "./styles/page.css";
import App from "./App.tsx";
import { startAnalytics } from "./services/analytics";
import { useUIStore } from "./store/uiStore";
import { applyTheme, DARK_QUERY } from "./store/theme";

// The store has already loaded the saved theme, or kept the default when site
// data is blocked (#196 M70). It goes on <html> before React renders, so
// React's first paint is in it, and again whenever the OS theme switches, which
// shows under "system". (The HTML shell can still paint light before the
// scripts run; an inline script would need a CSP hash.)
const applyCurrentTheme = () => applyTheme(useUIStore.getState().theme);
applyCurrentTheme();
window.matchMedia(DARK_QUERY).addEventListener("change", applyCurrentTheme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);

// render() only schedules React's first render, so the script request overlaps
// it rather than queueing behind it (#177; measured, see the PR).
startAnalytics();
