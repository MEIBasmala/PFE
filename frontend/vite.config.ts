// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  // ✅ ADD THIS BUILD SECTION
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks for node_modules
          if (id.includes('node_modules')) {
            // Isolate React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Isolate icon library
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Isolate charting libraries if you use them
            if (id.includes('chart.js') || id.includes('recharts') || id.includes('@reactchartjs')) {
              return 'charts';
            }
            // Isolate TanStack Query if heavily used
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            // All other dependencies
            return 'vendor';
          }
        },
      },
    },
    // Optional: increase warning limit (not recommended, fix instead)
    // chunkSizeWarningLimit: 1000,
  },
}));