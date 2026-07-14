import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
const path = require('path');

export default defineConfig({
  base: "./", // important for deployed assets
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to the real backend during development
      "/api": {
        target: "https://stanfliet-ota-api.onrender.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path // keep the same /api prefix
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) return "vendor";
          if (id.includes("recharts")) return "charts";
          if (id.includes("leaflet") || id.includes("react-leaflet") || id.includes("leaflet.heat")) return "maps";
        }
      }
    }
  },
  resolve: {
    alias: {
      'mapbox-gl': path.resolve(__dirname, 'src/mapbox-gl-stub.js')
    }
  }
})
