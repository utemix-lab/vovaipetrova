import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/dream-graph/",
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        system: resolve(__dirname, "system.html"),
        constructor: resolve(__dirname, "constructor.html")
      }
    }
  },
  server: {
    // Проксировать contracts из соседней папки
    proxy: {
      "/contracts": {
        target: "http://localhost:5173",
        rewrite: (path) => path.replace(/^\/contracts/, "/../contracts")
      }
    },
    fs: {
      // Разрешить доступ к contracts
      allow: [".", "../contracts"]
    }
  }
});
