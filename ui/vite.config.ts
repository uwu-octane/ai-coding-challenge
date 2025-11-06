import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: parseInt(process.env.VITE_PORT || "7787", 10),
    host: "0.0.0.0",
    strictPort: false,
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://localhost:7788",
        changeOrigin: true,
      },
    },
  },
});
