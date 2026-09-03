import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { lookupNaverShoppingPrices, type PriceLookupProduct } from "./server/naverShoppingPriceService";

const naverShoppingPriceApi = (): Plugin => {
  let credentials = { clientId: "", clientSecret: "" };
  const register = (middlewares: { use: (path: string, handler: (request: any, response: any, next: () => void) => void) => void }) => {
    middlewares.use("/api/prices", (request, response, next) => {
      if (request.method !== "POST") return next();
      let body = "";
      request.on("data", (chunk: unknown) => { body += String(chunk); });
      request.on("end", async () => {
        try {
          if (body.length > 64 * 1024) {
            response.statusCode = 413;
            response.end(JSON.stringify({ error: "Price request is too large" }));
            return;
          }
          const parsed = JSON.parse(body) as { products?: PriceLookupProduct[] };
          if (!Array.isArray(parsed.products) || parsed.products.length > 30 || parsed.products.some((product) => !product || typeof product.productId !== "string" || typeof product.mpn !== "string")) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: "products must contain at most 30 productId/MPN pairs" }));
            return;
          }
          const quotes = await lookupNaverShoppingPrices({ products: parsed.products, ...credentials });
          response.statusCode = 200;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.setHeader("cache-control", "private, max-age=300");
          response.end(JSON.stringify({ quotes }));
        } catch (error) {
          response.statusCode = credentials.clientId && credentials.clientSecret ? 502 : 503;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Price lookup failed" }));
        }
      });
    });
  };
  return {
    name: "naver-shopping-price-api",
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir, "");
      credentials = { clientId: env.NAVER_CLIENT_ID ?? "", clientSecret: env.NAVER_CLIENT_SECRET ?? "" };
    },
    configureServer(server) { register(server.middlewares); },
    configurePreviewServer(server) { register(server.middlewares); },
  };
};

export default defineConfig({
  plugins: [react(), naverShoppingPriceApi()],
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
