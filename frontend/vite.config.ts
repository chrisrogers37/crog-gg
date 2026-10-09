import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { prerender } from "./scripts/vite-prerender";
import { site } from "./scripts/vite-site";

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

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Assign React's submodules explicitly: object-form entry lists let
        // Rollup move the shared JSX runtime into the lazy motion chunk,
        // which made even the 404 page preload the animation library.
        manualChunks(id) {
          if (/\/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) {
            return "vendor-react";
          }
          if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) {
            return "vendor-motion";
          }
          if (/\/node_modules\/(react-markdown|remark-gfm|rehype-highlight)\//.test(id)) {
            return "vendor-markdown";
          }
          if (id.includes("/node_modules/zustand/")) return "vendor-state";
        },
      },
    },
  },
  plugins: [react(), site(), prerender(), insightsPreview],
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
