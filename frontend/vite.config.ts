import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync } from "fs";
import { join } from "path";

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
            "rehype-raw",
          ],
          // Animation library
          "vendor-motion": ["framer-motion"],
          // State management
          "vendor-state": ["zustand"],
        },
      },
    },
  },
  plugins: [
    react(),
    {
      name: "copy-content",
      writeBundle() {
        // Copy content directory to dist
        const srcContent = join(__dirname, "src/content");
        const distContent = join(__dirname, "dist/content");

        try {
          mkdirSync(distContent, { recursive: true });
          copyFileSync(
            join(srcContent, "bio.yaml"),
            join(distContent, "bio.yaml"),
          );
          copyFileSync(
            join(srcContent, "education.yaml"),
            join(distContent, "education.yaml"),
          );
          copyFileSync(
            join(srcContent, "experience.yaml"),
            join(distContent, "experience.yaml"),
          );
          copyFileSync(
            join(srcContent, "skills.yaml"),
            join(distContent, "skills.yaml"),
          );

          // Copy projects directory
          const srcProjects = join(srcContent, "projects");
          const distProjects = join(distContent, "projects");
          mkdirSync(distProjects, { recursive: true });

          copyFileSync(
            join(srcProjects, "index.yaml"),
            join(distProjects, "index.yaml"),
          );
          copyFileSync(
            join(srcProjects, "30-day-abs.yaml"),
            join(distProjects, "30-day-abs.yaml"),
          );
          copyFileSync(
            join(srcProjects, "shitpost-alpha.yaml"),
            join(distProjects, "shitpost-alpha.yaml"),
          );
          copyFileSync(
            join(srcProjects, "shuffify.yaml"),
            join(distProjects, "shuffify.yaml"),
          );
          copyFileSync(
            join(srcProjects, "city-cycles.yaml"),
            join(distProjects, "city-cycles.yaml"),
          );
          copyFileSync(
            join(srcProjects, "storyline-ai.yaml"),
            join(distProjects, "storyline-ai.yaml"),
          );
          copyFileSync(
            join(srcProjects, "github.yaml"),
            join(distProjects, "github.yaml"),
          );

          console.log("Content files copied to dist/");
        } catch (error) {
          console.error("Error copying content files:", error);
        }
      },
    },
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
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
