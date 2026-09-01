import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // PcScene is lazy-loaded, so keep the 3D runtime out of the initial app chunk.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three/")) return "three";
          if (
            id.includes("node_modules/@react-three/") ||
            id.includes("node_modules/@use-gesture/") ||
            id.includes("node_modules/maath/")
          ) {
            return "react-three";
          }
          return undefined;
        },
      },
    },
  },
});
