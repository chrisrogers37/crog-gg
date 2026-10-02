import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { prerender } from "./scripts/vite-prerender";

/**
 * `vite preview` stands in for a Vercel deployment with Web Analytics enabled
 * (#177): the insights script's path gets an empty script, where the SPA
 * fallback would otherwise serve index.html as JavaScript.
 */
const insightsPreview: Plugin = {
  name: "crog:insights-preview",
  configurePreviewServer(server) {
    server.middlewares.use("/_vercel/insights/script.js", (_req, res) => {
      res.setHeader("content-type", "text/javascript");
      res.end();
    });
  },
};

/**
 * The owner's files live in site/ at the repo root (#188), so a fork replaces
 * one folder. Its public/ is served as is, at the site's root.
 */
const SITE_PUBLIC = fileURLToPath(new URL("../site/public", import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: SITE_PUBLIC,
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and smaller initial bundle
        manualChunks: {
          // Core vendor libraries (React)
          "vendor-react": ["react", "react-dom", "react-router", "react-router/dom"],
          // Markdown rendering (heavy, only needed for project details)
          "vendor-markdown": [
            "react-markdown",
            "remark-gfm",
            "rehype-highlight",
          ],
          // Animation library
          "vendor-motion": ["framer-motion"],
          // State management
          "vendor-state": ["zustand"],
        },
      },
    },
  },
  plugins: [react(), prerender(), insightsPreview],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (_proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url,
            );
          });
        },
      },
    },
  },
});
