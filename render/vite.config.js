import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/vovaipetrova/",
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
