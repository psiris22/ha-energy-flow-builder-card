import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/card.ts",
      formats: ["es"],
      fileName: () => "energy-flow-builder-card.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
