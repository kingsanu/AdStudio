import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better development experience
      fastRefresh: true,
      // Configure JSX import source for emotion if needed
      jsxImportSource: "@emotion/react",
    }),
    tsconfigPaths(), // This helps with path resolution from tsconfig.json
  ],
  server: {
    host: "0.0.0.0", // Bind to all interfaces for Docker/Coolify
    port: 5173,
    allowedHosts: "all", // Allow all hosts for reverse proxy
    // Enable HMR
    hmr: {
      overlay: true, // Show error overlay
      host: 'localhost', // Specify HMR host
      port: 5173,
    },
    // Watch for changes in packages directory
    watch: {
      usePolling: false, // Use native file watching for better performance
      ignored: ["**/node_modules/**", "**/dist/**"],
    },
  },
  preview: {
    host: "0.0.0.0", // Bind to all interfaces for Docker/Coolify
    port: 4173,
    allowedHosts: "all", // Allow all hosts for reverse proxy
  },
  // Optimize dependencies for faster dev server startup
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "framer-motion",
      "lucide-react",
    ],
  },
  resolve: {
    alias: [
      {
        find: "canva-editor/components",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/components", import.meta.url)
        ),
      },
      {
        find: "canva-editor/utils",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/utils", import.meta.url)
        ),
      },
      {
        find: "canva-editor/types",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/types", import.meta.url)
        ),
      },
      {
        find: "canva-editor/layers",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/layers", import.meta.url)
        ),
      },
      {
        find: "canva-editor/hooks",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/hooks", import.meta.url)
        ),
      },
      {
        find: "canva-editor/layout",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/layout", import.meta.url)
        ),
      },
      {
        find: "canva-editor/icons",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/icons", import.meta.url)
        ),
      },
      {
        find: "canva-editor/color-picker",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/color-picker", import.meta.url)
        ),
      },
      {
        find: "canva-editor/drag-and-drop",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/drag-and-drop", import.meta.url)
        ),
      },
      {
        find: "canva-editor/search-autocomplete",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/search-autocomplete", import.meta.url)
        ),
      },
      {
        find: "canva-editor/tooltip",
        replacement: fileURLToPath(
          new URL("./packages/editor/src/tooltip", import.meta.url)
        ),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("src", import.meta.url)),
      },
    ],
  },
});
