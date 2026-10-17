import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Frontend talks to the Express API on :4000 in dev
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
