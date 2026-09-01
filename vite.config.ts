import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js is isolated behind the lazy PcScene boundary; its vendor chunk is
    // intentionally larger than the default generic warning threshold.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three/")) return "three";
          if (id.includes("node_modules/@react-three/") || id.includes("node_modules/@use-gesture/") || id.includes("node_modules/maath/")) return "react-three";
          return undefined;
        },
      },
    },
  },
});
