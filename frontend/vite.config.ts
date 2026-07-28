import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and smaller initial bundle
        manualChunks: {
          // Core vendor libraries (React)
          "vendor-react": ["react", "react-dom", "react-router-dom"],
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
  plugins: [react()],
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
          proxy.on("proxyReq", (proxyReq, req, _res) => {
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
