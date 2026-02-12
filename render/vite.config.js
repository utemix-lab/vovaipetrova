import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "/vovaipetrova/",
  test: {
    include: ["src/**/*.test.{js,jsx}"],
    environment: "jsdom"
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true
  },
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html")
      }
    }
  }
});
