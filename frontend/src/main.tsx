import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.tsx";
import { startAnalytics } from "./services/analytics";
import { applyTheme, readStoredTheme } from "./store/theme";

// Before React renders, so the first paint is already in the stored theme.
applyTheme(readStoredTheme());

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
