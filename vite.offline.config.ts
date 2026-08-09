import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  publicDir: false,
  build: {
    outDir: "dist-offline",
    emptyOutDir: true,
    sourcemap: false,
    reportCompressedSize: false,
  },
  plugins: [
    {
      name: "offline-html",
      transformIndexHtml(html) {
        return html.replace(
          /\s*<link rel="icon"[^>]*href="\/favicon\.svg"[^>]*>\s*/,
          "\n",
        );
      },
    },
    react(),
    tsconfigPaths(),
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
});
