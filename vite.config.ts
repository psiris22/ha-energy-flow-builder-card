import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/card.ts",
      formats: ["es"],
      // HACS identifies dashboard plugins by a JavaScript file matching the repository name.
      fileName: () => "ha-energy-flow-builder-card.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
