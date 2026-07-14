import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
const path = require("path");

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://stanfliet-ota-api.onrender.com",
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild"
  },
  resolve: {
    alias: {
      "mapbox-gl": path.resolve(__dirname, "src/mapbox-gl-stub.js")
    }
  }
})
