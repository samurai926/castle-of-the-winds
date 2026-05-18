import { defineConfig, Plugin } from "vite";

// Strips type="module" so itch.io CDN serves the script without CORS blocking
const noModuleType: Plugin = {
  name: "no-module-type",
  transformIndexHtml(html) {
    return html.replace(/<script type="module" crossorigin/g, "<script defer");
  },
};

export default defineConfig({
  base: "./",
  plugins: [noModuleType],
  build: {
    rollupOptions: {
      output: {
        format: "iife",
        inlineDynamicImports: true,
        entryFileNames: "[name]-[hash].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name]-[hash].[ext]",
      },
    },
  },
});
